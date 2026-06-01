import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowRight, IconBookmarkFilled, IconBookmarkPlus, IconSearch } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchPublicComics, toggleBookmark } from "../features/comics/api";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebouncedState("", 300);

  const comicsQuery = useQuery({
    queryKey: ["public-comics", search],
    queryFn: () => fetchPublicComics(search)
  });

  const bookmarkMutation = useMutation({
    mutationFn: (comicId: string) => toggleBookmark(comicId),
    onSuccess: (result) => {
      notifications.show({
        title: result.bookmarked ? "Добавлено" : "Удалено",
        message: result.bookmarked ? "Комикс добавлен в закладки" : "Комикс удалён из закладок",
        color: "dark"
      });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    }
  });

  return (
    <Stack gap="lg">
      <Stack gap={6}>
        <Title order={1} ff="Bebas Neue" size="3rem">
          Интерактивные комиксы
        </Title>
        <Text c="dimmed" maw={720}>
          Исследуйте истории с ветвящимся сюжетом. Каждый выбор меняет маршрут, а анимированные переходы создают
          эффект живого перелистывания страниц.
        </Text>
      </Stack>

      <TextInput
        placeholder="Найти комикс по названию или описанию"
        leftSection={<IconSearch size={16} />}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />

      <Grid>
        {comicsQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Grid.Col span={{ base: 12, md: 6 }} key={index}>
                <Card withBorder radius="md" p="md">
                  <Skeleton h={180} mb="sm" />
                  <Skeleton h={24} mb={8} />
                  <Stack gap={6}>
                    <Skeleton h={14} />
                    <Skeleton h={14} />
                    <Skeleton h={14} />
                  </Stack>
                </Card>
              </Grid.Col>
            ))
          : comicsQuery.data?.map((comic) => (
              <Grid.Col span={{ base: 12, md: 6 }} key={comic.id}>
                <Card className="ink-grid comic-list-card" p={0} radius="md" style={{ overflow: "hidden" }}>
                  <Box className="comic-cover-box">
                    <img
                      className="comic-cover-image"
                      src={resolveAssetUrl(comic.coverImageUrl) || "/comic-placeholder.svg"}
                      alt={comic.title}
                      loading="lazy"
                    />
                  </Box>
                  <Stack p="md" gap="xs">
                    <Group justify="space-between" align="start">
                      <Title order={3} ff="Bebas Neue" size="2rem">
                        {comic.title}
                      </Title>
                      <Group gap={6}>
                        {isAuthenticated && (
                          <ActionIcon
                            variant={comic.isBookmarked ? "filled" : "outline"}
                            color="dark"
                            onClick={() => bookmarkMutation.mutate(comic.id)}
                            loading={bookmarkMutation.isPending}
                            aria-label={comic.isBookmarked ? "Убрать из закладок" : "Добавить в закладки"}
                          >
                            {comic.isBookmarked ? <IconBookmarkFilled size={14} /> : <IconBookmarkPlus size={14} />}
                          </ActionIcon>
                        )}
                        <Badge color="dark" variant="light">
                          {comic.pagesCount} стр.
                        </Badge>
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
                      <Button component={Link} to={`/read/${comic.slug}`} color="dark" rightSection={<IconArrowRight size={16} />}>
                        Читать
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
      </Grid>

      {!comicsQuery.isLoading && comicsQuery.data?.length === 0 && (
        <Text c="dimmed">По вашему запросу ничего не найдено.</Text>
      )}
    </Stack>
  );
}
