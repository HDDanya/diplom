import { ActionIcon, Avatar, Box, Button, Container, Group, Stack, Text } from "@mantine/core";
import { IconBook, IconBookmark, IconHome, IconLogout, IconPlus, IconUser } from "@tabler/icons-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AppShellLayout() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Stack gap={0} mih="100vh">
      <Box component="header" p="md" style={{ borderBottom: "2px solid #171717", background: "#fff" }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconBook size={24} stroke={1.8} />
              <Text ff="Bebas Neue" size="2rem" lh={1}>
                InkFlow Comics
              </Text>
            </Group>

            <Group gap="xs">
              <Button component={NavLink} to="/" variant="subtle" color="dark" leftSection={<IconHome size={16} />}>
                Каталог
              </Button>
              {isAuthenticated ? (
                <>
                  <Button
                    component={NavLink}
                    to="/dashboard"
                    variant="subtle"
                    color="dark"
                    leftSection={<IconUser size={16} />}
                  >
                    Кабинет
                  </Button>
                  <Button
                    component={NavLink}
                    to="/bookmarks"
                    variant="subtle"
                    color="dark"
                    leftSection={<IconBookmark size={16} />}
                  >
                    Закладки
                  </Button>
                  <Button
                    component={NavLink}
                    to="/editor/new"
                    variant="filled"
                    color="dark"
                    leftSection={<IconPlus size={16} />}
                  >
                    Новый комикс
                  </Button>
                  <Group gap="xs" ml="sm">
                    <Avatar radius="xl" color="dark" variant="outline" size="sm">
                      {user?.displayName.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Text size="sm" c="dimmed">
                      {user?.displayName}
                    </Text>
                    <ActionIcon variant="subtle" color="dark" aria-label="Выйти" onClick={logout}>
                      <IconLogout size={16} />
                    </ActionIcon>
                  </Group>
                </>
              ) : (
                <Button component={Link} to="/auth" variant="outline" color="dark">
                  Войти
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </Box>

      <Box component="main" py="xl" style={{ flex: 1 }}>
        <Container size="lg">
          <Outlet />
        </Container>
      </Box>
    </Stack>
  );
}
