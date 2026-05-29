import {
  Anchor,
  Button,
  Center,
  Container,
  Group,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }

      notifications.show({
        title: "Успешно",
        message: mode === "login" ? "Вы вошли в систему" : "Аккаунт создан",
        color: "dark"
      });
      navigate("/dashboard");
    } catch (error: any) {
      notifications.show({
        title: "Ошибка",
        message: error.response?.data?.message ?? "Проверьте введённые данные",
        color: "red"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Center mih="100vh">
      <Container size={460} w="100%">
        <Paper className="ink-grid" p="xl" radius="md">
          <Stack gap="md">
            <Title order={1} ff="Bebas Neue" size="2.6rem">
              InkFlow Account
            </Title>
            <Text c="dimmed" size="sm">
              Войдите как автор или читатель, чтобы сохранять прогресс и управлять сюжетными ветками.
            </Text>

            <SegmentedControl
              value={mode}
              onChange={(value) => setMode(value as "login" | "register")}
              data={[
                { label: "Вход", value: "login" },
                { label: "Регистрация", value: "register" }
              ]}
            />

            <form onSubmit={onSubmit}>
              <Stack>
                {mode === "register" && (
                  <TextInput
                    required
                    label="Имя"
                    placeholder="Noir Writer"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.currentTarget.value)}
                  />
                )}
                <TextInput
                  required
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                <PasswordInput
                  required
                  label="Пароль"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
                <Button type="submit" loading={isSubmitting} color="dark" fullWidth>
                  {mode === "login" ? "Войти" : "Создать аккаунт"}
                </Button>
              </Stack>
            </form>

            <Group justify="center" gap={4}>
              <Text size="sm" c="dimmed">
                Демо-логин:
              </Text>
              <Anchor size="sm" c="dark.9" onClick={() => setEmail("author@inkflow.app")}>
                author@inkflow.app
              </Anchor>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
