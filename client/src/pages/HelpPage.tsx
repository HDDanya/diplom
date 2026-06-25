import { Accordion, Badge, Box, Button, Group, Progress, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconEye,
  IconFileText,
  IconGitBranch,
  IconMessageCircle,
  IconPhoto,
  IconRocket,
  IconSparkles,
  IconTransitionTop
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveAssetUrl } from "../lib/assets";

const onboardingSteps = [
  {
    icon: IconFileText,
    title: "Задайте основу",
    short: "Название и замысел",
    description:
      "Создайте черновик, назовите историю и сформулируйте короткое описание. Оно поможет читателю понять жанр и ставку сюжета.",
    tip: "Хорошее описание отвечает на два вопроса: кто герой и что он рискует потерять.",
    details: ["Выберите короткое запоминающееся название", "Опишите героя, конфликт и главную ставку", "Добавьте вертикальную обложку выпуска"],
    visual: "brief"
  },
  {
    icon: IconBook2,
    title: "Разбейте сценарий",
    short: "Сцены и ритм",
    description:
      "Добавьте страницы вручную или вставьте общий сценарий. При автоматической генерации каждый абзац, отделённый пустой строкой, превращается в отдельную страницу.",
    tip: "Оставляйте пустую строку между сценами. Одна сцена — одно главное действие.",
    details: ["Пустая строка разделяет будущие страницы", "Заголовок помогает ориентироваться в графе", "Ключ страницы используется для переходов"],
    visual: "pages"
  },
  {
    icon: IconMessageCircle,
    title: "Разделите диалоги",
    short: "Разметка панелей",
    description:
      "В тексте страницы поставьте разделитель --- на отдельной строке между репликами или фрагментами действия. Каждый блок станет отдельной панелью комикса.",
    tip: "До и после --- должен быть перенос строки. Для каждой получившейся панели можно назначить своё изображение.",
    details: ["Первый блок отображается как первая панель", "Каждый --- создаёт следующую панель", "Пустые блоки редактор автоматически игнорирует"],
    visual: "dialogue"
  },
  {
    icon: IconPhoto,
    title: "Оживите кадры",
    short: "Изображения и AI",
    description:
      "Загрузите готовые изображения или создайте несколько вариантов кадра по текстовому описанию прямо в редакторе.",
    tip: "Повторяйте ключевые детали внешности героя в промптах, чтобы сохранить узнаваемость.",
    details: ["Общее изображение сцены работает как запасной кадр", "Панели после --- могут иметь разные изображения", "Из вариантов генерации можно выбрать лучший"],
    visual: "art"
  },
  {
    icon: IconGitBranch,
    title: "Постройте выборы",
    short: "Ветки сюжета",
    description:
      "Соедините страницы переходами. Подпись на связи станет действием, которое увидит читатель в конце сцены.",
    tip: "Давайте вариантам разный эмоциональный смысл, а не только разные формулировки.",
    details: ["Укажите текст действия для читателя", "Выберите целевую страницу каждой кнопки", "Проверьте связи в визуальном графе"],
    visual: "graph"
  },
  {
    icon: IconTransitionTop,
    title: "Настройте движение",
    short: "Переходы и темп",
    description:
      "Подберите анимацию для каждой страницы: мягкое появление для диалога, резкий сдвиг для погони или вспышку для кульминации.",
    tip: "Анимация усиливает момент, но не должна спорить с содержанием сцены.",
    details: ["Переход применяется при открытии страницы", "Темп должен соответствовать сцене", "Превью позволяет проверить эффект до публикации"],
    visual: "motion"
  },
  {
    icon: IconRocket,
    title: "Проверьте и выпустите",
    short: "Превью и публикация",
    description:
      "Пройдите все маршруты в режиме чтения, убедитесь, что нет тупиков, и опубликуйте выпуск в общем каталоге.",
    tip: "Особенно внимательно проверьте стартовую страницу и все финальные ветки.",
    details: ["Назначьте ровно одну стартовую страницу", "Пройдите каждую развилку как читатель", "Проверьте обложку, панели и финалы"],
    visual: "publish"
  }
];

