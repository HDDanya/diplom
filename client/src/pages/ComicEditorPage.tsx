import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  FileInput,
  Grid,
  Group,
  Image,
  Paper,
  Select,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconArrowNarrowDown, IconArrowRight, IconCloudUpload, IconPlayerPlay, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { StoryGraph } from "../components/StoryGraph";
import {
  createComic,
  fetchImageGenerationStatus,
  fetchComicBySlug,
  generateComicImages,
  publishComic,
  updateComic,
  uploadComicImage
} from "../features/comics/api";
import { resolveAssetUrl } from "../lib/assets";
import {
  createTransitionVariants,
  TRANSITIONS,
  TRANSITION_LABELS,
  transitionClassName
} from "../lib/transitions";
import { ComicDetail, ComicStatus, ComicWritePage, TransitionStyle } from "../types/api";

const REAL_COMIC_IMAGES = {
  mysta: "/uploads/seed/public-domain/pages/planet-37-page-12.jpg",
  cerebex: "/uploads/seed/public-domain/pages/planet-73-page-01.jpg",
  starPirate: "/uploads/seed/public-domain/pages/star-pirate-50-page.jpg",
  auro: "/uploads/seed/public-domain/pages/auro-jupiter-page.jpg",
  fictionHouse: "/uploads/seed/public-domain/pages/fiction-house-ad.jpg",
  planet01: "/uploads/seed/public-domain/planet-01.jpg",
  planet02: "/uploads/seed/public-domain/planet-02.jpg",
  planet03: "/uploads/seed/public-domain/planet-03.jpg",
  planet05: "/uploads/seed/public-domain/planet-05.jpg",
  planet11: "/uploads/seed/public-domain/planet-11.jpg",
  planet12: "/uploads/seed/public-domain/planet-12.jpg",
  planet57: "/uploads/seed/public-domain/planet-57.jpg",
  planet69: "/uploads/seed/public-domain/planet-69.jpg",
  blueBeetle: "/uploads/seed/public-domain/blue-beetle-01.jpg"
} as const;

const SCENE_TEMPLATES: Array<{
  id: string;
  label: string;
  title: string;
  body: string;
  sketchPrompt: string;
  imageUrl: string;
  panelImageUrls: string[];
  transitionStyle: TransitionStyle;
}> = [
  {
    id: "hero-intro",
    label: "Завязка",
    title: "Сцена завязки",
    body: `Главный персонаж замечает событие, которое нарушает привычный порядок мира.
---
В кадре появляется место действия, важная деталь и первый намёк на конфликт.
---
Финальная реплика или находка задаёт выбор: действовать сразу или собрать больше информации.`,
    sketchPrompt:
      "universal comic opening scene, clear location, protagonist silhouette, dramatic but genre-neutral mood, polished inks",
    imageUrl: REAL_COMIC_IMAGES.planet01,
    panelImageUrls: [
      REAL_COMIC_IMAGES.planet01,
      REAL_COMIC_IMAGES.mysta,
      REAL_COMIC_IMAGES.planet03
    ],
    transitionStyle: "PAGE_FLIP"
  },
  {
    id: "hero-investigation",
    label: "Расследование",
    title: "Сцена расследования",
    body: `Персонаж исследует локацию и находит улику, которая меняет понимание происходящего.
---
Вторая панель показывает связь между уликой, подозреваемым и будущей опасностью.
---
В конце сцены появляется новая угроза: кто-то пытается скрыть следы или опередить героя.`,
    sketchPrompt:
      "universal comic investigation scene, evidence, tense composition, expressive lighting, detailed inks",
    imageUrl: REAL_COMIC_IMAGES.cerebex,
    panelImageUrls: [
      REAL_COMIC_IMAGES.cerebex,
      REAL_COMIC_IMAGES.fictionHouse,
      REAL_COMIC_IMAGES.planet11
    ],
    transitionStyle: "INK_BLEED"
  },
  {
    id: "hero-dialogue",
    label: "Диалог",
    title: "Сцена переговоров",
    body: `Два персонажа спорят о цене правды, помощи или предательства.
---
Жест, взгляд или пауза показывает, что один из них скрывает важную информацию.
---
Последняя фраза превращает разговор в развилку с моральным или тактическим выбором.`,
    sketchPrompt:
      "universal comic dialogue scene, expressive faces, speech bubbles, cinematic framing, polished comic finish",
    imageUrl: REAL_COMIC_IMAGES.mysta,
    panelImageUrls: [
      REAL_COMIC_IMAGES.mysta,
      REAL_COMIC_IMAGES.auro,
      REAL_COMIC_IMAGES.starPirate
    ],
    transitionStyle: "VERTICAL_REVEAL"
  },
  {
    id: "hero-action",
    label: "Экшен",
    title: "Сцена столкновения",
    body: `Конфликт переходит в действие: персонажи сталкиваются в движении, риске или погоне.
---
Средняя панель усиливает ставку: появляется препятствие, раненый союзник или ограничение времени.
---
Сцена заканчивается выбором между быстрым решением и более рискованным, но важным действием.`,
    sketchPrompt:
      "dynamic universal comic action scene, speed lines, high contrast lighting, readable silhouettes, premium print look",
    imageUrl: REAL_COMIC_IMAGES.starPirate,
    panelImageUrls: [
      REAL_COMIC_IMAGES.starPirate,
      REAL_COMIC_IMAGES.auro,
      REAL_COMIC_IMAGES.planet69
    ],
    transitionStyle: "WHIP_PAN"
  },
  {
    id: "hero-finale",
    label: "Финал",
    title: "Сцена развязки",
    body: `Главный конфликт достигает точки невозврата, и персонаж сталкивается с последствиями прошлых решений.
---
Союзники, противники или сама локация подталкивают к последнему выбору.
---
Финальный кадр закрывает сюжетную линию и оставляет место для послевкусия или продолжения.`,
    sketchPrompt:
      "universal comic finale scene, dramatic resolution, symbolic composition, cinematic palette, ultra-detailed comic art",
    imageUrl: REAL_COMIC_IMAGES.planet57,
    panelImageUrls: [
      REAL_COMIC_IMAGES.planet57,
      REAL_COMIC_IMAGES.cerebex,
      REAL_COMIC_IMAGES.planet69
    ],
    transitionStyle: "PARALLAX_SWEEP"
  }
];

