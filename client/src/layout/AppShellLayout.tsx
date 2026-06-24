import { ActionIcon, Avatar, Box, Burger, Button, Container, Divider, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBook, IconBookmark, IconHome, IconLogout, IconPlus, IconUser } from "@tabler/icons-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AppShellLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false);
  const location = useLocation();

  const navigation = (
    <>
      <Button component={NavLink} to="/" variant="subtle" color="dark" leftSection={<IconHome size={16} />} onClick={closeMenu}>
        Каталог
      </Button>
      {isAuthenticated && (
        <>
          <Button component={NavLink} to="/dashboard" variant="subtle" color="dark" leftSection={<IconUser size={16} />} onClick={closeMenu}>
            Кабинет
          </Button>
          <Button component={NavLink} to="/bookmarks" variant="subtle" color="dark" leftSection={<IconBookmark size={16} />} onClick={closeMenu}>
            Закладки
          </Button>
          <Button component={NavLink} to="/editor/new" variant="filled" color="dark" leftSection={<IconPlus size={16} />} onClick={closeMenu}>
            Новый комикс
          </Button>
        </>
      )}
    </>
  );

  return (
    <Stack gap={0} mih="100vh">
      <Box component="header" p="md" className="app-header">
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Box component={Link} to="/" aria-label="InkFlow Comics">
              <Group gap="xs">
                <IconBook size={24} stroke={1.8} />
                <Text className="app-brand" ff="Bebas Neue" size="2rem" lh={1}>
                  InkFlow Comics
                </Text>
              </Group>
            </Box>

            <Group gap="xs" className="desktop-navigation">
              {navigation}
              {isAuthenticated ? (
                <Group gap="xs" ml="sm">
                  <Avatar radius="xl" color="dark" variant="outline" size="sm">
                    {user?.displayName.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Text size="sm" c="dimmed" maw={120} truncate>
                    {user?.displayName}
                  </Text>
                  <ActionIcon variant="subtle" color="dark" aria-label="Выйти" onClick={logout}>
                    <IconLogout size={16} />
                  </ActionIcon>
                </Group>
              ) : (
                <Button component={Link} to="/auth" variant="outline" color="dark">
                  Войти
                </Button>
              )}
            </Group>

            <Burger
              className="mobile-navigation-trigger"
              opened={menuOpened}
              onClick={openMenu}
              aria-label="Открыть меню"
            />
          </Group>
        </Container>
      </Box>

      <Drawer opened={menuOpened} onClose={closeMenu} title="Навигация" position="right" size="min(86vw, 340px)">
        <Stack gap="xs" key={location.pathname}>
          {isAuthenticated && (
            <>
              <Group gap="sm">
                <Avatar radius="xl" color="dark" variant="outline">
                  {user?.displayName.slice(0, 1).toUpperCase()}
                </Avatar>
                <Stack gap={0}>
                  <Text fw={700}>{user?.displayName}</Text>
                  <Text size="xs" c="dimmed">{user?.email}</Text>
                </Stack>
              </Group>
              <Divider my="xs" />
            </>
          )}
          {navigation}
          {!isAuthenticated ? (
            <Button component={Link} to="/auth" variant="outline" color="dark" onClick={closeMenu}>
              Войти
            </Button>
          ) : (
            <Button
              variant="light"
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={() => {
                logout();
                closeMenu();
              }}
            >
              Выйти
            </Button>
          )}
        </Stack>
      </Drawer>

      <Box component="main" py="xl" className="app-main">
        <Container size="lg">
          <Outlet />
        </Container>
      </Box>
    </Stack>
  );
}