const faq = [
  {
    question: "Как разделить диалоги на отдельные панели?",
    answer:
      "Поставьте --- на отдельной строке между фрагментами текста. Например: первая реплика, затем новая строка с ---, затем вторая реплика. Редактор создаст две панели, и для каждой можно будет загрузить или сгенерировать отдельную иллюстрацию."
  },
  {
    question: "Чем разделение страниц отличается от разделения панелей?",
    answer:
      "В общем поле сценария пустая строка разделяет сцены и будущие страницы. Внутри текста конкретной страницы строка --- разделяет панели или диалоги этой страницы."
  },
  {
    question: "Нужно ли уметь рисовать, чтобы создать комикс?",
    answer:
      "Нет. Можно загрузить готовые иллюстрации, использовать public-domain материалы или сгенерировать варианты кадров прямо в редакторе. Важнее всего идея, сценарий и последовательность сцен."
  },
  {
    question: "Как сделать несколько концовок?",
    answer:
      "Создайте отдельную страницу для каждого финала, затем добавьте на предшествующей сцене несколько выборов и укажите для каждого нужную целевую страницу."
  },
  {
    question: "Что произойдёт, если ветка никуда не ведёт?",
    answer:
      "Для читателя такая страница станет финальной. Если это не задумано, вернитесь в граф сюжета и добавьте переход на следующую сцену."
  },
  {
    question: "Можно ли редактировать уже опубликованный комикс?",
    answer:
      "Да. Откройте выпуск в кабинете автора, внесите изменения и сохраните его. Ссылка и прогресс читателей останутся привязаны к тому же комиксу."
  },
  {
    question: "Какие изображения поддерживаются?",
    answer:
      "Редактор принимает JPEG, PNG и WebP. Для обложки лучше использовать вертикальный кадр, а для страниц — горизонтальные или квадратные изображения с хорошим запасом по краям."
  },
  {
    question: "Почему AI-генерация может занять время?",
    answer:
      "Создание нескольких изображений — ресурсоёмкая операция. Обычно результат появляется в течение минуты, но время зависит от количества вариантов, качества и доступности модели."
  },
  {
    question: "Как читатель сохраняет прогресс?",
    answer:
      "Авторизованный читатель может добавить комикс в закладки. Последняя открытая сцена сохраняется автоматически и позволяет продолжить историю позже."
  },
  {
    question: "Как понять, что комикс готов к публикации?",
    answer:
      "У него должна быть обложка, стартовая страница, понятные переходы и хотя бы один финал. Перед публикацией пройдите каждый маршрут в режиме превью."
  }
];