const ILLUSTRATION_PRESETS = [
  {
    id: "comic-opening",
    label: "Planet Comics #1",
    description: "Оригинальная public-domain обложка 1940 года",
    url: REAL_COMIC_IMAGES.planet01,
    promptSeed: "retro comic opening scene, dramatic location background, vintage print texture"
  },
  {
    id: "comic-adventure",
    label: "Star Pirate",
    description: "Настоящая страница Planet Comics #50",
    url: REAL_COMIC_IMAGES.starPirate,
    promptSeed: "adventure comic background, dynamic perspective, halftone texture, location-focused art"
  },
  {
    id: "comic-action",
    label: "Auro",
    description: "Настоящая страница Auro, Lord of Jupiter",
    url: REAL_COMIC_IMAGES.auro,
    promptSeed: "vintage action comic environment, energetic color palette, rich inks"
  },
  {
    id: "comic-technology",
    label: "Cerebex",
    description: "Роботизированная сцена из Planet Comics #73",
    url: REAL_COMIC_IMAGES.cerebex,
    promptSeed: "classic comic technical location, industrial skyline, clean panel readability"
  },
  {
    id: "comic-choice",
    label: "Mysta",
    description: "Splash page из Planet Comics #37",
    url: REAL_COMIC_IMAGES.mysta,
    promptSeed: "retro comic location shot, cinematic framing, print-era halftone styling"
  },
  {
    id: "comic-noir",
    label: "Blue Beetle #1",
    description: "Public-domain обложка классического детектива",
    url: REAL_COMIC_IMAGES.blueBeetle,
    promptSeed: "dark comic backdrop, noir lighting, bold ink contours, environment-focused scene"
  },
  {
    id: "comic-climax",
    label: "Planet Comics #69",
    description: "Оригинальная обложка космического выпуска",
    url: REAL_COMIC_IMAGES.planet69,
    promptSeed: "high-contrast vintage comic scene, dramatic sky, epic location composition"
  },
  {
    id: "comic-classic",
    label: "Fiction House",
    description: "Настоящая рекламная страница издательства",
    url: REAL_COMIC_IMAGES.fictionHouse,
    promptSeed: "golden age comic style background, bold vintage inks, location-ready composition"
  }
];

type EditorPage = ComicWritePage & {
  pendingImageFile: File | null;
};

type DebouncedInputProps = {
  label: string;
  value: string;
  onCommit: (nextValue: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  delay?: number;
};

function DebouncedTextInput({ label, value, onCommit, placeholder, required, description, delay = 220 }: DebouncedInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) {
        onCommit(draft);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [draft, value, onCommit, delay]);

  return (
    <TextInput
      label={label}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => {
        if (draft !== value) {
          onCommit(draft);
        }
      }}
      placeholder={placeholder}
      required={required}
      description={description}
    />
  );
}

function DebouncedTextarea({
  label,
  value,
  onCommit,
  placeholder,
  required,
  description,
  delay = 220,
  minRows = 3,
  maxRows
}: DebouncedInputProps & { minRows?: number; maxRows?: number }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== value) {
        onCommit(draft);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [draft, value, onCommit, delay]);

  return (
    <Textarea
      label={label}
      value={draft}
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => {
        if (draft !== value) {
          onCommit(draft);
        }
      }}
      autosize
      minRows={minRows}
      maxRows={maxRows}
      placeholder={placeholder}
      required={required}
      description={description}
    />
  );
}

