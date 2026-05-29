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

const TRANSITIONS: TransitionStyle[] = ["SLIDE_LEFT", "SLIDE_RIGHT", "FADE", "ZOOM", "NONE"];
const SCENE_TEMPLATES: Array<{
  id: string;
  label: string;
  title: string;
  body: string;
  sketchPrompt: string;
  transitionStyle: TransitionStyle;
}> = [
  {
    id: "intro",
    label: "Вступление",
    title: "Новая сцена",
    body:
      "Герой входит в новую локацию и замечает деталь, которая меняет ход событий.\n---\nНа фоне слышен шум города, а на стене появляется символ организации.\n---\nРешение в конце сцены открывает следующую ветку сюжета.",
    sketchPrompt: "noir intro scene, city fog, monochrome comic sketch",
    transitionStyle: "FADE"
  },
  {
    id: "investigation",
    label: "Расследование",
    title: "Сбор улик",
    body:
      "Герой изучает улики и находит связку фактов, которые раньше казались случайными.\n---\nВ архиве всплывает имя ключевого свидетеля и его последний маршрут.\n---\nТеперь можно выбрать: продолжить слежку или проверить скрытую локацию.",
    sketchPrompt: "detective investigation board, documents, noir crosshatching",
    transitionStyle: "ZOOM"
  },
  {
    id: "dialogue",
    label: "Диалог",
    title: "Напряжённый разговор",
    body:
      "Собеседник сначала молчит, но затем даёт важную подсказку о следующей цели.\n---\nКаждая реплика открывает новые детали заговора и мотивы участников.\n---\nФинальная фраза задаёт моральный выбор, влияющий на концовку.",
    sketchPrompt: "close-up dialogue panel, dramatic lighting, black and white",
    transitionStyle: "SLIDE_LEFT"
  },
  {
    id: "action",
    label: "Экшен",
    title: "Погоня",
    body:
      "Сцена начинается резким рывком: герой преследует цель через тесные коридоры.\n---\nПрепятствия заставляют выбирать быстрый и рискованный маршрут.\n---\nВ конце появляется шанс перехватить противника или спасти союзника.",
    sketchPrompt: "dynamic chase sequence, motion lines, noir action panels",
    transitionStyle: "SLIDE_RIGHT"
  },
  {
    id: "finale",
    label: "Финал",
    title: "Кульминация",
    body:
      "Противники сталкиваются в ключевой точке, и раскрывается главный секрет истории.\n---\nПоследствия выбора становятся очевидными для всех персонажей.\n---\nЭта сцена завершает ветку и оставляет эмоциональный акцент для эпилога.",
    sketchPrompt: "epic noir finale, rooftop confrontation, monochrome contrast",
    transitionStyle: "FADE"
  }
];
const ILLUSTRATION_PRESETS = [
  {
    label: "Vintage Crime",
    description: "Старая детективная обложка с крупным заголовком и фактурной печатью",
    url: "/uploads/seed/vintage-detective-cover.svg",
    promptSeed:
      "1950s crime comic cover, detective in trench coat, night city alley, halftone dots, aged paper texture, off-register print, bold ink lines, monochrome with warm paper tone"
  },
  {
    label: "Vintage Horror",
    description: "Пульп-ужасы с контрастными тенями и газетной текстурой",
    url: "/uploads/seed/vintage-horror-cover.svg",
    promptSeed:
      "retro horror comic cover, looming silhouettes, dramatic shadows, vintage halftone screen, weathered paper, thick black inks, old print imperfections, monochrome"
  },
  {
    label: "Vintage Adventure",
    description: "Приключенческая обложка с энергичной композицией и крупным слоганом",
    url: "/uploads/seed/vintage-adventure-cover.svg",
    promptSeed:
      "1960s adventure comic cover, dynamic composition, river docks at night, heroic silhouette, motion lines, halftone texture, aged pulp paper, monochrome ink illustration"
  },
  {
    label: "Vintage Serial",
    description: "Серийный «дело недели» формат в духе старых печатных выпусков",
    url: "/uploads/seed/vintage-serial-cover.svg",
    promptSeed:
      "old serial detective comic cover, case file typography, split-panel composition, halftone dots, rough ink outlines, yellowed paper, antique monochrome print style"
  },
  {
    label: "Noir Chase Panel",
    description: "Динамичный кадр погони в узких улицах",
    url: "/uploads/seed/page-03.svg",
    promptSeed:
      "old comic interior panel, night chase in narrow streets, speed lines, dramatic perspective, heavy inking, halftone shadows, monochrome"
  },
  {
    label: "Archive Investigation Panel",
    description: "Кадр расследования с уликами и архивными картотеками",
    url: "/uploads/seed/page-04.svg",
    promptSeed:
      "retro detective comic panel, archive room with clue board and documents, low-key lighting, crosshatching, halftone texture, monochrome print look"
  }
];

