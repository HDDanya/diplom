import { Center, Loader, Stack, Text } from "@mantine/core";

export function LoadingScreen({ label = "Загрузка..." }: { label?: string }) {
  return (
    <Center h="60vh">
      <Stack align="center" gap="xs">
        <Loader color="dark" />
        <Text c="dimmed">{label}</Text>
      </Stack>
    </Center>
  );
}
