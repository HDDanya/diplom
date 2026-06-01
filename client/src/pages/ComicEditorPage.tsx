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
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowNarrowDown, IconCloudUpload, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import {
  createComic,
  fetchComicBySlug,
  generateComicImage,
  publishComic,
  updateComic,
  uploadComicImage
} from "../features/comics/api";
import { resolveAssetUrl } from "../lib/assets";
import { ComicDetail, ComicStatus, ComicWritePage, TransitionStyle } from "../types/api";

const TRANSITIONS: TransitionStyle[] = [
  "SLIDE_LEFT",
  "SLIDE_RIGHT",
  "FADE",
  "ZOOM",
  "PAGE_FLIP",
  "VERTICAL_REVEAL",
  "GLITCH_CUT",
  "WHIP_PAN",
  "INK_BLEED",
  "PARALLAX_SWEEP",
  "NONE"
];

const UNIVERSAL_COMIC_WEB_IMAGES = {
  blueBeetle01: "https://upload.wikimedia.org/wikipedia/commons/7/79/Blue_Beetle_Number_1_Cover.jpg",
  planet01: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Planet_Comics_01.jpg",
  planet03: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Planet_Comics_03.jpg",
  planet05: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Planet_Comics_05.jpg",
  planet11: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Planet_Comics_11.jpg",
  planet12: "https://upload.wikimedia.org/wikipedia/commons/1/18/Planet_Comics_12.jpg",
  planet57: "https://upload.wikimedia.org/wikipedia/commons/6/68/Planet_Comics_57.jpg",
  planet69: "https://upload.wikimedia.org/wikipedia/commons/a/af/Planet_Comics_69.jpg",
  planetNo1HiRes: "https://upload.wikimedia.org/wikipedia/commons/5/55/Planet_Comics_no._1_%28high-res%29.jpg",
  planetNo2Cover: "https://upload.wikimedia.org/wikipedia/commons/4/43/Planet_Comics_no._2_%28cover%29.jpg"
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
    label: "Выход героя",
    title: "Тревога над Неон-Сити",
    body: `Над городом разрывается сирена, и на стеклянной башне вспыхивает знак бедствия Лиги.
---
Герой приземляется на крышу монорельса, замечая внизу панику и тени дронов.
---
На визоре появляется выбор маршрута: к реактору, в метро или к захваченному мосту.`,
    sketchPrompt:
      "silver age superhero comic panel, skyline at night, dramatic spotlight, halftone dots, rich cinematic coloring, premium inks",
    imageUrl: UNIVERSAL_COMIC_WEB_IMAGES.planetNo1HiRes,
    panelImageUrls: [
      UNIVERSAL_COMIC_WEB_IMAGES.planetNo1HiRes,
      UNIVERSAL_COMIC_WEB_IMAGES.planet03,
      UNIVERSAL_COMIC_WEB_IMAGES.planet12
    ],
    transitionStyle: "PAGE_FLIP"
  },
  {
    id: "hero-investigation",
    label: "Расследование",
    title: "Улики в технопарке",
    body: `В лаборатории находишь вскрытый сейф и схему устройства, способного отключить электросеть города.
---
На стене проецируется маршрут грузовиков корпорации Black Volt и имена подкупленных чиновников.
---
Партнёр по связи предупреждает: кто-то уже стирает следы на центральном сервере.`,
    sketchPrompt:
      "classic comic detective lab, superhero silhouette, evidence board, layered shading, detailed inks, cinematic color grading",
    imageUrl: UNIVERSAL_COMIC_WEB_IMAGES.planet11,
    panelImageUrls: [
      UNIVERSAL_COMIC_WEB_IMAGES.planet11,
      UNIVERSAL_COMIC_WEB_IMAGES.planet01,
      UNIVERSAL_COMIC_WEB_IMAGES.planet57
    ],
    transitionStyle: "INK_BLEED"
  },
  {
    id: "hero-dialogue",
    label: "Переговоры",
    title: "Сделка с информатором",
    body: `Информатор в маске требует иммунитет в обмен на координаты тайного ангара.
---
Его руки дрожат: за ним следят наёмники, и времени осталось считанные минуты.
---
Финальная фраза меняет тон: 'Либо ты спасаешь район, либо гонишься за главарём'.`,
    sketchPrompt:
      "vintage superhero noir dialogue, rain, close-up faces, speech bubbles, dramatic color contrast, polished comic finish",
    imageUrl: UNIVERSAL_COMIC_WEB_IMAGES.planet57,
    panelImageUrls: [
      UNIVERSAL_COMIC_WEB_IMAGES.planet57,
      UNIVERSAL_COMIC_WEB_IMAGES.blueBeetle01,
      UNIVERSAL_COMIC_WEB_IMAGES.planet03
    ],
    transitionStyle: "VERTICAL_REVEAL"
  },
  {
    id: "hero-action",
    label: "Экшен",
    title: "Бой на магнитном мосту",
    body: `По мосту летят искры: герой отбивает очередь энергетических копий и прыгает между вагонами.
---
Антагонист запускает импульс, и весь транспорт застывает над рекой.
---
Остаётся три секунды, чтобы сорвать генератор или эвакуировать пассажиров.`,
    sketchPrompt:
      "dynamic superhero action comic, speed lines, bridge battle, high contrast lighting, vibrant inks, premium print look",
    imageUrl: UNIVERSAL_COMIC_WEB_IMAGES.planet69,
    panelImageUrls: [
      UNIVERSAL_COMIC_WEB_IMAGES.planet69,
      UNIVERSAL_COMIC_WEB_IMAGES.planet05,
      UNIVERSAL_COMIC_WEB_IMAGES.planet12
    ],
    transitionStyle: "WHIP_PAN"
  },
  {
    id: "hero-finale",
    label: "Финал",
    title: "Шторм над реактором",
    body: `В ядре башни запускается протокол 'Чёрная ночь' — город может остаться без света и связи.
---
Союзники держат оборону, пока ты прорываешься к пульту перезапуска.
---
Последний выбор: публично раскрыть заговор или скрыть правду ради предотвращения паники.`,
    sketchPrompt:
      "epic superhero comic finale, reactor chamber, lightning, dramatic inks, cinematic palette, ultra-detailed comic art",
    imageUrl: UNIVERSAL_COMIC_WEB_IMAGES.planetNo2Cover,
    panelImageUrls: [
      UNIVERSAL_COMIC_WEB_IMAGES.planetNo2Cover,
      UNIVERSAL_COMIC_WEB_IMAGES.planet69,
      UNIVERSAL_COMIC_WEB_IMAGES.blueBeetle01
    ],
    transitionStyle: "PARALLAX_SWEEP"
  }
];