function parseDialogPanels(body: string) {
  return body
    .split(/\n\s*---\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function ensurePanelImageArrayLength(images: string[] | undefined, expectedLength: number) {
  const base = Array.isArray(images) ? images.slice(0, expectedLength) : [];
  while (base.length < expectedLength) {
    base.push("");
  }
  return base;
}

function makeEmptyPage(position: number): EditorPage {
  return {
    pageKey: `page_${position}`,
    title: `Сцена ${position}`,
    body: "",
    imageUrl: "",
    panelImageUrls: [""],
    sketchPrompt: "",
    transitionStyle: "SLIDE_LEFT",
    position,
    isStart: position === 1,
    choices: [],
    pendingImageFile: null
  };
}

function buildPagesFromScript(script: string): EditorPage[] {
  const blocks = script
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (blocks.length === 0) {
    return [makeEmptyPage(1)];
  }

  return blocks.map((block, index) => {
    const position = index + 1;
    const firstSentence = block.split(".")[0].slice(0, 60);
    const panelCount = Math.max(parseDialogPanels(block).length, 1);

    return {
      pageKey: `scene_${position}`,
      title: firstSentence || `Сцена ${position}`,
      body: block,
      imageUrl: "",
      panelImageUrls: Array.from({ length: panelCount }, () => ""),
      sketchPrompt: "",
      transitionStyle: TRANSITIONS[index % TRANSITIONS.length],
      position,
      isStart: index === 0,
      choices:
        index < blocks.length - 1
          ? [
              {
                label: "Продолжить",
                targetPageKey: `scene_${position + 1}`
              }
            ]
          : [],
      pendingImageFile: null
    };
  });
}

function fromComicDetail(comic: ComicDetail): { status: ComicStatus; pages: EditorPage[] } {
  const pageKeyById = new Map(comic.pages.map((page) => [page.id, page.pageKey]));

  return {
    status: comic.status,
    pages: comic.pages.map((page) => {
      const panelCount = Math.max(parseDialogPanels(page.body).length, 1);
      return {
        pageKey: page.pageKey,
        title: page.title,
        body: page.body,
        imageUrl: page.imageUrl ?? "",
        panelImageUrls: ensurePanelImageArrayLength(page.panelImageUrls, panelCount),
        sketchPrompt: page.sketchPrompt ?? "",
        transitionStyle: page.transitionStyle,
        position: page.position,
        isStart: page.isStart,
        choices: page.choices.map((choice) => ({
          label: choice.label,
          targetPageKey: pageKeyById.get(choice.targetPageId) ?? ""
        })),
        pendingImageFile: null
      };
    })
  };
}

function ComicDraftPreview({
  title,
  summary,
  coverImageUrl,
  status,
  pages
}: {
  title: string;
  summary: string;
  coverImageUrl: string;
  status: ComicStatus;
  pages: EditorPage[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(pages.length - 1, 0)));
  }, [pages.length]);

  const currentPage = pages[currentIndex] ?? pages[0];
  const panelTexts = (currentPage ? parseDialogPanels(currentPage.body) : []).slice(0, 6);
  const visiblePanelTexts = panelTexts.length > 0 ? panelTexts : [currentPage?.body.trim() || "Текст страницы появится здесь."];
  const panelImages = ensurePanelImageArrayLength(currentPage?.panelImageUrls, Math.max(visiblePanelTexts.length, 1));
  const fallbackPanelImage = resolveAssetUrl(currentPage?.imageUrl) || "/comic-placeholder.svg";
  const variants = createTransitionVariants(currentPage?.transitionStyle ?? "SLIDE_LEFT", direction);
  const panelAnimationClassName = transitionClassName(currentPage?.transitionStyle ?? "SLIDE_LEFT");

  const goToPage = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === currentIndex) {
      return;
    }

    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  return (
    <Stack gap="lg">
      <Card className="ink-grid" p={0} style={{ overflow: "hidden" }}>
        <Image
          h={260}
          src={resolveAssetUrl(coverImageUrl) || "/comic-placeholder.svg"}
          alt={title || "Превью комикса"}
          fit="cover"
          fallbackSrc="/comic-placeholder.svg"
          style={{ filter: "contrast(1.06) saturate(1.04)" }}
        />
        <Stack p="lg" gap="sm">
          <Group justify="space-between" align="start">
            <Stack gap={2}>
              <Title order={1} ff="Bebas Neue" size="3rem">
                {title || "Без названия"}
              </Title>
              <Text c="dimmed">{summary || "Краткое описание появится здесь."}</Text>
            </Stack>
            <Badge color={status === "PUBLISHED" ? "dark" : "gray"}>{status === "PUBLISHED" ? "Опубликован" : "Черновик"}</Badge>
          </Group>
        </Stack>
      </Card>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge color="dark">
              {pages.length > 0 ? `${currentIndex + 1}/${pages.length}` : "0/0"}
            </Badge>
            {currentPage?.isStart && <Badge variant="outline">Старт</Badge>}
            <Badge color="gray" variant="light">
              {currentPage?.transitionStyle ?? "SLIDE_LEFT"}
            </Badge>
          </Group>
          <Group gap="xs">
            <Button
              size="xs"
              variant="outline"
              color="dark"
              leftSection={<IconArrowLeft size={14} />}
              disabled={currentIndex === 0}
              onClick={() => goToPage(currentIndex - 1)}
            >
              Назад
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="dark"
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => setReplayKey((value) => value + 1)}
            >
              Повторить
            </Button>
            <Button
              size="xs"
              color="dark"
              rightSection={<IconArrowRight size={14} />}
              disabled={currentIndex >= pages.length - 1}
              onClick={() => goToPage(currentIndex + 1)}
            >
              Далее
            </Button>
          </Group>
        </Group>
      </Paper>

      <Card className="reader-surface comic-sheet-wrap" p="lg" style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${replayKey}`}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={2} ff="Bebas Neue" size="2.2rem">
                  {currentPage?.title || `Сцена ${currentIndex + 1}`}
                </Title>
                <Badge variant="outline" color="dark">
                  {currentPage?.transitionStyle ?? "SLIDE_LEFT"}
                </Badge>
              </Group>

              <div className={`comic-canvas ${panelAnimationClassName}`}>
                {visiblePanelTexts.map((panelText, index) => (
                  <article key={`${currentPage?.pageKey ?? "page"}-${index}-${replayKey}`} className={`comic-panel panel-${index % 6}`}>
                    <div
                      className="comic-panel-image"
                      style={{
                        backgroundImage: `url(${resolveAssetUrl(panelImages[index]) || fallbackPanelImage})`
                      }}
                    />
                    <div className="comic-panel-ink" />
                    <p className={`comic-caption ${index % 2 === 0 ? "narration" : "speech"}`}>{panelText}</p>
                  </article>
                ))}
              </div>

              <Group gap="xs">
                {(currentPage?.choices ?? []).slice(0, 4).map((choice, choiceIndex) => (
                  <Badge key={`${choice.label}-${choiceIndex}`} color="dark" variant="outline">
                    {choice.label || "Выбор"}
                  </Badge>
                ))}
                {(currentPage?.choices ?? []).length === 0 && (
                  <Badge color="gray" variant="light">
                    без развилок
                  </Badge>
                )}
              </Group>
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Card>
    </Stack>
  );
}

export function ComicEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { slug } = useParams();
  const isEditing = Boolean(slug);

  const comicQuery = useQuery({
    queryKey: ["comic", slug],
    queryFn: () => fetchComicBySlug(slug!),
    enabled: isEditing
  });

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [script, setScript] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverUploadFile, setCoverUploadFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ComicStatus>("DRAFT");
  const [pages, setPages] = useState<EditorPage[]>([makeEmptyPage(1)]);
  const [hydrated, setHydrated] = useState(false);
  const [generatingPageIndex, setGeneratingPageIndex] = useState<number | null>(null);
  const [generatingPanelKey, setGeneratingPanelKey] = useState<string | null>(null);
  const [panelUploadFiles, setPanelUploadFiles] = useState<Record<string, File | null>>({});
  const [generatedVariants, setGeneratedVariants] = useState<Record<number, string[]>>({});
  const [aiStyle, setAiStyle] = useState("graphic novel, polished inks, cinematic lighting");
  const [characterGuide, setCharacterGuide] = useState("");
  const [variantCount, setVariantCount] = useState("1");
  const [editorView, setEditorView] = useState<"edit" | "graph" | "preview">("edit");

  const generationStatusQuery = useQuery({
    queryKey: ["image-generation-status"],
    queryFn: fetchImageGenerationStatus,
    retry: false
  });

  const setPageField = (pageIndex: number, updater: (page: EditorPage) => EditorPage) => {
    setPages((current) => current.map((page, index) => (index === pageIndex ? updater(page) : page)));
  };

  useEffect(() => {
    if (!comicQuery.data || hydrated) {
      return;
    }

    setTitle(comicQuery.data.title);
    setSummary(comicQuery.data.summary);
    setScript(comicQuery.data.script ?? "");
    setCoverImageUrl(comicQuery.data.coverImageUrl ?? "");

    const normalized = fromComicDetail(comicQuery.data);
    setStatus(normalized.status);
    setPages(normalized.pages.length > 0 ? normalized.pages : [makeEmptyPage(1)]);
    setHydrated(true);
  }, [comicQuery.data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        summary,
        script,
        coverImageUrl,
        status,
        pages: pages.map((page, index) => {
          const { pendingImageFile, ...cleanPage } = page;
          return {
            ...cleanPage,
            position: index + 1,
            imageUrl: cleanPage.imageUrl?.trim() || undefined,
            panelImageUrls: (cleanPage.panelImageUrls ?? []).map((item) => item.trim()).filter(Boolean),
            sketchPrompt: cleanPage.sketchPrompt?.trim() || undefined,
            choices: cleanPage.choices.filter((choice) => choice.label.trim() && choice.targetPageKey.trim())
          };
        })
      };

      if (isEditing && comicQuery.data) {
        return updateComic(comicQuery.data.id, payload);
      }
      return createComic(payload);
    },
    onSuccess: (result) => {
      notifications.show({ title: "Сохранено", message: "Черновик комикса обновлён", color: "dark" });
      queryClient.invalidateQueries({ queryKey: ["my-comics"] });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", result.slug] });
      navigate(`/editor/${result.slug}`, { replace: true });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Ошибка сохранения",
        message: error.response?.data?.message ?? "Проверьте корректность страниц и переходов",
        color: "red"
      });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadComicImage,
    onError: (error: any) => {
      notifications.show({
        title: "Ошибка загрузки",
        message: error.response?.data?.message ?? "Не удалось загрузить изображение",
        color: "red"
      });
    }
  });

  const generateImageMutation = useMutation({
    mutationFn: ({ prompt, count = 1 }: { prompt: string; count?: number }) =>
      generateComicImages(prompt, { count }),
    onError: (error: any) => {
      notifications.show({
        title: "Ошибка генерации",
        message: error.response?.data?.message ?? "Не удалось сгенерировать изображение",
        color: "red"
      });
    }
  });

  const publishMutation = useMutation({
    mutationFn: (comicId: string) => publishComic(comicId),
    onSuccess: () => {
      notifications.show({ title: "Опубликовано", message: "Комикс доступен читателям", color: "dark" });
      setStatus("PUBLISHED");
      queryClient.invalidateQueries({ queryKey: ["my-comics"] });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Не удалось опубликовать",
        message: error.response?.data?.message ?? "Сначала сохраните корректные страницы",
        color: "red"
      });
    }
  });

  const pageKeyOptions = useMemo(
    () => pages.map((page) => ({ label: `${page.position}. ${page.title || page.pageKey}`, value: page.pageKey })),
    [pages]
  );

  if (isEditing && comicQuery.isLoading) {
    return <LoadingScreen label="Загружаем редактор" />;
  }

  const onGenerateFromScript = () => {
    if (!script.trim()) {
      notifications.show({ title: "Добавьте сценарий", message: "Сначала заполните поле сценария", color: "yellow" });
      return;
    }

    setPages(buildPagesFromScript(script));
    notifications.show({
      title: "Черновик страниц создан",
      message: "Структура построена из сценария. Проверьте и отредактируйте ветки.",
      color: "dark"
    });
  };

  const uploadCoverImage = async () => {
    if (!coverUploadFile) {
      notifications.show({ title: "Файл не выбран", message: "Выберите изображение обложки", color: "yellow" });
      return;
    }

    const uploaded = await uploadImageMutation.mutateAsync(coverUploadFile);
    setCoverImageUrl(uploaded.url);
    setCoverUploadFile(null);
    notifications.show({ title: "Загружено", message: "Обложка обновлена", color: "dark" });
  };

  const uploadPageImage = async (pageIndex: number) => {
    const selectedFile = pages[pageIndex]?.pendingImageFile;
    if (!selectedFile) {
      notifications.show({ title: "Файл не выбран", message: "Выберите изображение страницы", color: "yellow" });
      return;
    }

    const uploaded = await uploadImageMutation.mutateAsync(selectedFile);
    setPageField(pageIndex, (page) => ({ ...page, imageUrl: uploaded.url, pendingImageFile: null }));
    notifications.show({ title: "Загружено", message: "Кадр страницы сохранён", color: "dark" });
  };

  const uploadDialogImage = async (pageIndex: number, panelIndex: number) => {
    const key = `${pageIndex}-${panelIndex}`;
    const selectedFile = panelUploadFiles[key];

    if (!selectedFile) {
      notifications.show({ title: "Файл не выбран", message: "Выберите изображение панели", color: "yellow" });
      return;
    }

    const uploaded = await uploadImageMutation.mutateAsync(selectedFile);
    setPageField(pageIndex, (page) => {
      const panelTexts = parseDialogPanels(page.body);
      const nextUrls = ensurePanelImageArrayLength(page.panelImageUrls, Math.max(panelTexts.length, 1));
      nextUrls[panelIndex] = uploaded.url;
      return { ...page, panelImageUrls: nextUrls };
    });
    setPanelUploadFiles((current) => ({ ...current, [key]: null }));
    notifications.show({ title: "Загружено", message: "Иллюстрация диалога сохранена", color: "dark" });
  };

  const applySceneTemplate = (pageIndex: number, templateId: string) => {
    const template = SCENE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setPageField(pageIndex, (page) => {
      const panelCount = Math.max(parseDialogPanels(template.body).length, 1);
      const panelUrls = ensurePanelImageArrayLength(template.panelImageUrls, panelCount);
      return {
        ...page,
        title: template.title,
        body: template.body,
        imageUrl: template.imageUrl,
        sketchPrompt: template.sketchPrompt,
        transitionStyle: template.transitionStyle,
        panelImageUrls: panelUrls
      };
    });
  };

  const applyIllustrationTemplate = (pageIndex: number, imageUrl: string) => {
    setPageField(pageIndex, (page) => ({ ...page, imageUrl, pendingImageFile: null }));
  };

  const applyDialogTemplate = (pageIndex: number, panelIndex: number, imageUrl: string) => {
    setPageField(pageIndex, (page) => {
      const panelTexts = parseDialogPanels(page.body);
      const nextUrls = ensurePanelImageArrayLength(page.panelImageUrls, Math.max(panelTexts.length, 1));
      nextUrls[panelIndex] = imageUrl;
      return { ...page, panelImageUrls: nextUrls };
    });
  };

  const buildPromptFromPage = (page: EditorPage) => {
    const pageTitle = page.title.trim() || "comic scene";
    const firstBeat =
      parseDialogPanels(page.body)[0] ??
      "dramatic comic moment";

    return `premium comic illustration, ${pageTitle.toLowerCase()}, ${firstBeat.toLowerCase()}, ${aiStyle}, detailed background`;
  };

  const buildPromptFromPanel = (page: EditorPage, panelText: string, panelIndex: number) => {
    const sceneTitle = page.title.trim() || "comic scene";
    return `premium comic panel, scene ${panelIndex + 1}, ${sceneTitle.toLowerCase()}, ${panelText.toLowerCase()}, ${aiStyle}, detailed line art, professional print shading`;
  };

  const enrichPrompt = (prompt: string) => {
    const guide = characterGuide.trim();
    return guide ? `${prompt}. Character consistency guide: ${guide}` : prompt;
  };

  const generatePageImage = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) {
      return;
    }

    const prompt = enrichPrompt((page.sketchPrompt ?? "").trim() || buildPromptFromPage(page));
    setGeneratingPageIndex(pageIndex);
    try {
      const generated = await generateImageMutation.mutateAsync({
        prompt,
        count: Number(variantCount)
      });
      const urls = generated.images.map((image) => image.url);
      setGeneratedVariants((current) => ({ ...current, [pageIndex]: urls }));
      setPageField(pageIndex, (item) => ({ ...item, imageUrl: generated.url, pendingImageFile: null, sketchPrompt: prompt }));
      notifications.show({
        title: generated.safetyAdjusted
          ? "Создан безопасный вариант"
          : urls.length > 1
            ? "Варианты созданы"
            : "Кадр создан",
        message: generated.safetyAdjusted
          ? "Исходный prompt был заблокирован. Сцена создана по нейтральному описанию без опасных деталей."
          : `Получено вариантов: ${urls.length}. Первый вариант выбран для сцены.`,
        color: generated.safetyAdjusted ? "yellow" : "dark"
      });
    } catch {
      // useMutation onError already renders a user-facing notification.
    } finally {
      setGeneratingPageIndex(null);
    }
  };

  const generateDialogImage = async (pageIndex: number, panelIndex: number, panelText: string) => {
    const page = pages[pageIndex];
    if (!page) {
      return;
    }

    const prompt = enrichPrompt(buildPromptFromPanel(page, panelText, panelIndex));
    const key = `${pageIndex}-${panelIndex}`;
    setGeneratingPanelKey(key);
    try {
      const generated = await generateImageMutation.mutateAsync({ prompt, count: 1 });
      setPageField(pageIndex, (currentPage) => {
        const panelTexts = parseDialogPanels(currentPage.body);
        const nextUrls = ensurePanelImageArrayLength(currentPage.panelImageUrls, Math.max(panelTexts.length, 1));
        nextUrls[panelIndex] = generated.url;
        return { ...currentPage, panelImageUrls: nextUrls };
      });
      notifications.show({
        title: generated.safetyAdjusted ? "Создан безопасный вариант" : "Панель готова",
        message: generated.safetyAdjusted
          ? "Исходный prompt был заблокирован, поэтому использовано нейтральное описание."
          : "Иллюстрация диалога сгенерирована",
        color: generated.safetyAdjusted ? "yellow" : "dark"
      });
    } catch {
      // useMutation onError already renders a user-facing notification.
    } finally {
      setGeneratingPanelKey(null);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="start">
        <Stack gap={2}>
          <Title order={1} ff="Bebas Neue" size="3rem">
            {isEditing ? "Редактор комикса" : "Новый комикс"}
          </Title>
          <Text c="dimmed">Конструктор страниц, развилок и визуальных переходов между сценами.</Text>
        </Stack>
        <Group>
          {isEditing && comicQuery.data && status === "DRAFT" && (
            <Button
              variant="outline"
              color="dark"
              onClick={() => publishMutation.mutate(comicQuery.data.id)}
              loading={publishMutation.isPending}
            >
              Опубликовать
            </Button>
          )}
          <Button color="dark" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Сохранить
          </Button>
        </Group>
      </Group>

      <SegmentedControl
        value={editorView}
        onChange={(value) => setEditorView(value as "edit" | "graph" | "preview")}
        data={[
          { label: "Редактор", value: "edit" },
          { label: "Граф ветвлений", value: "graph" },
          { label: "Превью", value: "preview" }
        ]}
        color="dark"
      />

      {editorView === "preview" ? (
        <ComicDraftPreview title={title} summary={summary} coverImageUrl={coverImageUrl} status={status} pages={pages} />
      ) : editorView === "graph" ? (
        <Card className="ink-grid" p="lg">
          <StoryGraph
            pages={pages}
            onSelect={(pageKey) => {
              setEditorView("edit");
              window.setTimeout(() => {
                document.getElementById(`editor-page-${pageKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 80);
            }}
          />
        </Card>
      ) : (
        <>
      <Card className="ink-grid" p="lg">
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack>
              <DebouncedTextInput label="Название" value={title} onCommit={setTitle} required />
              <DebouncedTextarea
                label="Краткое описание"
                value={summary}
                onCommit={setSummary}
                minRows={3}
                required
              />

              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Обложка
                </Text>
                {coverImageUrl && (
                  <Image
                    src={resolveAssetUrl(coverImageUrl) || "/comic-placeholder.svg"}
                    alt="cover"
                    radius="sm"
                    h={150}
                    fit="cover"
                    fallbackSrc="/comic-placeholder.svg"
                    style={{ filter: "contrast(1.06) saturate(1.04)" }}
                  />
                )}
                <FileInput
                  clearable
                  value={coverUploadFile}
                  onChange={setCoverUploadFile}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  placeholder="Выберите файл обложки"
                />
                <Group>
                  <Button
                    variant="outline"
                    color="dark"
                    leftSection={<IconCloudUpload size={16} />}
                    onClick={uploadCoverImage}
                    loading={uploadImageMutation.isPending}
                  >
                    Загрузить обложку
                  </Button>
                  {coverImageUrl && (
                    <Text size="xs" c="dimmed">
                      Сохранено: {coverImageUrl}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack>
              <Select
                label="Статус"
                value={status}
                onChange={(value) => setStatus((value as ComicStatus) ?? "DRAFT")}
                data={[
                  { label: "Черновик", value: "DRAFT" },
                  { label: "Опубликован", value: "PUBLISHED" }
                ]}
              />
              <Text size="sm" c="dimmed">
                {status === "DRAFT"
                  ? "Черновик виден только автору."
                  : "Опубликованный комикс отображается в каталоге."}
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider my="lg" />

        <Stack>
          <Group justify="space-between" align="center">
            <Title order={3} ff="Bebas Neue" size="2rem">
              Настройки AI-иллюстраций
            </Title>
            <Badge
              color={generationStatusQuery.data?.configured ? "green" : "red"}
              variant="light"
            >
              {generationStatusQuery.isLoading
                ? "Проверяем API"
                : generationStatusQuery.data?.configured
                  ? `Подключено: ${generationStatusQuery.data.model}`
                  : "API не настроен"}
            </Badge>
          </Group>
          <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <TextInput
                label="Визуальный стиль"
                value={aiStyle}
                onChange={(event) => setAiStyle(event.currentTarget.value)}
                placeholder="graphic novel, watercolor, retro sci-fi..."
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <TextInput
                label="Постоянные признаки персонажей"
                value={characterGuide}
                onChange={(event) => setCharacterGuide(event.currentTarget.value)}
                placeholder="Одежда, цвет волос, возраст, отличительные детали"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Select
                label="Вариантов"
                value={variantCount}
                onChange={(value) => setVariantCount(value ?? "2")}
                data={["1", "2", "3", "4"]}
              />
            </Grid.Col>
          </Grid>
          <Text size="xs" c="dimmed">
            Стиль и описание персонажей автоматически добавляются ко всем prompt, чтобы сцены выглядели согласованно.
          </Text>
        </Stack>

        <Divider my="lg" />

        <Stack>
          <Group justify="space-between" align="center">
            <Title order={3} ff="Bebas Neue" size="2rem">
              Сценарий
            </Title>
            <Button variant="light" color="dark" onClick={onGenerateFromScript}>
              Генерировать страницы из сценария
            </Button>
          </Group>
          <DebouncedTextarea
            label=""
            value={script}
            onCommit={setScript}
            minRows={6}
            maxRows={14}
            delay={260}
            placeholder="Опишите сцены, разделяя их пустой строкой. Для панелей внутри одной страницы используйте разделитель ---"
          />
        </Stack>
      </Card>

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2} ff="Bebas Neue" size="2.2rem">
            Страницы и ветки
          </Title>
          <Button
            variant="outline"
            color="dark"
            leftSection={<IconPlus size={16} />}
            onClick={() => setPages((current) => [...current, makeEmptyPage(current.length + 1)])}
          >
            Добавить страницу
          </Button>
        </Group>

        {pages.map((page, pageIndex) => {
          const dialogPanels = parseDialogPanels(page.body);
          const panelCount = Math.max(dialogPanels.length, 1);
          const normalizedPanelImages = ensurePanelImageArrayLength(page.panelImageUrls, panelCount);

          return (
            <Card id={`editor-page-${page.pageKey}`} key={`${page.pageKey}-${pageIndex}`} className="ink-grid editor-page-card" p="md">
              <Stack>
                <Group justify="space-between">
                  <Group>
                    <Badge color="dark">Страница {pageIndex + 1}</Badge>
                    {page.isStart && <Badge variant="outline">Стартовая</Badge>}
                  </Group>
                  <Group>
                    <Button
                      variant={page.isStart ? "filled" : "light"}
                      color="dark"
                      size="xs"
                      onClick={() =>
                        setPages((current) =>
                          current.map((item, index) => ({
                            ...item,
                            isStart: index === pageIndex
                          }))
                        )
                      }
                    >
                      Сделать стартовой
                    </Button>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => {
                        if (pages.length === 1) {
                          return;
                        }

                        setPages((current) => {
                          const removed = current[pageIndex];
                          const next = current
                            .filter((_, index) => index !== pageIndex)
                            .map((item, index) => ({
                              ...item,
                              position: index + 1,
                              isStart: item.isStart && item.pageKey !== removed.pageKey,
                              choices: item.choices.filter((choice) => choice.targetPageKey !== removed.pageKey)
                            }));

                          if (!next.some((item) => item.isStart) && next[0]) {
                            next[0].isStart = true;
                          }

                          return next;
                        });
                      }}
                      aria-label="Удалить страницу"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DebouncedTextInput
                      label="Ключ страницы"
                      value={page.pageKey}
                      onCommit={(nextValue) => setPageField(pageIndex, (item) => ({ ...item, pageKey: nextValue }))}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Переход"
                      value={page.transitionStyle}
                      data={TRANSITIONS.map((transition) => ({ label: TRANSITION_LABELS[transition], value: transition }))}
                      onChange={(value) =>
                        setPageField(pageIndex, (item) => ({
                          ...item,
                          transitionStyle: (value as TransitionStyle) || "SLIDE_LEFT"
                        }))
                      }
                    />
                  </Grid.Col>
                </Grid>

                <Stack gap={6}>
                  <Text size="xs" c="dimmed">
                    Шаблоны сцены
                  </Text>
                  <Group gap="xs" wrap="wrap">
                    {SCENE_TEMPLATES.map((template) => (
                      <Button
                        key={template.id}
                        size="xs"
                        variant="outline"
                        color="dark"
                        onClick={() => applySceneTemplate(pageIndex, template.id)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </Group>
                </Stack>

                <DebouncedTextInput
                  label="Заголовок"
                  value={page.title}
                  onCommit={(nextValue) => setPageField(pageIndex, (item) => ({ ...item, title: nextValue }))}
                />

                <DebouncedTextarea
                  label="Текст страницы"
                  value={page.body}
                  minRows={4}
                  onCommit={(nextValue) =>
                    setPageField(pageIndex, (item) => {
                      const panelCountFromBody = Math.max(parseDialogPanels(nextValue).length, 1);
                      return {
                        ...item,
                        body: nextValue,
                        panelImageUrls: ensurePanelImageArrayLength(item.panelImageUrls, panelCountFromBody)
                      };
                    })
                  }
                />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Stack gap="xs">
                      {page.imageUrl && (
                        <Box className="editor-scene-preview">
                          <img src={resolveAssetUrl(page.imageUrl) || "/comic-placeholder.svg"} alt={page.title} />
                        </Box>
                      )}
                      <FileInput
                        clearable
                        value={page.pendingImageFile}
                        onChange={(value) => setPageField(pageIndex, (item) => ({ ...item, pendingImageFile: value }))}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        placeholder="Выберите картинку для всей сцены (fallback)"
                      />

                      <Stack gap={6}>
                        <Text size="xs" c="dimmed">
                          Универсальные комиксные шаблоны
                        </Text>
                        <Grid>
                          {ILLUSTRATION_PRESETS.map((preset) => (
                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={preset.id}>
                              <Card withBorder p={6}>
                                <Stack gap={6}>
                                  <Image
                                    src={resolveAssetUrl(preset.url) || "/comic-placeholder.svg"}
                                    alt={preset.label}
                                    h={56}
                                    fit="cover"
                                    radius="sm"
                                    fallbackSrc="/comic-placeholder.svg"
                                    style={{ filter: "contrast(1.06) saturate(1.04)" }}
                                  />
                                  <Text size="xs" fw={700}>
                                    {preset.label}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {preset.description}
                                  </Text>
                                  <Group gap={6}>
                                    <Button
                                      size="xs"
                                      color="dark"
                                      variant={page.imageUrl === preset.url ? "filled" : "outline"}
                                      onClick={() => applyIllustrationTemplate(pageIndex, preset.url)}
                                    >
                                      На сцену
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="subtle"
                                      color="dark"
                                      onClick={() =>
                                        setPageField(pageIndex, (item) => ({ ...item, sketchPrompt: preset.promptSeed }))
                                      }
                                    >
                                      Prompt
                                    </Button>
                                  </Group>
                                </Stack>
                              </Card>
                            </Grid.Col>
                          ))}
                        </Grid>
                      </Stack>

                      <Group>
                        <Button
                          variant="outline"
                          color="dark"
                          leftSection={<IconCloudUpload size={16} />}
                          onClick={() => uploadPageImage(pageIndex)}
                          loading={uploadImageMutation.isPending}
                        >
                          Загрузить кадр сцены
                        </Button>
                        {page.imageUrl && (
                          <Text size="xs" c="dimmed">
                            Сохранено: {page.imageUrl}
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <DebouncedTextInput
                      label="Prompt для генерации сцены"
                      value={page.sketchPrompt ?? ""}
                      onCommit={(nextValue) => setPageField(pageIndex, (item) => ({ ...item, sketchPrompt: nextValue }))}
                      description="Чем конкретнее персонаж, ракурс и действие, тем лучше кадр."
                    />
                      <Group mt={8}>
                      <Button
                        size="xs"
                        variant="light"
                        color="dark"
                        onClick={() => setPageField(pageIndex, (item) => ({ ...item, sketchPrompt: buildPromptFromPage(item) }))}
                      >
                        Автопромпт
                      </Button>
                      <Button
                        size="xs"
                        color="dark"
                        leftSection={<IconSparkles size={14} />}
                        loading={generateImageMutation.isPending && generatingPageIndex === pageIndex}
                        onClick={() => generatePageImage(pageIndex)}
                      >
                        Сгенерировать сцену
                      </Button>
                      </Group>
                      {(generatedVariants[pageIndex]?.length ?? 0) > 1 && (
                        <Stack gap={6} mt="sm">
                          <Text size="xs" fw={700}>
                            Выберите вариант
                          </Text>
                          <div className="generated-variants">
                            {generatedVariants[pageIndex].map((url, variantIndex) => (
                              <button
                                key={url}
                                type="button"
                                className={page.imageUrl === url ? "generated-variant is-active" : "generated-variant"}
                                onClick={() =>
                                  setPageField(pageIndex, (item) => ({
                                    ...item,
                                    imageUrl: url,
                                    pendingImageFile: null
                                  }))
                                }
                                aria-label={`Выбрать вариант ${variantIndex + 1}`}
                              >
                                <img src={resolveAssetUrl(url) ?? "/comic-placeholder.svg"} alt={`Вариант ${variantIndex + 1}`} />
                              </button>
                            ))}
                          </div>
                        </Stack>
                      )}
                  </Grid.Col>
                </Grid>

                <Divider />

                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text fw={700}>Иллюстрации по диалогам (разделитель ---)</Text>
                    <Badge variant="light" color="dark">
                      {panelCount} панелей
                    </Badge>
                  </Group>

                  {dialogPanels.length === 0 ? (
                    <Text size="sm" c="dimmed">
                      Добавьте текст и разделители --- чтобы редактировать иллюстрации каждой панели.
                    </Text>
                  ) : (
                    dialogPanels.map((panelText, panelIndex) => {
                      const panelUploadKey = `${pageIndex}-${panelIndex}`;
                      const panelImageUrl = normalizedPanelImages[panelIndex] || page.imageUrl || "";

                      return (
                        <Card key={panelUploadKey} withBorder p="sm">
                          <Stack gap="xs">
                            <Group justify="space-between" align="start">
                              <Badge color="dark">Диалог {panelIndex + 1}</Badge>
                              <Button
                                size="xs"
                                variant="subtle"
                                color="dark"
                                onClick={() =>
                                  setPageField(pageIndex, (item) => {
                                    const nextUrls = [...ensurePanelImageArrayLength(item.panelImageUrls, panelCount)];
                                    nextUrls[panelIndex] = "";
                                    return { ...item, panelImageUrls: nextUrls };
                                  })
                                }
                              >
                                Сбросить
                              </Button>
                            </Group>
                            <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                              {panelText}
                            </Text>

                            <Box className="editor-panel-preview">
                              <img
                                src={resolveAssetUrl(panelImageUrl) || "/comic-placeholder.svg"}
                                alt={`panel-${panelIndex + 1}`}
                              />
                            </Box>

                            <DebouncedTextInput
                              label="URL иллюстрации панели"
                              value={normalizedPanelImages[panelIndex] ?? ""}
                              onCommit={(nextValue) =>
                                setPageField(pageIndex, (item) => {
                                  const nextUrls = [...ensurePanelImageArrayLength(item.panelImageUrls, panelCount)];
                                  nextUrls[panelIndex] = nextValue;
                                  return { ...item, panelImageUrls: nextUrls };
                                })
                              }
                              placeholder="/uploads/comics/..."
                            />

                            <FileInput
                              clearable
                              value={panelUploadFiles[panelUploadKey] ?? null}
                              onChange={(value) => setPanelUploadFiles((current) => ({ ...current, [panelUploadKey]: value }))}
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              placeholder="Загрузить картинку для этого диалога"
                            />

                            <Group>
                              <Button
                                size="xs"
                                variant="outline"
                                color="dark"
                                leftSection={<IconCloudUpload size={14} />}
                                onClick={() => uploadDialogImage(pageIndex, panelIndex)}
                                loading={uploadImageMutation.isPending}
                              >
                                Загрузить панель
                              </Button>
                              <Button
                                size="xs"
                                color="dark"
                                leftSection={<IconSparkles size={14} />}
                                loading={generateImageMutation.isPending && generatingPanelKey === panelUploadKey}
                                onClick={() => generateDialogImage(pageIndex, panelIndex, panelText)}
                              >
                                Сгенерировать панель
                              </Button>
                            </Group>

                            <Group gap={6} wrap="wrap">
                              {ILLUSTRATION_PRESETS.slice(0, 5).map((preset) => (
                                <Button
                                  key={`${panelUploadKey}-${preset.id}`}
                                  size="xs"
                                  variant="outline"
                                  color="dark"
                                  onClick={() => applyDialogTemplate(pageIndex, panelIndex, preset.url)}
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })
                  )}
                </Stack>

                <Divider />
                <Group justify="space-between">
                  <Text fw={700}>Выборы на этой странице</Text>
                  <Button
                    variant="subtle"
                    color="dark"
                    leftSection={<IconArrowNarrowDown size={16} />}
                    onClick={() =>
                      setPageField(pageIndex, (item) => ({
                        ...item,
                        choices: [...item.choices, { label: "Новый выбор", targetPageKey: "" }]
                      }))
                    }
                  >
                    Добавить выбор
                  </Button>
                </Group>

                <Stack gap="xs">
                  {page.choices.map((choice, choiceIndex) => (
                    <Box key={`${choiceIndex}-${page.pageKey}`}>
                      <Grid align="end">
                        <Grid.Col span={{ base: 12, md: 5 }}>
                          <DebouncedTextInput
                            label={`Текст выбора ${choiceIndex + 1}`}
                            value={choice.label}
                            onCommit={(nextValue) =>
                              setPageField(pageIndex, (item) => ({
                                ...item,
                                choices: item.choices.map((itemChoice, indexChoice) =>
                                  indexChoice === choiceIndex ? { ...itemChoice, label: nextValue } : itemChoice
                                )
                              }))
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 5 }}>
                          <Select
                            label="Переход к странице"
                            value={choice.targetPageKey}
                            data={pageKeyOptions}
                            onChange={(value) =>
                              setPageField(pageIndex, (item) => ({
                                ...item,
                                choices: item.choices.map((itemChoice, indexChoice) =>
                                  indexChoice === choiceIndex ? { ...itemChoice, targetPageKey: value ?? "" } : itemChoice
                                )
                              }))
                            }
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 2 }}>
                          <Button
                            variant="light"
                            color="red"
                            fullWidth
                            onClick={() =>
                              setPageField(pageIndex, (item) => ({
                                ...item,
                                choices: item.choices.filter((_, idx) => idx !== choiceIndex)
                              }))
                            }
                          >
                            Удалить
                          </Button>
                        </Grid.Col>
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Stack>
        </>
      )}
    </Stack>
  );
}
