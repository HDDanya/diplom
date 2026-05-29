import { Badge, Button, Card, Grid, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBookmark, IconPencil, IconPlayerPlay, IconSparkles } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchMyComics, publishComic } from "../features/comics/api";
import { LoadingScreen } from "../components/LoadingScreen";

export function DashboardPage() {
  const queryClient = useQueryClient();

  const myComicsQuery = useQuery({
    queryKey: ["my-comics"],
    queryFn: fetchMyComics
  });

  const publishMutation = useMutation({
    mutationFn: publishComic,
    onSuccess: () => {
      notifications.show({ title: "Опубликовано", message: "Комикс стал доступен в каталоге", color: "dark" });
      queryClient.invalidateQueries({ queryKey: ["my-comics"] });
      queryClient.invalidateQueries({ queryKey: ["public-comics"] });
    },
    onError: (error: any) => {
      notifications.show({
        title: "Ошибка публикации",
        message: error.response?.data?.message ?? "Не удалось опубликовать комикс",
        color: "red"
      });
    }
  });

  if (myComicsQuery.isLoading) {
    return <LoadingScreen label="Загружаем ваш кабинет" />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="end">
        <Stack gap={2}>
          <Title order={1} ff="Bebas Neue" size="3rem">
            Кабинет автора
          </Title>
          <Text c="dimmed">Управляйте сюжетами, редактируйте ветки и публикуйте новые интерактивные главы.</Text>
        </Stack>

        <Group>
          <Button component={Link} to="/bookmarks" variant="outline" color="dark" leftSection={<IconBookmark size={16} />}>
            Закладки
          </Button>
          <Button component={Link} to="/editor/new" color="dark" leftSection={<IconSparkles size={16} />}>
            Создать комикс
          </Button>
        </Group>
      </Group>

      <Grid>
        {myComicsQuery.data?.map((comic) => (
          <Grid.Col span={{ base: 12, md: 6 }} key={comic.id}>
            <Card className="ink-grid" p="lg">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Title order={3} ff="Bebas Neue" size="2rem">
                    {comic.title}
                  </Title>
                  <Badge color={comic.status === "PUBLISHED" ? "dark" : "gray"} variant="filled">
                    {comic.status === "PUBLISHED" ? "Опубликован" : "Черновик"}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" lineClamp={3}>
                  {comic.summary}
                </Text>

                <Group gap="xs">
                  <Badge variant="outline" color="dark">
                    {comic.pagesCount} страниц
                  </Badge>
                  <Badge variant="outline" color="dark">
                    {comic.bookmarksCount} закладок
                  </Badge>
                </Group>

                <Group mt="sm">
                  <Button component={Link} to={`/editor/${comic.slug}`} variant="outline" color="dark" leftSection={<IconPencil size={16} />}>
                    Редактировать
                  </Button>
                  <Button component={Link} to={`/read/${comic.slug}`} variant="subtle" color="dark" leftSection={<IconPlayerPlay size={16} />}>
                    Читать
                  </Button>
                  {comic.status === "DRAFT" && (
                    <Button color="dark" onClick={() => publishMutation.mutate(comic.id)} loading={publishMutation.isPending}>
                      Публиковать
                    </Button>
                  )}
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {myComicsQuery.data?.length === 0 && (
        <Card withBorder p="lg">
          <Text c="dimmed">Пока у вас нет комиксов. Создайте первый черновик и начните строить ветвящийся сюжет.</Text>
        </Card>
      )}
    </Stack>
  );
}
