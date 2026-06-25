import { Badge, Box, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconBook2,
  IconGitBranch,
  IconPlayerPlay,
  IconSparkles,
  IconWand
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";

const showcaseCovers = [
  { src: "/uploads/seed/public-domain/planet-03.jpg", title: "Планета №3", tone: "cyan" },
  { src: "/uploads/seed/public-domain/blue-beetle-01.jpg", title: "Синий Жук", tone: "yellow" },
  { src: "/uploads/seed/public-domain/planet-11.jpg", title: "Планета №11", tone: "coral" },
  { src: "/uploads/seed/vintage-detective-cover.svg", title: "Ночной архив", tone: "white" }
];

const features = [
  {
    icon: IconGitBranch,
    number: "01",
    title: "Сюжетные развилки",
    text: "Связывайте сцены в визуальном графе и создавайте несколько маршрутов к финалу.",
    color: "var(--ink-cyan)"
  },
  {
    icon: IconWand,
    number: "02",
    title: "AI-кадры",
    text: "Генерируйте варианты сцен по описанию и сохраняйте визуальную целостность персонажей.",
    color: "var(--ink-yellow)"
  },
  {
    icon: IconPlayerPlay,
    number: "03",
    title: "Живое чтение",
    text: "Добавляйте переходы, ритм и движение, чтобы каждая страница ощущалась как эпизод.",
    color: "var(--ink-coral)"
  }
];

const branchContent = {
  signal: {
    label: "Пойти на сигнал",
    title: "Крыши старого города",
    text: "Герой находит передатчик и выходит на след подпольной радиостанции.",
    color: "var(--ink-cyan)"
  },
  archive: {
    label: "Открыть архив",
    title: "Дело №47",
    text: "В пыльной папке скрыта связь между исчезновением и главным союзником героя.",
    color: "var(--ink-yellow)"
  }
};

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: "easeOut" as const }
};

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<keyof typeof branchContent>("signal");
  const branch = branchContent[selectedBranch];

  return (
    <Box className="landing-page">
      <Box component="section" className="landing-hero">
        <img
          className="landing-hero-art"
          src={resolveAssetUrl("/uploads/seed/public-domain/planet-01-hires.jpg") ?? ""}
          alt=""
        />
        <Box className="landing-hero-shade" />
        <Container size="xl" className="landing-hero-inner">
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <Stack gap="md" className="landing-hero-copy">
              <Badge className="comic-kicker" variant="filled">
                Платформа интерактивных комиксов
              </Badge>
              <Title order={1} className="landing-title">
                InkFlow
                <span>Comics</span>
              </Title>
              <Text className="landing-lead">
                Создавайте истории, где каждый выбор открывает новую страницу, а читатель становится соавтором
                приключения.
              </Text>
              <Group gap="sm" mt="xs">
                <Button
                  component={Link}
                  to={isAuthenticated ? "/editor/new" : "/auth"}
                  size="lg"
                  className="comic-button comic-button--yellow"
                  rightSection={<IconArrowRight size={19} />}
                >
                  Создать историю
                </Button>
                <Button
                  component={Link}
                  to="/catalog"
                  size="lg"
                  variant="outline"
                  className="comic-button comic-button--ghost"
                  leftSection={<IconBook2 size={19} />}
                >
                  Читать комиксы
                </Button>
              </Group>
            </Stack>
          </motion.div>

          <motion.div
            className="hero-sound-effect"
            initial={{ opacity: 0, scale: 0.4, rotate: -16 }}
            animate={{ opacity: 1, scale: 1, rotate: -7 }}
            transition={{ delay: 0.42, type: "spring", stiffness: 180 }}
            aria-hidden="true"
          >
            ВЫБОР!
          </motion.div>
        </Container>
        <Box className="hero-scroll-cue">
          <span />
          Листайте дальше
        </Box>
      </Box>

      <Box component="section" className="platform-strip">
        <Container size="xl">
          <Box className="platform-stats">
            <div><strong>12+</strong><span>историй в каталоге</span></div>
            <div><strong>20</strong><span>стилей переходов</span></div>
            <div><strong>∞</strong><span>вариантов сюжета</span></div>
            <div><strong>1</strong><span>визуальный редактор</span></div>
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section landing-section--paper">
        <Container size="xl">
          <motion.div {...reveal}>
            <Box className="section-heading">
              <Text className="section-index">ГЛАВА 01</Text>
              <Title order={2}>Не просто листайте. Решайте.</Title>
              <Text>
                InkFlow объединяет сценарий, визуальный редактор и интерактивное чтение в одном пространстве.
              </Text>
            </Box>
          </motion.div>

          <Box className="feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  className="feature-panel"
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  whileHover={{ y: -6, rotate: index === 1 ? 0.8 : -0.6 }}
                  style={{ "--panel-accent": feature.color } as React.CSSProperties}
                >
                  <Group justify="space-between">
                    <Box className="feature-icon"><Icon size={26} /></Box>
                    <Text className="feature-number">{feature.number}</Text>
                  </Group>
                  <Title order={3}>{feature.title}</Title>
                  <Text>{feature.text}</Text>
                </motion.article>
              );
            })}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section landing-section--dark">
        <Container size="xl">
          <Box className="branch-demo-layout">
            <motion.div {...reveal}>
              <Stack gap="md">
                <Text className="section-index section-index--light">ГЛАВА 02</Text>
                <Title order={2}>Один момент. Два продолжения.</Title>
                <Text c="gray.4" maw={520}>
                  Попробуйте механику читателя: выберите действие и посмотрите, как история перестраивается прямо
                  перед вами.
                </Text>
                <Group gap="sm" className="branch-choice-buttons">
                  {(Object.keys(branchContent) as Array<keyof typeof branchContent>).map((key) => (
                    <Button
                      key={key}
                      variant={selectedBranch === key ? "filled" : "outline"}
                      className={selectedBranch === key ? "branch-choice is-active" : "branch-choice"}
                      onClick={() => setSelectedBranch(key)}
                    >
                      {branchContent[key].label}
                    </Button>
                  ))}
                </Group>
              </Stack>
            </motion.div>

            <Box className="branch-map" aria-live="polite">
              <div className="branch-node branch-node--start">
                <span>Сцена 04</span>
                <strong>Таинственный шум</strong>
              </div>
              <div className="branch-line branch-line--left" />
              <div className="branch-line branch-line--right" />
              <motion.div
                key={selectedBranch}
                className="branch-node branch-node--result"
                initial={{ opacity: 0, scale: 0.82, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                style={{ "--branch-color": branch.color } as React.CSSProperties}
              >
                <span>Новая ветка</span>
                <strong>{branch.title}</strong>
                <p>{branch.text}</p>
              </motion.div>
              <div className="branch-node branch-node--muted">
                <span>Альтернатива</span>
                <strong>{selectedBranch === "signal" ? "Дело №47" : "Крыши старого города"}</strong>
              </div>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-section showcase-section">
        <Container size="xl">
          <motion.div {...reveal}>
            <Box className="section-heading section-heading--row">
              <div>
                <Text className="section-index">ГЛАВА 03</Text>
                <Title order={2}>Истории уже ждут</Title>
              </div>
              <Button component={Link} to="/catalog" variant="subtle" color="dark" rightSection={<IconArrowRight size={18} />}>
                Весь каталог
              </Button>
            </Box>
          </motion.div>

          <Box className="cover-showcase">
            {showcaseCovers.map((cover, index) => (
              <motion.div
                className={`showcase-cover showcase-cover--${cover.tone}`}
                key={cover.title}
                initial={{ opacity: 0, rotate: index % 2 ? 3 : -3, y: 30 }}
                whileInView={{ opacity: 1, rotate: index % 2 ? 1.2 : -1.2, y: 0 }}
                whileHover={{ rotate: 0, y: -10 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <img src={resolveAssetUrl(cover.src) ?? ""} alt={cover.title} loading="lazy" />
                <span>{cover.title}</span>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      <Box component="section" className="landing-cta">
        <Container size="lg">
          <motion.div {...reveal} className="landing-cta-inner">
            <IconSparkles size={34} />
            <Text className="section-index">ВАША ОЧЕРЕДЬ</Text>
            <Title order={2}>Какой путь выберет ваш читатель?</Title>
            <Text>Начните с идеи. InkFlow поможет превратить её в живой интерактивный выпуск.</Text>
            <Button
              component={Link}
              to={isAuthenticated ? "/editor/new" : "/auth"}
              size="lg"
              className="comic-button comic-button--dark"
              rightSection={<IconArrowRight size={19} />}
            >
              Начать новый комикс
            </Button>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
