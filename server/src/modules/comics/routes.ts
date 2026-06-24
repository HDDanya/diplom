import { ComicStatus, TransitionStyle } from "@prisma/client";
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import slugify from "slugify";
import { z } from "zod";

const imageUrlSchema = z
  .string()
  .max(500)
  .refine(
    (value) => value === "" || value.startsWith("/uploads/") || value.startsWith("https://") || value.startsWith("http://"),
    "Изображение должно быть локальным /uploads URL или HTTP(S)-ссылкой"
  );

const pageInputSchema = z.object({
  pageKey: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(4000),
  imageUrl: imageUrlSchema.optional().or(z.literal("")),
  panelImageUrls: z.array(imageUrlSchema).max(12).optional().default([]),
  sketchPrompt: z.string().max(1000).optional().or(z.literal("")),
  transitionStyle: z.nativeEnum(TransitionStyle).default(TransitionStyle.SLIDE_LEFT),
  position: z.number().int().min(1),
  isStart: z.boolean().default(false),
  choices: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        targetPageKey: z.string().min(1).max(64)
      })
    )
    .max(8)
    .default([])
});

const comicWriteSchema = z.object({
  title: z.string().min(2).max(140),
  summary: z.string().min(10).max(700),
  script: z.string().max(5000).optional().or(z.literal("")),
  coverImageUrl: imageUrlSchema.optional().or(z.literal("")),
  status: z.nativeEnum(ComicStatus).optional().default(ComicStatus.DRAFT),
  pages: z.array(pageInputSchema).min(1).max(100)
});

const progressSchema = z.object({
  currentPageId: z.string().uuid()
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().min(5).max(2000)
});

