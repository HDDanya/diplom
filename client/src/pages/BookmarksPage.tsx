import { ActionIcon, Badge, Button, Card, Grid, Group, Image, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBookmarkFilled, IconPlayerPlay } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { fetchBookmarkedComics, toggleBookmark } from "../features/comics/api";
import { resolveAssetUrl } from "../lib/assets";

export function BookmarksPage() {
  const queryClient = useQueryClient();
  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarkedComics
  });

  const bookmarkMutation = useMutation({
    mutationFn: (comicId: string) => toggleBookmark(comicId),
    onSuccess: (result) => {
      notifications.show({
        title: result.bookmarked ? "Добавлено" : "Удалено",
        message: result.bookmarked ? "Комикс добавлен в закладки" : "Комикс удалён из закладок",
        color: "dark"
      });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic"] });
    }
  });

  if (bookmarksQuery.isLoading) {
    return <LoadingScreen label="Загружаем закладки" />;
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1} ff="Bebas Neue" size="3rem">
          Мои закладки
        </Title>
        <Text c="dimmed">Ваши сохранённые комиксы. Метка закладки видна в каталоге и на карточке комикса.</Text>
      </Stack>

      <Grid>
        {bookmarksQuery.data?.map((comic) => (
          <Grid.Col span={{ base: 12, md: 6 }} key={comic.id}>
            <Card className="ink-grid" p={0} radius="md" style={{ overflow: "hidden", height: "100%" }}>
              <Image
                h={220}
                src={resolveAssetUrl(comic.coverImageUrl) || "/comic-placeholder.svg"}
                alt={comic.title}
                fallbackSrc="/comic-placeholder.svg"
                style={{ filter: "grayscale(100%) contrast(1.05)" }}
              />

              <Stack p="md" gap="xs">
                <Group justify="space-between" align="start">
                  <Title order={3} ff="Bebas Neue" size="2rem">
                    {comic.title}
                  </Title>
                  <Group gap={6}>
                    <Badge color="dark" leftSection={<IconBookmarkFilled size={12} />}>
                      В закладках
                    </Badge>
                    <ActionIcon
                      variant="outline"
                      color="dark"
                      onClick={() => bookmarkMutation.mutate(comic.id)}
                      loading={bookmarkMutation.isPending}
                      aria-label="Убрать из закладок"
                    >
                      <IconBookmarkFilled size={13} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Text size="sm" c="dimmed" lineClamp={3}>
                  {comic.summary}
                </Text>
                <Text size="xs" c="dimmed">
                  Автор: {comic.author?.displayName ?? "Неизвестно"}
                </Text>

                <Group mt="sm">
                  <Button component={Link} to={`/comics/${comic.slug}`} variant="outline" color="dark">
                    Подробнее
                  </Button>
                  <Button component={Link} to={`/read/${comic.slug}`} color="dark" leftSection={<IconPlayerPlay size={15} />}>
                    Читать
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {bookmarksQuery.data?.length === 0 && (
        <Card withBorder p="lg">
          <Text c="dimmed">Пока нет закладок. Откройте любой комикс и нажмите кнопку “В закладки”.</Text>
        </Card>
      )}
    </Stack>
  );
}
