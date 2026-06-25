import { Badge, Box, Button, Group, Select, Stack, Text, TextInput, Textarea, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconClock,
  IconMail,
  IconMapPin,
  IconMessageCircle,
  IconSend,
  IconSparkles
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";

const contacts = [
  {
    icon: IconMail,
    label: "Общие вопросы",
    value: "hello@inkflow.demo",
    note: "О платформе и возможностях"
  },
  {
    icon: IconMessageCircle,
    label: "Поддержка авторов",
    value: "creators@inkflow.demo",
    note: "Редактор, публикация и AI"
  },
  {
    icon: IconMapPin,
    label: "Студия",
    value: "Москва, ул. Бумажная, 17",
    note: "Только по предварительной записи"
  },
  {
    icon: IconClock,
    label: "На связи",
    value: "Пн–Пт, 10:00–19:00",
    note: "Ответим в течение рабочего дня"
  }
];

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string | null>("general");
  const [message, setMessage] = useState("");

  const submitContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    notifications.show({
      title: "Сообщение отправлено",
      message: "Это демонстрационная форма — мы показали, как будет выглядеть успешная отправка.",
      color: "dark"
    });
    setName("");
    setEmail("");
    setTopic("general");
    setMessage("");
  };

  return (
    <Stack gap={64} className="contact-page">
      <Box component="section" className="inner-hero contact-hero">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack gap="sm" className="inner-hero-copy">
            <Badge className="comic-kicker">Контакты · демо-данные</Badge>
            <Title order={1}>Есть идея, вопрос или сюжетный тупик?</Title>
            <Text>
              Расскажите нам. Команда InkFlow поможет разобраться с редактором, публикацией и развитием истории.
            </Text>
          </Stack>
        </motion.div>
        <motion.div
          className="contact-bubble"
          initial={{ opacity: 0, scale: 0.5, rotate: 8 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 170 }}
        >
          <IconSparkles size={24} />
          <strong>ПИШИТЕ!</strong>
          <span>Мы читаем каждое сообщение</span>
        </motion.div>
      </Box>

      <Box component="section">
        <Box className="contact-cards">
          {contacts.map((contact, index) => {
            const Icon = contact.icon;
            return (
              <motion.article
                key={contact.label}
                className="contact-card"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                whileHover={{ y: -5 }}
              >
                <Box className="contact-card-icon"><Icon size={24} /></Box>
                <Text className="section-index">{contact.label}</Text>
                <Title order={3}>{contact.value}</Title>
                <Text c="dimmed" size="sm">{contact.note}</Text>
              </motion.article>
            );
          })}
        </Box>
      </Box>

      <Box component="section" className="contact-workspace">
        <Box className="contact-form-copy">
          <Text className="section-index">ПРЯМАЯ ЛИНИЯ</Text>
          <Title order={2}>Напишите команде</Title>
          <Text>
            Опишите задачу как можно конкретнее. Если проблема связана с комиксом, укажите его название и этап,
            на котором она возникла.
          </Text>
          <div className="contact-response-note">
            <IconClock size={20} />
            <div>
              <strong>Среднее время ответа</strong>
              <span>до 4 часов в рабочее время</span>
            </div>
          </div>
        </Box>

        <Box component="form" onSubmit={submitContact} className="contact-form">
          <div className="contact-form-topline">
            <span>ФОРМА СВЯЗИ</span>
            <b>№ 0017</b>
          </div>
          <Box className="contact-form-grid">
            <TextInput
              required
              label="Ваше имя"
              placeholder="Алексей"
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <TextInput
              required
              type="email"
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </Box>
          <Select
            label="Тема обращения"
            value={topic}
            onChange={setTopic}
            data={[
              { value: "general", label: "Общий вопрос" },
              { value: "editor", label: "Работа редактора" },
              { value: "publication", label: "Публикация комикса" },
              { value: "generation", label: "AI-генерация кадров" },
              { value: "partnership", label: "Сотрудничество" }
            ]}
          />
          <Textarea
            required
            minRows={6}
            label="Сообщение"
            placeholder="Расскажите, что случилось или какую идею вы хотите обсудить..."
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
          />
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed" maw={330}>
              Данные никуда не отправляются: форма работает в демонстрационном режиме.
            </Text>
            <Button
              type="submit"
              color="dark"
              size="md"
              rightSection={<IconSend size={18} />}
              disabled={message.trim().length < 10}
            >
              Отправить
            </Button>
          </Group>
        </Box>
      </Box>
    </Stack>
  );
}
