import { ActionIcon, Avatar, Box, Burger, Button, Container, Divider, Drawer, Group, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBook,
  IconBookmark,
  IconHelp,
  IconHome,
  IconLogout,
  IconMail,
  IconPlus,
  IconSparkles,
  IconUser
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AppShellLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false);
  const location = useLocation();

  const navigation = (
    <>
      <Button component={NavLink} to="/" end variant="subtle" color="dark" leftSection={<IconHome size={16} />} onClick={closeMenu}>
        Главная
      </Button>
      <Button component={NavLink} to="/catalog" variant="subtle" color="dark" leftSection={<IconBook size={16} />} onClick={closeMenu}>
        Каталог
      </Button>
      <Button component={NavLink} to="/help" variant="subtle" color="dark" leftSection={<IconHelp size={16} />} onClick={closeMenu}>
        Помощь
      </Button>
      <Button component={NavLink} to="/contacts" variant="subtle" color="dark" leftSection={<IconMail size={16} />} onClick={closeMenu}>
        Контакты
      </Button>
      {isAuthenticated && (
        <>
          <Button component={NavLink} to="/dashboard" variant="subtle" color="dark" leftSection={<IconUser size={16} />} onClick={closeMenu}>
            Кабинет
          </Button>
          <Button component={NavLink} to="/bookmarks" variant="subtle" color="dark" leftSection={<IconBookmark size={16} />} onClick={closeMenu}>
            Закладки
          </Button>
          <Button className="header-create-button" component={NavLink} to="/editor/new" variant="filled" color="dark" leftSection={<IconPlus size={16} />} onClick={closeMenu}>
            Новый комикс
          </Button>
        </>
      )}
    </>
  );

  return (
    <Stack gap={0} mih="100vh">
      <Box component="header" className="app-header">
        <Container size="xl" className="app-header-inner">
          <Group justify="space-between" align="center">
            <Box component={Link} to="/" aria-label="InkFlow Comics" className="brand-lockup">
              <Box className="brand-mark">
                <IconSparkles size={19} stroke={2.2} />
              </Box>
              <Group gap={8}>
                <Text className="app-brand" ff="Bebas Neue" size="2rem" lh={0.9}>
                  InkFlow
                </Text>
                <Text className="brand-edition">COMICS</Text>
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

      <Box component="main" className="app-main">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {location.pathname === "/" ? (
            <Outlet />
          ) : (
            <Container size="lg" py={{ base: 32, sm: 48 }}>
              <Outlet />
            </Container>
          )}
        </motion.div>
      </Box>

      <Box component="footer" className="site-footer">
        <Container size="xl">
          <Box className="footer-grid">
            <Stack gap={8}>
              <Group gap="xs">
                <Box className="brand-mark brand-mark--inverse">
                  <IconSparkles size={18} />
                </Box>
                <Text ff="Bebas Neue" size="1.8rem">InkFlow Comics</Text>
              </Group>
              <Text size="sm" c="gray.4" maw={380}>
                Истории, в которых читатель не наблюдает за сюжетом, а направляет его.
              </Text>
            </Stack>
            <Group gap="xl" align="start" className="footer-links">
              <Stack gap={6}>
                <Text className="footer-label">Исследовать</Text>
                <Text component={Link} to="/catalog" size="sm">Каталог</Text>
                <Text component={Link} to="/help" size="sm">Как создать комикс</Text>
              </Stack>
              <Stack gap={6}>
                <Text className="footer-label">InkFlow</Text>
                <Text component={Link} to="/contacts" size="sm">Контакты</Text>
                <Text component={Link} to="/auth" size="sm">Войти</Text>
              </Stack>
            </Group>
          </Box>
          <Divider color="dark.5" my="lg" />
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="gray.5">© 2026 InkFlow Comics</Text>
            <Text size="xs" c="gray.5">Дипломный проект · Москва</Text>
          </Group>
        </Container>
      </Box>
    </Stack>
  );
}