const ILLUSTRATION_PRESETS = [
  {
    label: "Planet Comics #1",
    description: "Космический pulp-фон с ретро-комиксной композицией",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet01,
    promptSeed: "retro comic sci-fi cityscape, dramatic location background, vintage print texture"
  },
  {
    label: "Planet Comics #3",
    description: "Универсальная приключенческая сцена с глубокой перспективой",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet03,
    promptSeed: "adventure comic background, dynamic perspective, halftone texture, location-focused art"
  },
  {
    label: "Planet Comics #5",
    description: "Фон для экшен-сцен с яркими винтажными тонами",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet05,
    promptSeed: "vintage action comic environment, energetic color palette, rich inks"
  },
  {
    label: "Planet Comics #11",
    description: "Футуристическая локация для научно-фантастических эпизодов",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet11,
    promptSeed: "classic sci-fi comic location, industrial skyline, clean panel readability"
  },
  {
    label: "Planet Comics #12",
    description: "Универсальная обложечная сцена для переходов и развилок",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet12,
    promptSeed: "retro comic location shot, cinematic framing, print-era halftone styling"
  },
  {
    label: "Planet Comics #57",
    description: "Темная локация для тревожных или ночных сцен",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet57,
    promptSeed: "dark comic backdrop, noir lighting, bold ink contours, environment-focused scene"
  },
  {
    label: "Planet Comics #69",
    description: "Контрастный фон для кульминаций и крупных событий",
    url: UNIVERSAL_COMIC_WEB_IMAGES.planet69,
    promptSeed: "high-contrast vintage comic scene, dramatic sky, epic location composition"
  },
  {
    label: "Blue Beetle #1",
    description: "Классическая универсальная ретро-комиксная стилистика",
    url: UNIVERSAL_COMIC_WEB_IMAGES.blueBeetle01,
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
    mutationFn: (prompt: string) => generateComicImage(prompt),
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
      "dramatic superhero moment";

    return `premium superhero comic illustration, ${pageTitle.toLowerCase()}, ${firstBeat.toLowerCase()}, cinematic composition, polished inking, dramatic lighting, rich colors, detailed background`;
  };

  const buildPromptFromPanel = (page: EditorPage, panelText: string, panelIndex: number) => {
    const sceneTitle = page.title.trim() || "hero scene";
    return `premium superhero comic panel, scene ${panelIndex + 1}, ${sceneTitle.toLowerCase()}, ${panelText.toLowerCase()}, dramatic framing, cinematic perspective, rich colors, detailed line art, professional print shading`;
  };

  const generatePageImage = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) {
      return;
    }

    const prompt = (page.sketchPrompt ?? "").trim() || buildPromptFromPage(page);
    setGeneratingPageIndex(pageIndex);
    try {
      const generated = await generateImageMutation.mutateAsync(prompt);
      setPageField(pageIndex, (item) => ({ ...item, imageUrl: generated.url, pendingImageFile: null, sketchPrompt: prompt }));
      notifications.show({
        title: "Кадр создан",
        message: "Иллюстрация сгенерирована и подставлена в сцену",
        color: "dark"
      });
    } finally {
      setGeneratingPageIndex(null);
    }
  };

  const generateDialogImage = async (pageIndex: number, panelIndex: number, panelText: string) => {
    const page = pages[pageIndex];
    if (!page) {
      return;
    }

    const prompt = buildPromptFromPanel(page, panelText, panelIndex);
    const key = `${pageIndex}-${panelIndex}`;
    setGeneratingPanelKey(key);
    try {
      const generated = await generateImageMutation.mutateAsync(prompt);
      setPageField(pageIndex, (currentPage) => {
        const panelTexts = parseDialogPanels(currentPage.body);
        const nextUrls = ensurePanelImageArrayLength(currentPage.panelImageUrls, Math.max(panelTexts.length, 1));
        nextUrls[panelIndex] = generated.url;
        return { ...currentPage, panelImageUrls: nextUrls };
      });
      notifications.show({ title: "Панель готова", message: "Иллюстрация диалога сгенерирована", color: "dark" });
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
                    h={200}
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
            <Card key={`${page.pageKey}-${pageIndex}`} className="ink-grid" p="md">
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
                      data={TRANSITIONS.map((transition) => ({ label: transition, value: transition }))}
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
                        <Image
                          src={resolveAssetUrl(page.imageUrl) || "/comic-placeholder.svg"}
                          alt={page.title}
                          h={170}
                          fit="cover"
                          radius="sm"
                          fallbackSrc="/comic-placeholder.svg"
                          style={{ filter: "contrast(1.06) saturate(1.04)" }}
                        />
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
                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={preset.url}>
                              <Card withBorder p={6}>
                                <Stack gap={6}>
                                  <Image
                                    src={resolveAssetUrl(preset.url) || "/comic-placeholder.svg"}
                                    alt={preset.label}
                                    h={82}
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

                            <Image
                              src={resolveAssetUrl(panelImageUrl) || "/comic-placeholder.svg"}
                              alt={`panel-${panelIndex + 1}`}
                              h={150}
                              fit="cover"
                              radius="sm"
                              fallbackSrc="/comic-placeholder.svg"
                              style={{ filter: "contrast(1.06) saturate(1.04)" }}
                            />

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
                                  key={`${panelUploadKey}-${preset.url}`}
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
    </Stack>
  );
}