export function HelpPage() {
  const { isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const step = onboardingSteps[activeStep];
  const StepIcon = step.icon;

  return (
    <Stack gap={64} className="help-page">
      <Box component="section" className="inner-hero help-hero">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack gap="sm" className="inner-hero-copy">
            <Badge className="comic-kicker">Центр помощи</Badge>
            <Title order={1}>От первой идеи до первого читателя</Title>
            <Text>
              Пройдите интерактивный маршрут создания комикса, а затем загляните в ответы на частые вопросы.
            </Text>
          </Stack>
        </motion.div>
        <motion.div
          className="help-hero-visual"
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 170 }}
        >
          <div className="help-panel help-panel--back">
            <span>СЦЕНА</span>
          </div>
          <div className="help-panel help-panel--front">
            <IconGitBranch size={34} />
            <strong>ВЫБОР</strong>
            <span>меняет всё</span>
          </div>
        </motion.div>
      </Box>

      <Box component="section">
        <Group justify="space-between" align="end" mb="xl" className="help-section-heading">
          <div>
            <Text className="section-index">ОНБОРДИНГ · 7 ШАГОВ</Text>
            <Title order={2}>Соберите свой первый выпуск</Title>
          </div>
          <Text c="dimmed" maw={420}>
            Нажимайте на этапы или двигайтесь кнопками. Визуальная подсказка покажет, что происходит в редакторе.
          </Text>
        </Group>

        <Box className="onboarding-shell">
          <Box className="onboarding-steps" role="tablist" aria-label="Этапы создания комикса">
            {onboardingSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === index}
                  className={activeStep === index ? "onboarding-step is-active" : "onboarding-step"}
                  onClick={() => setActiveStep(index)}
                >
                  <span className="onboarding-step-number">{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={20} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.short}</small>
                  </span>
                </button>
              );
            })}
          </Box>

          <Box className="onboarding-stage">
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={700}>ПРОГРЕСС СОЗДАНИЯ</Text>
              <Text size="sm" c="dimmed">{activeStep + 1} / {onboardingSteps.length}</Text>
            </Group>
            <Progress
              value={((activeStep + 1) / onboardingSteps.length) * 100}
              color="dark"
              size="sm"
              radius={0}
              mb="xl"
            />

            <Box className="onboarding-content">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="onboarding-copy"
                >
                  <Box className="onboarding-icon"><StepIcon size={28} /></Box>
                  <Text className="section-index">ШАГ {String(activeStep + 1).padStart(2, "0")}</Text>
                  <Title order={3}>{step.title}</Title>
                  <Text>{step.description}</Text>
                  <ul className="onboarding-detail-list">
                    {step.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <Box className="onboarding-tip">
                    <IconSparkles size={18} />
                    <Text size="sm"><strong>Совет:</strong> {step.tip}</Text>
                  </Box>
                </motion.div>
              </AnimatePresence>

              <OnboardingVisual visual={step.visual} activeStep={activeStep} />
            </Box>

            <Group justify="space-between" mt="xl">
              <Button
                variant="subtle"
                color="dark"
                leftSection={<IconArrowLeft size={18} />}
                disabled={activeStep === 0}
                onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
              >
                Назад
              </Button>
              {activeStep < onboardingSteps.length - 1 ? (
                <Button
                  color="dark"
                  rightSection={<IconArrowRight size={18} />}
                  onClick={() => setActiveStep((current) => Math.min(onboardingSteps.length - 1, current + 1))}
                >
                  Следующий шаг
                </Button>
              ) : (
                <Button
                  component={Link}
                  to={isAuthenticated ? "/editor/new" : "/auth"}
                  className="comic-button comic-button--yellow"
                  rightSection={<IconRocket size={18} />}
                >
                  Создать комикс
                </Button>
              )}
            </Group>
          </Box>
        </Box>
      </Box>

      <Box component="section" className="markup-guide">
        <Box className="markup-guide-copy">
          <Text className="section-index">ШПАРГАЛКА ПО РАЗМЕТКЕ</Text>
          <Title order={2}>Одна сцена, три панели</Title>
          <Text>
            Разделитель <code>---</code> должен стоять на отдельной строке. Редактор разобьёт текст на панели в
            том же порядке и покажет отдельный блок иллюстрации для каждой из них.
          </Text>
          <Box className="markup-rule">
            <strong>Пустая строка</strong>
            <span>разделяет страницы в общем сценарии</span>
          </Box>
          <Box className="markup-rule">
            <strong>Строка ---</strong>
            <span>разделяет панели внутри одной страницы</span>
          </Box>
        </Box>
        <Box className="markup-example">
          <div className="markup-code">
            <span>Мира включает старый приёмник.</span>
            <b>---</b>
            <span>Голос: «Если ты слышишь это, не открывай дверь».</span>
            <b>---</b>
            <span>В коридоре раздаётся тяжёлый стук.</span>
          </div>
          <div className="markup-arrow" aria-hidden="true">→</div>
          <div className="markup-panels">
            <div><small>ПАНЕЛЬ 1</small><strong>Приёмник</strong></div>
            <div><small>ПАНЕЛЬ 2</small><strong>Голос</strong></div>
            <div><small>ПАНЕЛЬ 3</small><strong>Стук</strong></div>
          </div>
        </Box>
      </Box>

      <Box component="section" className="quick-help-band">
        <Stack gap="xs">
          <Text className="section-index">БЫСТРЫЙ СТАРТ</Text>
          <Title order={2}>Хотите сначала посмотреть готовые истории?</Title>
          <Text>Откройте каталог, пройдите несколько веток и подсмотрите, как авторы используют выборы и переходы.</Text>
        </Stack>
        <Button component={Link} to="/catalog" size="lg" variant="outline" color="dark" rightSection={<IconEye size={18} />}>
          Открыть каталог
        </Button>
      </Box>

      <Box component="section" id="faq">
        <Box className="section-heading" mb="xl">
          <Text className="section-index">ВОПРОСЫ И ОТВЕТЫ</Text>
          <Title order={2}>Часто спрашивают</Title>
          <Text>Коротко о сценариях, изображениях, публикации и чтении.</Text>
        </Box>
        <Accordion className="faq-accordion" variant="separated" radius={0}>
          {faq.map((item, index) => (
            <Accordion.Item key={item.question} value={`faq-${index}`}>
              <Accordion.Control>
                <Group gap="md" wrap="nowrap">
                  <span className="faq-number">{String(index + 1).padStart(2, "0")}</span>
                  <Text fw={700}>{item.question}</Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Text c="dimmed" maw={820}>{item.answer}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Box>
    </Stack>
  );
}

function OnboardingVisual({ visual, activeStep }: { visual: string; activeStep: number }) {
  return (
    <Box className="onboarding-visual" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={visual}
          className={`onboarding-mock onboarding-mock--${visual}`}
          initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mock-toolbar">
            <span />
            <span />
            <span />
            <b>INKFLOW EDITOR</b>
          </div>
          {visual === "brief" && (
            <div className="mock-form">
              <label>НАЗВАНИЕ</label>
              <strong>Сигнал из полуночи</strong>
              <label>КРАТКОЕ ОПИСАНИЕ</label>
              <p>Радиоведущая ловит послание из города, которого нет на карте.</p>
            </div>
          )}
          {visual === "pages" && (
            <div className="mock-pages">
              {[1, 2, 3].map((page) => (
                <motion.div key={page} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: page * 0.08 }}>
                  <span>0{page}</span><b>{page === 1 ? "Сигнал" : page === 2 ? "Архив" : "Погоня"}</b>
                </motion.div>
              ))}
            </div>
          )}
          {visual === "dialogue" && (
            <div className="mock-dialogue">
              <div className="mock-dialogue-editor">
                <span>Мира включает приёмник.</span>
                <b>---</b>
                <span>Голос: «Не открывай дверь».</span>
                <b>---</b>
                <span>В коридоре слышен стук.</span>
              </div>
              <div className="mock-dialogue-result">
                {["Панель 1", "Панель 2", "Панель 3"].map((label, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <small>{label}</small>
                    <strong>{index === 0 ? "Действие" : index === 1 ? "Реплика" : "Реакция"}</strong>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {visual === "art" && (
            <div className="mock-art-grid">
              {["page-01.svg", "page-02.svg", "page-03.svg"].map((image, index) => (
                <motion.img
                  key={image}
                  src={resolveAssetUrl(`/uploads/seed/${image}`) ?? ""}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  alt=""
                />
              ))}
            </div>
          )}
          {visual === "graph" && (
            <div className="mock-graph">
              <div className="mock-node mock-node--one">СТАРТ</div>
              <div className="mock-node mock-node--two">АРХИВ</div>
              <div className="mock-node mock-node--three">КРЫША</div>
              <svg viewBox="0 0 400 220">
                <path d="M200 70 C160 105, 110 110, 95 160" />
                <path d="M200 70 C240 105, 300 110, 310 160" />
              </svg>
            </div>
          )}
          {visual === "motion" && (
            <div className="mock-motion">
              <motion.div
                animate={{ x: [0, 22, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={resolveAssetUrl("/uploads/seed/page-04.svg") ?? ""} alt="" />
              </motion.div>
              <span>SLIDE LEFT</span>
            </div>
          )}
          {visual === "publish" && (
            <div className="mock-publish">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
                <IconRocket size={44} />
              </motion.div>
              <strong>ГОТОВО К ПУБЛИКАЦИИ</strong>
              <span>6 страниц · 4 выбора · 2 финала</span>
            </div>
          )}
          <div className="mock-step-stamp">0{activeStep + 1}</div>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
