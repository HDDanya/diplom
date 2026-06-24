import { Badge, Button, Card, Center, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowBackUp,
  IconArrowLeft,
  IconArrowRight,
  IconBookmarkFilled,
  IconBookmarkPlus,
  IconCornerDownRight
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { fetchComicForRead, saveProgress, toggleBookmark } from "../features/comics/api";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";
import { createTransitionVariants, transitionClassName } from "../lib/transitions";
import { ComicPage, TransitionStyle } from "../types/api";

function extractPanels(body: string) {
  const dividerPanels = body
    .split(/\n\s*---\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  if (dividerPanels.length > 0) {
    return dividerPanels.slice(0, 6);
  }

  const sentencePanels = body
    .split(/(?<=[.!?])\s+/g)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentencePanels.length === 0) {
    return [body.trim()];
  }

  const chunks: string[] = [];
  const chunkSize = Math.ceil(sentencePanels.length / Math.min(sentencePanels.length, 4));
  for (let index = 0; index < sentencePanels.length; index += chunkSize) {
    chunks.push(sentencePanels.slice(index, index + chunkSize).join(" "));
  }

  return chunks.slice(0, 6);
}

export function ReaderPage() {
  const { slug = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const comicQuery = useQuery({
    queryKey: ["read-comic", slug],
    queryFn: () => fetchComicForRead(slug)
  });

  const progressMutation = useMutation({
    mutationFn: ({ comicId, pageId }: { comicId: string; pageId: string }) => saveProgress(comicId, pageId)
  });
  const bookmarkMutation = useMutation({
    mutationFn: (comicId: string) => toggleBookmark(comicId),
    onSuccess: (result) => {
      notifications.show({
        title: result.bookmarked ? "Добавлено" : "Удалено",
        message: result.bookmarked ? "Комикс добавлен в закладки" : "Комикс удалён из закладок",
        color: "dark"
      });
      queryClient.setQueryData(["read-comic", slug], (previous: any) => {
        if (!previous) {
          return previous;
        }
        return { ...previous, isBookmarked: result.bookmarked };
      });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["comic", slug] });
    }
  });

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [direction, setDirection] = useState(1);
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>("SLIDE_LEFT");

  useEffect(() => {
    if (!comicQuery.data) {
      return;
    }
    const pages = Array.isArray(comicQuery.data.pages) ? comicQuery.data.pages : [];
    const fallbackStartPageId = pages[0]?.id ?? null;
    setCurrentPageId(comicQuery.data.startPageId ?? fallbackStartPageId);
    setHistory([]);
  }, [comicQuery.data]);

  const pageMap = useMemo(() => {
    const map = new Map<string, ComicPage>();
    const pages = Array.isArray(comicQuery.data?.pages) ? comicQuery.data.pages : [];
    pages.forEach((page) => {
      map.set(page.id, page);
    });
    return map;
  }, [comicQuery.data]);

  const currentPage = currentPageId ? pageMap.get(currentPageId) ?? null : null;

  if (comicQuery.isLoading) {
    return <LoadingScreen label="Открываем комикс" />;
  }

  if (!comicQuery.data || !currentPage) {
    return (
      <Center h="60vh">
        <Stack align="center">
          <Text c="dimmed">Не удалось открыть комикс</Text>
          <Button component={Link} to="/" color="dark">
            В каталог
          </Button>
        </Stack>
      </Center>
    );
  }

  const comic = comicQuery.data;
  const pages = Array.isArray(comic.pages) ? comic.pages : [];
  const currentIndex = pages.findIndex((page) => page.id === currentPage.id);
  const variants = createTransitionVariants(transitionStyle, direction);
  const currentChoices = currentPage.choices ?? [];
  const panelTexts = extractPanels(currentPage.body);
  const panelImages = Array.isArray(currentPage.panelImageUrls) ? currentPage.panelImageUrls : [];
  const fallbackPanelImage = resolveAssetUrl(currentPage.imageUrl) || "/comic-placeholder.svg";
  const panelAnimationClassName = transitionClassName(currentPage.transitionStyle);

  const handleChoice = (targetPageId: string) => {
    const targetPage = pageMap.get(targetPageId);
    if (!targetPage) {
      return;
    }

    setDirection(targetPage.position > currentPage.position ? 1 : -1);
    setTransitionStyle(currentPage.transitionStyle);
    setHistory((prev) => [...prev, currentPage.id]);
    setCurrentPageId(targetPage.id);

    if (isAuthenticated) {
      progressMutation.mutate({ comicId: comic.id, pageId: targetPage.id });
    }
  };

  const handleBack = () => {
    if (history.length === 0) {
      return;
    }

    const previousPageId = history[history.length - 1];
    setDirection(-1);
    setTransitionStyle("SLIDE_RIGHT");
    setHistory((prev) => prev.slice(0, -1));
    setCurrentPageId(previousPageId);

    if (isAuthenticated) {
      progressMutation.mutate({ comicId: comic.id, pageId: previousPageId });
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="start">
        <Stack gap={2}>
          <Title order={1} ff="Bebas Neue" size="3rem">
            {comic.title}
          </Title>
          <Text c="dimmed">Автор: {comic.author.displayName}</Text>
        </Stack>

        <Group>
          {isAuthenticated && (
            <Button
              variant={comic.isBookmarked ? "light" : "outline"}
              color="dark"
              leftSection={comic.isBookmarked ? <IconBookmarkFilled size={14} /> : <IconBookmarkPlus size={14} />}
              onClick={() => bookmarkMutation.mutate(comic.id)}
              loading={bookmarkMutation.isPending}
            >
              {comic.isBookmarked ? "Убрать закладку" : "В закладки"}
            </Button>
          )}
          <Badge color="dark" variant="light">
            {currentIndex + 1}/{pages.length}
          </Badge>
          <Button variant="outline" color="dark" onClick={handleBack} disabled={history.length === 0} leftSection={<IconArrowLeft size={16} />}>
            Назад
          </Button>
          <Button component={Link} to={`/comics/${comic.slug}`} variant="subtle" color="dark" leftSection={<IconArrowBackUp size={16} />}>
            К описанию
          </Button>
        </Group>
      </Group>

      <Card className="reader-surface comic-sheet-wrap" p="lg" style={{ overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage.id}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.56, ease: [0.22, 1, 0.36, 1] }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={2} ff="Bebas Neue" size="2.2rem">
                  {currentPage.title}
                </Title>
                <Badge variant="outline" color="dark">
                  {currentPage.transitionStyle}
                </Badge>
              </Group>

              <div className={`comic-canvas ${panelAnimationClassName}`}>
                {panelTexts.map((panelText, index) => (
                  <article key={`${currentPage.id}-${index}`} className={`comic-panel panel-${index % 6}`}>
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

              <Stack gap="xs" mt="sm">
                {currentChoices.length === 0 ? (
                  <Card withBorder p="sm">
                    <Text c="dimmed" size="sm">
                      Финал ветки. Вернитесь назад и попробуйте другой выбор.
                    </Text>
                  </Card>
                ) : (
                  <>
                    {currentChoices.length === 4 && (
                      <Group justify="space-between">
                        <Text fw={700}>Выберите один из четырёх исходов</Text>
                        <Badge color="red" variant="filled">
                          4 варианта
                        </Badge>
                      </Group>
                    )}
                    <SimpleGrid
                      data-testid="reader-choices"
                      cols={{ base: 1, sm: currentChoices.length === 4 ? 2 : 1 }}
                      spacing="xs"
                    >
                      {currentChoices.map((choice) => (
                        <Button
                          key={choice.id}
                          variant="light"
                          color="dark"
                          justify="space-between"
                          leftSection={<IconCornerDownRight size={16} />}
                          rightSection={<IconArrowRight size={16} />}
                          onClick={() => handleChoice(choice.targetPageId)}
                          h="auto"
                          mih={48}
                          py="sm"
                          styles={{ label: { whiteSpace: "normal", textAlign: "left" } }}
                        >
                          {choice.label}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </>
                )}
              </Stack>
            </Stack>
          </motion.div>
        </AnimatePresence>
      </Card>
    </Stack>
  );
}
