import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <Center h="70vh">
      <Stack align="center">
        <Title ff="Bebas Neue" size="4rem">
          404
        </Title>
        <Text c="dimmed">Страница не найдена</Text>
        <Button component={Link} to="/" color="dark">
          Вернуться в каталог
        </Button>
      </Stack>
    </Center>
  );
}
