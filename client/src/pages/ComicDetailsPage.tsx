import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Image,
  List,
  Rating,
  Stack,
  Text,
  Textarea,
  Title
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBook2, IconBookmarkFilled, IconBookmarkPlus, IconCornerDownRight, IconPlayerPlay, IconStarFilled } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { fetchComicBySlug, saveReview, toggleBookmark } from "../features/comics/api";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";

export function ComicDetailsPage() {
  const { slug = "" } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  const comicQuery = useQuery({
    queryKey: ["comic", slug],
    queryFn: () => fetchComicBySlug(slug)
  });

  const bookmarkMutation = useMutation({
    mutationFn: (comicId: string) => toggleBookmark(comicId),
    onSuccess: (result) => {
      notifications.show({
        title: result.bookmarked ? "Добавлено" : "Удалено",
        message: result.bookmarked ? "Комикс добавлен в закладки" : "Комикс удалён из закладок",
        color: "dark"
      });

      queryClient.setQueryData(["comic", slug], (previous: any) => {
        if (!previous) {
          return previous;
        }
        return { ...previous, isBookmarked: result.bookmarked };
      });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    }
  });

  useEffect(() => {
    const currentReview = comicQuery.data?.reviews?.find((review) => review.user.id === user?.id);
    if (!currentReview) {
      return;
    }

    setReviewRating(currentReview.rating);
    setReviewBody(currentReview.body);
  }, [comicQuery.data, user?.id]);

  const reviewMutation = useMutation({
    mutationFn: () => saveReview(comicQuery.data!.id, { rating: reviewRating, body: reviewBody }),
    onSuccess: () => {
      notifications.show({ title: "Рецензия сохранена", message: "Спасибо за оценку комикса", color: "dark" });
      queryClient.invalidateQueries({ queryKey: ["comic", slug] });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Не удалось сохранить рецензию",
        message: error.response?.data?.message ?? "Проверьте текст и оценку",
        color: "red"
      });
    }
  });

  if (comicQuery.isLoading) {
    return <LoadingScreen label="Загружаем комикс" />;
  }

  if (!comicQuery.data) {
    return <Text>Комикс не найден.</Text>;
  }

  const comic = comicQuery.data;
  const isAuthor = comic.author.id === user?.id;

  return (
    <Stack gap="lg">
      <Card className="ink-grid" p={0} style={{ overflow: "hidden" }}>
        <Image
          h={360}
          src={resolveAssetUrl(comic.coverImageUrl) || "/comic-placeholder.svg"}
          alt={comic.title}
          fallbackSrc="/comic-placeholder.svg"
          style={{ filter: "contrast(1.06) saturate(1.04)" }}
        />
        <Stack p="lg" gap="sm">
          <Group justify="space-between" align="start">
            <Stack gap={2}>
              <Title order={1} ff="Bebas Neue" size="3rem">
                {comic.title}
              </Title>
              <Text c="dimmed">Автор: {comic.author.displayName}</Text>
              <Group gap="xs">
                <Badge color="yellow" variant="light" leftSection={<IconStarFilled size={12} />}>
                  {comic.averageRating ? comic.averageRating.toFixed(1) : "нет оценок"}
                </Badge>
                <Badge color="gray" variant="light">
                  {comic.reviewsCount ?? 0} рец.
                </Badge>
              </Group>
            </Stack>
            <Badge color={comic.status === "PUBLISHED" ? "dark" : "gray"} variant="filled">
              {comic.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
            </Badge>
          </Group>

          <Text>{comic.summary}</Text>

          {comic.script && (
            <Card withBorder p="md" bg="gray.0">
              <Text fw={700} size="sm" mb={4}>
                Сценарная заметка
              </Text>
              <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                {comic.script}
              </Text>
            </Card>
          )}

          <Group>
            <Button component={Link} to={`/read/${comic.slug}`} color="dark" leftSection={<IconPlayerPlay size={16} />}>
              Читать
            </Button>
            {isAuthor && (
              <Button component={Link} to={`/editor/${comic.slug}`} variant="outline" color="dark" leftSection={<IconBook2 size={16} />}>
                Редактировать
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="subtle"
                color="dark"
                onClick={() => bookmarkMutation.mutate(comic.id)}
                leftSection={comic.isBookmarked ? <IconBookmarkFilled size={16} /> : <IconBookmarkPlus size={16} />}
              >
                {comic.isBookmarked ? "В закладках" : "В закладки"}
              </Button>
            )}
          </Group>
        </Stack>
      </Card>

      <Stack gap="sm">
        <Title order={2} ff="Bebas Neue" size="2.2rem">
          Рецензии
        </Title>
        <Divider />

        {isAuthenticated && comic.status === "PUBLISHED" && (
          <Card withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700}>{comic.myReviewId ? "Обновить свою рецензию" : "Оставить рецензию"}</Text>
                <Rating value={reviewRating} onChange={setReviewRating} fractions={1} />
              </Group>
              <Textarea
                minRows={4}
                value={reviewBody}
                onChange={(event) => setReviewBody(event.currentTarget.value)}
                placeholder="Что получилось, что зацепило, кому посоветуете этот комикс?"
              />
              <Group justify="end">
                <Button
                  color="dark"
                  onClick={() => reviewMutation.mutate()}
                  loading={reviewMutation.isPending}
                  disabled={reviewBody.trim().length < 5}
                >
                  Сохранить рецензию
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {!isAuthenticated && (
          <Card withBorder>
            <Text size="sm" c="dimmed">
              Войдите в аккаунт, чтобы оставить оценку и рецензию.
            </Text>
          </Card>
        )}

        {(comic.reviews ?? []).length === 0 ? (
          <Text c="dimmed">Рецензий пока нет.</Text>
        ) : (
          (comic.reviews ?? []).map((review) => (
            <Card key={review.id} withBorder>
              <Stack gap={6}>
                <Group justify="space-between" align="start">
                  <Stack gap={2}>
                    <Text fw={700}>{review.user.displayName}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(review.updatedAt).toLocaleDateString("ru-RU")}
                    </Text>
                  </Stack>
                  <Badge color="yellow" variant="light" leftSection={<IconStarFilled size={12} />}>
                    {review.rating}/5
                  </Badge>
                </Group>
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {review.body}
                </Text>
              </Stack>
            </Card>
          ))
        )}
      </Stack>

      <Stack gap="sm">
        <Title order={2} ff="Bebas Neue" size="2.2rem">
          Структура страниц
        </Title>
        <Divider />
        {comic.pages.map((page) => (
          <Card key={page.id} withBorder>
            <Stack gap={6}>
              <Group justify="space-between">
                <Group gap="xs">
                  <Text fw={700}>{page.position}. {page.title}</Text>
                  {page.isStart && <Badge color="dark">Старт</Badge>}
                </Group>
                <Badge variant="outline" color="gray">
                  {page.transitionStyle}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed">
                {page.body}
              </Text>

              <List size="sm" spacing={4} icon={<IconCornerDownRight size={14} />}>
                {(page.choices ?? []).map((choice) => {
                  const target = comic.pages.find((candidate) => candidate.id === choice.targetPageId);
                  return <List.Item key={choice.id}>{choice.label} to {target?.title ?? "Неизвестно"}</List.Item>;
                })}
              </List>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
