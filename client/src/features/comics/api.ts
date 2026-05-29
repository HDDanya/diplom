import { api } from "../../lib/api";
import { ComicCard, ComicChoice, ComicDetail, ComicPage, ComicWritePayload, ReadComicResponse } from "../../types/api";

function normalizeChoices(rawChoices: unknown): ComicChoice[] {
  if (!Array.isArray(rawChoices)) {
    return [];
  }

  return rawChoices
    .map((choice: any) => ({
      id: String(choice?.id ?? crypto.randomUUID()),
      label: String(choice?.label ?? ""),
      targetPageId: String(choice?.targetPageId ?? "")
    }))
    .filter((choice) => choice.label.length > 0 && choice.targetPageId.length > 0);
}

function normalizePage(rawPage: any): ComicPage {
  return {
    id: String(rawPage?.id ?? ""),
    pageKey: String(rawPage?.pageKey ?? ""),
    title: String(rawPage?.title ?? ""),
    body: String(rawPage?.body ?? ""),
    imageUrl: rawPage?.imageUrl ?? null,
    sketchPrompt: rawPage?.sketchPrompt ?? null,
    transitionStyle: rawPage?.transitionStyle ?? "SLIDE_LEFT",
    position: Number.isFinite(rawPage?.position) ? Number(rawPage.position) : 0,
    isStart: Boolean(rawPage?.isStart),
    choices: normalizeChoices(rawPage?.choices)
  };
}

export async function fetchPublicComics(search?: string) {
  const response = await api.get<{ comics: ComicCard[] }>("/comics/public", {
    params: search ? { search } : undefined
  });
  return response.data.comics;
}

export async function fetchMyComics() {
  const response = await api.get<{ comics: ComicCard[] }>("/comics/mine");
  return response.data.comics;
}

export async function fetchBookmarkedComics() {
  const response = await api.get<{ comics: ComicCard[] }>("/comics/bookmarks");
  return response.data.comics;
}

export async function fetchComicBySlug(slug: string): Promise<ComicDetail> {
  const response = await api.get<{ comic: ComicDetail }>(`/comics/${slug}`);
  const comic = response.data.comic as any;

  return {
    ...comic,
    pages: Array.isArray(comic?.pages) ? comic.pages.map(normalizePage) : []
  } satisfies ComicDetail;
}

export async function fetchComicForRead(slug: string): Promise<ReadComicResponse["comic"]> {
  const response = await api.get<ReadComicResponse>(`/comics/${slug}/read`);
  const comic = response.data.comic as any;

  return {
    ...comic,
    pages: Array.isArray(comic?.pages) ? comic.pages.map(normalizePage) : [],
    startPageId: comic?.startPageId ?? null
  };
}

export async function createComic(payload: ComicWritePayload) {
  const response = await api.post<{ comicId: string; slug: string }>("/comics", payload);
  return response.data;
}

export async function updateComic(comicId: string, payload: ComicWritePayload) {
  const response = await api.put<{ comicId: string; slug: string }>(`/comics/${comicId}`, payload);
  return response.data;
}

export async function publishComic(comicId: string) {
  const response = await api.post<{ success: boolean }>(`/comics/${comicId}/publish`);
  return response.data;
}

export async function toggleBookmark(comicId: string) {
  const response = await api.post<{ bookmarked: boolean }>(`/comics/${comicId}/bookmark`);
  return response.data;
}

export async function saveProgress(comicId: string, currentPageId: string) {
  await api.post(`/comics/${comicId}/progress`, { currentPageId });
}

export async function uploadComicImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ url: string; filename: string; mimetype: string }>("/uploads/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

export async function generateComicImage(prompt: string, size: "1024x1024" | "1024x1536" | "1536x1024" = "1536x1024") {
  const response = await api.post<{ url: string; filename: string; mimetype: string }>("/uploads/generate", {
    prompt,
    size
  });

  return response.data;
}
