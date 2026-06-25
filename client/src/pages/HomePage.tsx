import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowRight, IconBookmarkFilled, IconBookmarkPlus, IconSearch, IconStarFilled } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicComicFilters, fetchPublicComics, toggleBookmark } from "../features/comics/api";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebouncedState("", 300);
  const [filters, setFilters] = useState<Omit<PublicComicFilters, "search">>({
    sort: "updated"
  });

  const queryFilters: PublicComicFilters = {
    search,
    ...filters
  };

  const comicsQuery = useQuery({
    queryKey: ["public-comics", queryFilters],
    queryFn: () => fetchPublicComics(queryFilters)
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
    <Stack gap="xl" className="catalog-page">
      <Box className="catalog-hero">
        <Stack gap={8}>
          <Badge className="comic-kicker" w="fit-content">Библиотека InkFlow</Badge>
          <Title order={1}>
            Каталог историй
          </Title>
          <Text c="dimmed" maw={720}>
            Выберите вселенную, войдите в первую сцену и решите, куда повернёт сюжет. Здесь собраны истории с
            развилками, альтернативными финалами и живыми переходами.
          </Text>
        </Stack>
        <Box className="catalog-hero-stamp" aria-hidden="true">ЧИТАЙ!</Box>
      </Box>

      <Stack gap="md">
        <Title order={2} size="2rem">
          Найдите следующий выпуск
        </Title>
        <TextInput
          className="catalog-search"
          size="md"
          placeholder="Найти комикс по названию или описанию"
          leftSection={<IconSearch size={18} />}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
      </Stack>

      <Card withBorder radius="md" p="md" className="catalog-filter-card">
        <Box className="catalog-filter-grid">
          <Box className="catalog-filter-author">
            <TextInput
              label="Автор"
              placeholder="Имя автора"
              value={filters.author ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, author: event.currentTarget.value }))}
            />
          </Box>
          <Box>
            <NumberInput
              label="Год"
              placeholder="2026"
              min={1900}
              max={2100}
              value={filters.year ? Number(filters.year) : ""}
              onChange={(value) => setFilters((current) => ({ ...current, year: value ? String(value) : "" }))}
            />
          </Box>
          <Box>
            <Select
              label="Оценка"
              placeholder="Любая"
              clearable
              value={filters.minRating ?? null}
              onChange={(value) => setFilters((current) => ({ ...current, minRating: value ?? "" }))}
              data={[
                { label: "от 5", value: "5" },
                { label: "от 4", value: "4" },
                { label: "от 3", value: "3" },
                { label: "от 2", value: "2" }
              ]}
            />
          </Box>
          <Box>
            <NumberInput
              label="Страниц от"
              min={1}
              value={filters.minPages ? Number(filters.minPages) : ""}
              onChange={(value) => setFilters((current) => ({ ...current, minPages: value ? String(value) : "" }))}
            />
          </Box>
          <Box>
            <NumberInput
              label="Страниц до"
              min={1}
              value={filters.maxPages ? Number(filters.maxPages) : ""}
              onChange={(value) => setFilters((current) => ({ ...current, maxPages: value ? String(value) : "" }))}
            />
          </Box>
          <Box>
            <Select
              label="Сортировка"
              value={filters.sort ?? "updated"}
              onChange={(value) => setFilters((current) => ({ ...current, sort: (value as PublicComicFilters["sort"]) ?? "updated" }))}
              data={[
                { label: "Новые", value: "updated" },
                { label: "Оценка", value: "rating" },
                { label: "Закладки", value: "bookmarks" },
                { label: "А-Я", value: "title" }
              ]}
            />
          </Box>
        </Box>
      </Card>

      <Grid gutter={{ base: 24, md: 30 }}>
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
                    <Group gap="xs">
                      <Badge color="yellow" variant="light" leftSection={<IconStarFilled size={12} />}>
                        {comic.averageRating ? comic.averageRating.toFixed(1) : "нет оценок"}
                      </Badge>
                      <Badge color="gray" variant="light">
                        {comic.reviewsCount ?? 0} рец.
                      </Badge>
                      <Badge color="gray" variant="light">
                        {comic.bookmarksCount} закл.
                      </Badge>
                    </Group>
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