type EditorPage = ComicWritePage & {
  pendingImageFile: File | null;
};

function makeEmptyPage(position: number): EditorPage {
  return {
    pageKey: `page_${position}`,
    title: `Сцена ${position}`,
    body: "",
    imageUrl: "",
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

    return {
      pageKey: `scene_${position}`,
      title: firstSentence || `Сцена ${position}`,
      body: block,
      imageUrl: "",
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
    pages: comic.pages.map((page) => ({
      pageKey: page.pageKey,
      title: page.title,
      body: page.body,
      imageUrl: page.imageUrl ?? "",
      sketchPrompt: page.sketchPrompt ?? "",
      transitionStyle: page.transitionStyle,
      position: page.position,
      isStart: page.isStart,
      choices: page.choices.map((choice) => ({
        label: choice.label,
        targetPageKey: pageKeyById.get(choice.targetPageId) ?? ""
      })),
      pendingImageFile: null
    }))
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
    setPages((current) =>
      current.map((item, index) => (index === pageIndex ? { ...item, imageUrl: uploaded.url, pendingImageFile: null } : item))
    );
    notifications.show({ title: "Загружено", message: "Кадр страницы сохранён", color: "dark" });
  };

  const applySceneTemplate = (pageIndex: number, templateId: string) => {
    const template = SCENE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setPages((current) =>
      current.map((item, index) =>
        index === pageIndex
          ? {
              ...item,
              title: template.title,
              body: template.body,
              sketchPrompt: template.sketchPrompt,
              transitionStyle: template.transitionStyle
            }
          : item
      )
    );
  };

  const applyIllustrationTemplate = (pageIndex: number, imageUrl: string) => {
    setPages((current) =>
      current.map((item, index) => (index === pageIndex ? { ...item, imageUrl, pendingImageFile: null } : item))
    );
  };

  const buildPromptFromPage = (page: EditorPage) => {
    const pageTitle = page.title.trim() || "comic scene";
    const firstBeat = page.body
      .split(/\n\s*---\s*\n/g)
      .map((part) => part.trim())
      .filter(Boolean)[0] ?? "dramatic story moment";

    return `black and white comic illustration, ${pageTitle.toLowerCase()}, ${firstBeat.toLowerCase()}, high contrast ink, cinematic composition, expressive linework`;
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
      setPages((current) =>
        current.map((item, index) =>
          index === pageIndex ? { ...item, imageUrl: generated.url, pendingImageFile: null, sketchPrompt: prompt } : item
        )
      );
      notifications.show({
        title: "Кадр создан",
        message: "Иллюстрация сгенерирована по prompt и подставлена в страницу",
        color: "dark"
      });
    } finally {
      setGeneratingPageIndex(null);
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
              <TextInput label="Название" value={title} onChange={(event) => setTitle(event.currentTarget.value)} required />
              <Textarea
                label="Краткое описание"
                autosize
                minRows={3}
                value={summary}
                onChange={(event) => setSummary(event.currentTarget.value)}
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
                    style={{ filter: "grayscale(100%)" }}
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
          <Textarea
            value={script}
            onChange={(event) => setScript(event.currentTarget.value)}
            autosize
            minRows={6}
            maxRows={14}
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

        {pages.map((page, pageIndex) => (
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
                  <TextInput
                    label="Ключ страницы"
                    value={page.pageKey}
                    onChange={(event) =>
                      setPages((current) =>
                        current.map((item, index) =>
                          index === pageIndex ? { ...item, pageKey: event.currentTarget.value } : item
                        )
                      )
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Переход"
                    value={page.transitionStyle}
                    data={TRANSITIONS.map((transition) => ({ label: transition, value: transition }))}
                    onChange={(value) =>
                      setPages((current) =>
                        current.map((item, index) =>
                          index === pageIndex
                            ? {
                                ...item,
                                transitionStyle: (value as TransitionStyle) || "SLIDE_LEFT"
                              }
                            : item
                        )
                      )
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

              <TextInput
                label="Заголовок"
                value={page.title}
                onChange={(event) =>
                  setPages((current) =>
                    current.map((item, index) =>
                      index === pageIndex ? { ...item, title: event.currentTarget.value } : item
                    )
                  )
                }
              />

              <Textarea
                label="Текст страницы"
                autosize
                minRows={3}
                value={page.body}
                onChange={(event) =>
                  setPages((current) =>
                    current.map((item, index) =>
                      index === pageIndex ? { ...item, body: event.currentTarget.value } : item
                    )
                  )
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
                        style={{ filter: "grayscale(100%)" }}
                      />
                    )}
                    <FileInput
                      clearable
                      value={page.pendingImageFile}
                      onChange={(value) =>
                        setPages((current) =>
                          current.map((item, index) =>
                            index === pageIndex ? { ...item, pendingImageFile: value } : item
                          )
                        )
                      }
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      placeholder="Выберите картинку для страницы"
                    />
                    <Stack gap={6}>
                      <Text size="xs" c="dimmed">
                        Шаблоны иллюстраций
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
                                  style={{ filter: "grayscale(100%)" }}
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
                                    Применить
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="subtle"
                                    color="dark"
                                    onClick={() =>
                                      setPages((current) =>
                                        current.map((item, index) =>
                                          index === pageIndex ? { ...item, sketchPrompt: preset.promptSeed } : item
                                        )
                                      )
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
                        Загрузить кадр
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
                  <TextInput
                    label="Prompt для генерации иллюстрации (текстовое описание кадра)"
                    value={page.sketchPrompt}
                    onChange={(event) =>
                      setPages((current) =>
                        current.map((item, index) =>
                          index === pageIndex ? { ...item, sketchPrompt: event.currentTarget.value } : item
                        )
                      )
                    }
                  />
                  <Text size="xs" c="dimmed" mt={6}>
                    Prompt управляет AI-генерацией: чем конкретнее сцена, ракурс и стиль, тем лучше результат.
                  </Text>
                  <Group mt={8}>
                    <Button
                      size="xs"
                      variant="light"
                      color="dark"
                      onClick={() =>
                        setPages((current) =>
                          current.map((item, index) =>
                            index === pageIndex ? { ...item, sketchPrompt: buildPromptFromPage(item) } : item
                          )
                        )
                      }
                    >
                      Автопромпт из сцены
                    </Button>
                    <Button
                      size="xs"
                      color="dark"
                      leftSection={<IconSparkles size={14} />}
                      loading={generateImageMutation.isPending && generatingPageIndex === pageIndex}
                      onClick={() => generatePageImage(pageIndex)}
                    >
                      Сгенерировать кадр
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>

              <Divider />
              <Group justify="space-between">
                <Text fw={700}>Выборы на этой странице</Text>
                <Button
                  variant="subtle"
                  color="dark"
                  leftSection={<IconArrowNarrowDown size={16} />}
                  onClick={() =>
                    setPages((current) =>
                      current.map((item, index) =>
                        index === pageIndex
                          ? {
                              ...item,
                              choices: [...item.choices, { label: "Новый выбор", targetPageKey: "" }]
                            }
                          : item
                      )
                    )
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
                        <TextInput
                          label={`Текст выбора ${choiceIndex + 1}`}
                          value={choice.label}
                          onChange={(event) =>
                            setPages((current) =>
                              current.map((item, index) =>
                                index === pageIndex
                                  ? {
                                      ...item,
                                      choices: item.choices.map((itemChoice, indexChoice) =>
                                        indexChoice === choiceIndex
                                          ? { ...itemChoice, label: event.currentTarget.value }
                                          : itemChoice
                                      )
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 5 }}>
                        <Select
                          label="Переход к странице"
                          value={choice.targetPageKey}
                          data={pageKeyOptions}
                          onChange={(value) =>
                            setPages((current) =>
                              current.map((item, index) =>
                                index === pageIndex
                                  ? {
                                      ...item,
                                      choices: item.choices.map((itemChoice, indexChoice) =>
                                        indexChoice === choiceIndex
                                          ? { ...itemChoice, targetPageKey: value ?? "" }
                                          : itemChoice
                                      )
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <Button
                          variant="light"
                          color="red"
                          fullWidth
                          onClick={() =>
                            setPages((current) =>
                              current.map((item, index) =>
                                index === pageIndex
                                  ? {
                                      ...item,
                                      choices: item.choices.filter((_, idx) => idx !== choiceIndex)
                                    }
                                  : item
                              )
                            )
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
        ))}
      </Stack>
    </Stack>
  );
}