async function createUniqueSlug(app: any, title: string, currentComicId?: string) {
  const base = slugify(title, { lower: true, strict: true, trim: true }) || "comic";
  let candidate = base;
  let index = 1;

  while (true) {
    const existing = await app.prisma.comic.findFirst({
      where: {
        slug: candidate,
        ...(currentComicId ? { id: { not: currentComicId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    index += 1;
    candidate = `${base}-${index}`;
  }
}

function getReviewSummary(reviews: Array<{ rating: number }>) {
  if (reviews.length === 0) {
    return {
      averageRating: null,
      reviewsCount: 0
    };
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return {
    averageRating: Number(averageRating.toFixed(1)),
    reviewsCount: reviews.length
  };
}

async function resolveViewerId(request: FastifyRequest): Promise<string | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const user = (await request.jwtVerify()) as { userId: string };
    return user.userId;
  } catch {
    return null;
  }
}

function normalizeStartPage(pages: z.infer<typeof pageInputSchema>[]) {
  const startPages = pages.filter((page) => page.isStart);
  if (startPages.length === 0) {
    pages[0].isStart = true;
    return;
  }

  if (startPages.length > 1) {
    let firstMarked = false;
    pages.forEach((page) => {
      if (page.isStart && !firstMarked) {
        firstMarked = true;
        return;
      }
      if (page.isStart) {
        page.isStart = false;
      }
    });
  }
}

function validateGraph(pages: z.infer<typeof pageInputSchema>[]) {
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.pageKey)) {
      throw new Error(`Дублирующийся pageKey: ${page.pageKey}`);
    }
    seen.add(page.pageKey);
  }

  for (const page of pages) {
    for (const choice of page.choices) {
      if (!seen.has(choice.targetPageKey)) {
        throw new Error(`Выбор "${choice.label}" ссылается на неизвестную страницу ${choice.targetPageKey}`);
      }
    }
  }
}

async function replaceComicGraph(
  app: any,
  comicId: string,
  pages: z.infer<typeof pageInputSchema>[]
) {
  return app.prisma.$transaction(async (tx: any) => {
    const existingPages = await tx.comicPage.findMany({ where: { comicId }, select: { id: true } });
    if (existingPages.length) {
      const ids = existingPages.map((page: { id: string }) => page.id);
      await tx.comicChoice.deleteMany({ where: { OR: [{ pageId: { in: ids } }, { targetPageId: { in: ids } }] } });
      await tx.readProgress.deleteMany({ where: { comicId } });
      await tx.comicPage.deleteMany({ where: { comicId } });
    }

    const createdPages = [] as Array<{ id: string; pageKey: string }>;
    for (const page of pages) {
      const created = await tx.comicPage.create({
        data: {
          comicId,
          pageKey: page.pageKey,
          title: page.title,
          body: page.body,
          imageUrl: page.imageUrl || null,
          panelImageUrls: page.panelImageUrls
            .map((imageUrl) => imageUrl.trim())
            .filter(Boolean)
            .slice(0, 12),
          sketchPrompt: page.sketchPrompt || null,
          transitionStyle: page.transitionStyle,
          position: page.position,
          isStart: page.isStart
        }
      });
      createdPages.push({ id: created.id, pageKey: created.pageKey });
    }

    const pageIdByKey = new Map(createdPages.map((page) => [page.pageKey, page.id]));
    const choices = pages.flatMap((page) =>
      page.choices.map((choice) => ({
        pageId: pageIdByKey.get(page.pageKey)!,
        label: choice.label,
        targetPageId: pageIdByKey.get(choice.targetPageKey)!
      }))
    );

    if (choices.length) {
      await tx.comicChoice.createMany({ data: choices });
    }
  });
}

export const comicsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public", async (request) => {
    const query = z
      .object({
        search: z.string().optional(),
        author: z.string().optional(),
        year: z.coerce.number().int().min(1900).max(2100).optional(),
        minYear: z.coerce.number().int().min(1900).max(2100).optional(),
        maxYear: z.coerce.number().int().min(1900).max(2100).optional(),
        minRating: z.coerce.number().min(1).max(5).optional(),
        minPages: z.coerce.number().int().min(1).optional(),
        maxPages: z.coerce.number().int().min(1).optional(),
        sort: z.enum(["updated", "rating", "bookmarks", "title"]).optional().default("updated")
      })
      .parse(request.query);

    const viewerId = await resolveViewerId(request);
    const minYear = query.year ?? query.minYear;
    const maxYear = query.year ?? query.maxYear;
    const createdAt =
      minYear || maxYear
        ? {
            ...(minYear ? { gte: new Date(Date.UTC(minYear, 0, 1)) } : {}),
            ...(maxYear ? { lt: new Date(Date.UTC(maxYear + 1, 0, 1)) } : {})
          }
        : undefined;

    const comics = await app.prisma.comic.findMany({
      where: {
        status: ComicStatus.PUBLISHED,
        ...(createdAt ? { createdAt } : {}),
        ...(query.author
          ? {
              author: {
                displayName: { contains: query.author, mode: "insensitive" }
              }
            }
          : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: "insensitive" } },
                { summary: { contains: query.search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        },
        pages: {
          select: { id: true }
        },
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    const bookmarkedComicIds = new Set<string>();
    if (viewerId && comics.length > 0) {
      const bookmarks = await app.prisma.comicBookmark.findMany({
        where: {
          userId: viewerId,
          comicId: { in: comics.map((comic) => comic.id) }
        },
        select: { comicId: true }
      });
      bookmarks.forEach((bookmark) => bookmarkedComicIds.add(bookmark.comicId));
    }

    const mappedComics = comics
      .map((comic) => {
        const reviewSummary = getReviewSummary(comic.reviews);
        return {
        id: comic.id,
        slug: comic.slug,
        title: comic.title,
        summary: comic.summary,
        coverImageUrl: comic.coverImageUrl,
        status: comic.status,
        createdAt: comic.createdAt,
        updatedAt: comic.updatedAt,
        author: comic.author,
        pagesCount: comic.pages.length,
        bookmarksCount: comic._count.bookmarks,
          averageRating: reviewSummary.averageRating,
          reviewsCount: reviewSummary.reviewsCount,
        isBookmarked: bookmarkedComicIds.has(comic.id)
        };
      })
      .filter((comic) => (query.minPages ? comic.pagesCount >= query.minPages : true))
      .filter((comic) => (query.maxPages ? comic.pagesCount <= query.maxPages : true))
      .filter((comic) => (query.minRating ? (comic.averageRating ?? 0) >= query.minRating : true))
      .sort((left, right) => {
        if (query.sort === "rating") {
          return (right.averageRating ?? 0) - (left.averageRating ?? 0);
        }
        if (query.sort === "bookmarks") {
          return right.bookmarksCount - left.bookmarksCount;
        }
        if (query.sort === "title") {
          return left.title.localeCompare(right.title, "ru");
        }
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });

    return {
      comics: mappedComics
    };
  });

  app.get("/mine", { preHandler: [app.authenticate] }, async (request) => {
    const comics = await app.prisma.comic.findMany({
      where: { authorId: request.authUser.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        pages: {
          select: { id: true }
        },
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    return {
      comics: comics.map((comic) => {
        const reviewSummary = getReviewSummary(comic.reviews);
        return {
        id: comic.id,
        slug: comic.slug,
        title: comic.title,
        summary: comic.summary,
        coverImageUrl: comic.coverImageUrl,
        status: comic.status,
        createdAt: comic.createdAt,
        updatedAt: comic.updatedAt,
        pagesCount: comic.pages.length,
        bookmarksCount: comic._count.bookmarks,
          averageRating: reviewSummary.averageRating,
          reviewsCount: reviewSummary.reviewsCount,
        isBookmarked: false
        };
      })
    };
  });

  app.get("/bookmarks", { preHandler: [app.authenticate] }, async (request) => {
    const bookmarks = await app.prisma.comicBookmark.findMany({
      where: {
        userId: request.authUser.userId,
        comic: {
          status: ComicStatus.PUBLISHED
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        comic: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true
              }
            },
            pages: {
              select: { id: true }
            },
            reviews: {
              select: { rating: true }
            },
            _count: {
              select: { bookmarks: true }
            }
          }
        }
      }
    });

    return {
      comics: bookmarks.map((bookmark) => {
        const reviewSummary = getReviewSummary(bookmark.comic.reviews);
        return {
        id: bookmark.comic.id,
        slug: bookmark.comic.slug,
        title: bookmark.comic.title,
        summary: bookmark.comic.summary,
        coverImageUrl: bookmark.comic.coverImageUrl,
        status: bookmark.comic.status,
        createdAt: bookmark.comic.createdAt,
        updatedAt: bookmark.comic.updatedAt,
        author: bookmark.comic.author,
        pagesCount: bookmark.comic.pages.length,
        bookmarksCount: bookmark.comic._count.bookmarks,
          averageRating: reviewSummary.averageRating,
          reviewsCount: reviewSummary.reviewsCount,
        isBookmarked: true,
        bookmarkedAt: bookmark.createdAt
        };
      })
    };
  });

  app.get("/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params);

    const comic = await app.prisma.comic.findUnique({
      where: { slug: params.slug },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        },
        pages: {
          include: {
            outgoingChoices: true
          },
          orderBy: { position: "asc" }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { updatedAt: "desc" }
        },
        _count: {
          select: { bookmarks: true }
        }
      }
    });

    if (!comic) {
      return reply.notFound("Комикс не найден");
    }

    const viewerId = await resolveViewerId(request);

    const canView = comic.status === ComicStatus.PUBLISHED || comic.authorId === viewerId;
    if (!canView) {
      return reply.forbidden("Комикс пока не опубликован");
    }

    let isBookmarked = false;
    let myReviewId: string | null = null;
    if (viewerId) {
      const bookmark = await app.prisma.comicBookmark.findUnique({
        where: {
          userId_comicId: {
            userId: viewerId,
            comicId: comic.id
          }
        }
      });
      isBookmarked = Boolean(bookmark);
      myReviewId = comic.reviews.find((review) => review.userId === viewerId)?.id ?? null;
    }
    const reviewSummary = getReviewSummary(comic.reviews);

    return {
      comic: {
        id: comic.id,
        slug: comic.slug,
        title: comic.title,
        summary: comic.summary,
        script: comic.script,
        coverImageUrl: comic.coverImageUrl,
        status: comic.status,
        author: comic.author,
        createdAt: comic.createdAt,
        updatedAt: comic.updatedAt,
        bookmarksCount: comic._count.bookmarks,
        averageRating: reviewSummary.averageRating,
        reviewsCount: reviewSummary.reviewsCount,
        isBookmarked,
        myReviewId,
        reviews: comic.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          body: review.body,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          user: review.user
        })),
        pages: comic.pages.map((page) => ({
          id: page.id,
          pageKey: page.pageKey,
          title: page.title,
          body: page.body,
          imageUrl: page.imageUrl,
          panelImageUrls: Array.isArray((page as any).panelImageUrls) ? (page as any).panelImageUrls : [],
          sketchPrompt: page.sketchPrompt,
          transitionStyle: page.transitionStyle,
          position: page.position,
          isStart: page.isStart,
          choices: page.outgoingChoices.map((choice) => ({
            id: choice.id,
            label: choice.label,
            targetPageId: choice.targetPageId
          }))
        }))
      }
    };
  });

  app.get("/:slug/read", async (request, reply) => {
    const params = z.object({ slug: z.string().min(1) }).parse(request.params);

    const comic = await app.prisma.comic.findUnique({
      where: { slug: params.slug },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        },
        pages: {
          include: {
            outgoingChoices: {
              select: {
                id: true,
                label: true,
                targetPageId: true
              }
            }
          },
          orderBy: { position: "asc" }
        }
      }
    });

    if (!comic) {
      return reply.notFound("Комикс не найден");
    }

    if (comic.status !== ComicStatus.PUBLISHED) {
      return reply.forbidden("Комикс ещё не опубликован");
    }

    const startPage = comic.pages.find((page) => page.isStart) ?? comic.pages[0];

    const viewerId = await resolveViewerId(request);
    let isBookmarked = false;
    if (viewerId) {
      const bookmark = await app.prisma.comicBookmark.findUnique({
        where: {
          userId_comicId: {
            userId: viewerId,
            comicId: comic.id
          }
        }
      });
      isBookmarked = Boolean(bookmark);
    }

    return {
      comic: {
        id: comic.id,
        slug: comic.slug,
        title: comic.title,
        summary: comic.summary,
        coverImageUrl: comic.coverImageUrl,
        author: comic.author,
        isBookmarked,
        startPageId: startPage?.id ?? null,
        pages: comic.pages.map((page) => ({
          id: page.id,
          pageKey: page.pageKey,
          title: page.title,
          body: page.body,
          imageUrl: page.imageUrl,
          panelImageUrls: Array.isArray((page as any).panelImageUrls) ? (page as any).panelImageUrls : [],
          sketchPrompt: page.sketchPrompt,
          transitionStyle: page.transitionStyle,
          position: page.position,
          isStart: page.isStart,
          choices: page.outgoingChoices.map((choice) => ({
            id: choice.id,
            label: choice.label,
            targetPageId: choice.targetPageId
          }))
        }))
      }
    };
  });

  app.post("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    const payload = comicWriteSchema.parse(request.body);
    normalizeStartPage(payload.pages);

    try {
      validateGraph(payload.pages);
    } catch (error: any) {
      return reply.badRequest(error.message);
    }

    const slug = await createUniqueSlug(app, payload.title);

    const comic = await app.prisma.comic.create({
      data: {
        title: payload.title,
        slug,
        summary: payload.summary,
        script: payload.script || null,
        coverImageUrl: payload.coverImageUrl || null,
        status: payload.status,
        authorId: request.authUser.userId
      }
    });

    await replaceComicGraph(app, comic.id, payload.pages);

    return reply.code(201).send({ comicId: comic.id, slug: comic.slug });
  });

  app.put("/:comicId", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);
    const payload = comicWriteSchema.parse(request.body);

    const comic = await app.prisma.comic.findUnique({ where: { id: params.comicId } });
    if (!comic) {
      return reply.notFound("Комикс не найден");
    }

    if (comic.authorId !== request.authUser.userId) {
      return reply.forbidden("Нельзя редактировать чужой комикс");
    }

    normalizeStartPage(payload.pages);

    try {
      validateGraph(payload.pages);
    } catch (error: any) {
      return reply.badRequest(error.message);
    }

    const slug = comic.title !== payload.title ? await createUniqueSlug(app, payload.title, comic.id) : comic.slug;

    await app.prisma.comic.update({
      where: { id: comic.id },
      data: {
        title: payload.title,
        slug,
        summary: payload.summary,
        script: payload.script || null,
        coverImageUrl: payload.coverImageUrl || null,
        status: payload.status
      }
    });

    await replaceComicGraph(app, comic.id, payload.pages);

    return { comicId: comic.id, slug };
  });

  app.post("/:comicId/publish", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);

    const comic = await app.prisma.comic.findUnique({
      where: { id: params.comicId },
      include: { pages: true }
    });

    if (!comic) {
      return reply.notFound("Комикс не найден");
    }

    if (comic.authorId !== request.authUser.userId) {
      return reply.forbidden("Нельзя опубликовать чужой комикс");
    }

    if (comic.pages.length === 0) {
      return reply.badRequest("Нельзя публиковать пустой комикс");
    }

    await app.prisma.comic.update({
      where: { id: comic.id },
      data: { status: ComicStatus.PUBLISHED }
    });

    return { success: true };
  });

  app.post("/:comicId/bookmark", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);

    const comic = await app.prisma.comic.findUnique({ where: { id: params.comicId } });
    if (!comic || comic.status !== ComicStatus.PUBLISHED) {
      return reply.notFound("Комикс не найден");
    }

    const existing = await app.prisma.comicBookmark.findUnique({
      where: {
        userId_comicId: {
          userId: request.authUser.userId,
          comicId: params.comicId
        }
      }
    });

    if (existing) {
      await app.prisma.comicBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await app.prisma.comicBookmark.create({
      data: {
        userId: request.authUser.userId,
        comicId: params.comicId
      }
    });

    return { bookmarked: true };
  });

  app.post("/:comicId/progress", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);
    const payload = progressSchema.parse(request.body);

    const page = await app.prisma.comicPage.findUnique({
      where: { id: payload.currentPageId },
      select: { comicId: true }
    });

    if (!page || page.comicId !== params.comicId) {
      return reply.badRequest("Некорректная страница прогресса");
    }

    await app.prisma.readProgress.upsert({
      where: {
        userId_comicId: {
          userId: request.authUser.userId,
          comicId: params.comicId
        }
      },
      update: {
        currentPageId: payload.currentPageId
      },
      create: {
        userId: request.authUser.userId,
        comicId: params.comicId,
        currentPageId: payload.currentPageId
      }
    });

    return { success: true };
  });

  app.post("/:comicId/reviews", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);
    const payload = reviewSchema.parse(request.body);

    const comic = await app.prisma.comic.findUnique({
      where: { id: params.comicId },
      select: { id: true, status: true }
    });

    if (!comic || comic.status !== ComicStatus.PUBLISHED) {
      return reply.notFound("Комикс не найден");
    }

    const review = await app.prisma.comicReview.upsert({
      where: {
        userId_comicId: {
          userId: request.authUser.userId,
          comicId: params.comicId
        }
      },
      update: {
        rating: payload.rating,
        body: payload.body.trim()
      },
      create: {
        userId: request.authUser.userId,
        comicId: params.comicId,
        rating: payload.rating,
        body: payload.body.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return { review };
  });

  app.get("/:comicId/progress", { preHandler: [app.authenticate] }, async (request, reply) => {
    const params = z.object({ comicId: z.string().uuid() }).parse(request.params);

    const progress = await app.prisma.readProgress.findUnique({
      where: {
        userId_comicId: {
          userId: request.authUser.userId,
          comicId: params.comicId
        }
      }
    });

    if (!progress) {
      return reply.notFound("Прогресс не найден");
    }

    return { progress };
  });
};
