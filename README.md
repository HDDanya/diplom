# InkFlow Comics

Дипломное веб-приложение для создания и чтения интерактивных комиксов с ветвящимся сюжетом и анимированными переходами между страницами.

## Что реализовано

- Авторизация и регистрация пользователей (JWT access + refresh).
- Роли по факту использования:
  - авторы создают и редактируют комиксы,
  - читатели просматривают и читают опубликованные комиксы.
- Конструктор интерактивного комикса:
  - страницы,
  - стартовая точка,
  - переходы/выборы между страницами,
  - drag-and-drop граф ветвлений,
  - 20 анимированных стилей переходов и режим без анимации.
- Превью создаваемого комикса прямо в редакторе.
- Черновики и публикация.
- Публичный каталог с фильтрами по названию, автору, году, оценкам и количеству страниц.
- Режим чтения в формате комикс-полотна: несколько панелей на странице, подписи и реплики.
- Закладки и сохранение прогресса чтения:
  - видимый статус «В закладках»,
  - отдельная вкладка `/bookmarks` с сохранёнными комиксами.
- Рецензии и оценки от зарегистрированных пользователей.
- Загрузка изображений как файлов (без внешних ссылок):
  - обложка комикса,
  - изображения для отдельных страниц.
- Шаблоны из реальных public-domain страниц и обложек классических комиксов.
- AI-генерация кадра по prompt прямо в редакторе страниц:
  - 1–4 варианта за запрос,
  - настройка визуального стиля,
  - текстовый character consistency guide,
  - понятная диагностика ключа, прав доступа, квоты и таймаута.
- Генерация черновой структуры страниц из сценария (по абзацам).
- Адаптивный интерфейс для desktop, планшетов и смартфонов.
- 12 опубликованных demo-комиксов: по 17 страниц, 24 перехода, 9 ветвящихся узлов и финальная сцена с 4 видимыми вариантами исхода.
- Полноценные фанатские истории `Бэтмен: Четыре минуты до полуночи` и `Пацаны: Архив Vought`.
- Для десяти классических историй используются отдельные наборы public-domain сканов Internet Archive; Batman и The Boys получили тематические CC-изображения Wikimedia Commons.
- Lazy loading страниц, code splitting и отдельные vendor chunks.
- Unit/component тесты на Vitest и e2e тесты на Playwright.
- Rate limiting, CSP/Helmet, проверка сигнатур загружаемых файлов и метрики API.

## Технологии

### Frontend

- React + TypeScript
- React Router
- TanStack Query
- Mantine UI
- Framer Motion
- Axios

### Backend

- Fastify + TypeScript
- Prisma ORM
- PostgreSQL
- JWT + bcryptjs
- @fastify/multipart + @fastify/static (upload + локальная раздача изображений)
- Zod

## Структура

- `client` — SPA (автор/читатель интерфейс)
- `server` — API и бизнес-логика
- `docker-compose.yml` — локальный PostgreSQL

## Быстрый старт

1. Установите зависимости:

```bash
pnpm install
```

2. Поднимите PostgreSQL:

```bash
docker compose up -d
```

3. Создайте `.env` (в корне проекта):

```bash
cp .env.example .env
```

Для AI-генерации кадров укажите ключ:

```env
OPENAI_API_KEY="ваш_ключ"
OPENAI_IMAGE_MODEL="gpt-image-1"
OPENAI_IMAGE_QUALITY="medium"
OPENAI_TIMEOUT_MS=120000
```

4. Примените миграции и сиды:

```bash
pnpm --filter server db:migrate
pnpm --filter server db:seed
```

5. Запустите проект:

```bash
pnpm dev
```

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`

## Публичный деплой

Репозиторий содержит `render.yaml` для развёртывания frontend, API, PostgreSQL и постоянного диска одним Blueprint:

[Deploy to Render](https://dashboard.render.com/blueprint/new?repo=https://github.com/HDDanya/diplom)

При создании Blueprint укажите `OPENAI_API_KEY`. Остальные секреты генерируются автоматически. Production-сервис
работает на одном домене: Fastify отдаёт React SPA, `/api` и `/uploads`.

## Проверка

```bash
pnpm build
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit
```

На момент последней проверки:

- frontend unit/component: 3 теста;
- backend unit/data/security: 8 тестов;
- Playwright desktop/mobile: 10 сценариев;
- `pnpm audit`: известных уязвимостей нет;
- стартовый JS chunk: около 14 КБ вместо прежнего монолитного bundle около 668 КБ.

## Диагностика AI

- `GET /api/health` показывает, найден ли ключ и какая модель настроена.
- `GET /api/uploads/generate/status` доступен авторизованному пользователю.
- `POST /api/uploads/generate` возвращает коды `OPENAI_INVALID_KEY`, `OPENAI_ACCESS_DENIED`, `OPENAI_QUOTA`, `OPENAI_TIMEOUT`, `OPENAI_SAFETY_BLOCKED`.
- При `moderation_blocked` сервер один раз повторяет запрос с нейтральным family-friendly prompt и сообщает `safetyAdjusted`.
- После изменения `.env` сервер нужно перезапустить.

## Демо-аккаунты

После `db:seed` доступны:

- автор: `author@inkflow.app` / `password123`
- читатель: `reader@inkflow.app` / `password123`

## Ключевые API endpoint'ы

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/comics/public`
- `GET /api/comics/mine`
- `GET /api/comics/bookmarks`
- `GET /api/comics/:slug`
- `GET /api/comics/:slug/read`
- `POST /api/comics/:comicId/reviews`
- `POST /api/uploads/image`
- `POST /api/uploads/generate`
- `GET /api/uploads/generate/status`
- `GET /api/health`
- `GET /api/metrics`
- `POST /api/comics`
- `PUT /api/comics/:comicId`
- `POST /api/comics/:comicId/publish`
- `POST /api/comics/:comicId/bookmark`
- `POST /api/comics/:comicId/progress`

## Возможное развитие после MVP

- хранение refresh token только в HttpOnly cookie и серверная ротация сессий;
- совместное редактирование комикса в реальном времени;
- объектное хранилище S3/MinIO вместо локального каталога uploads;
- визуальная проверка связности графа и поиск недостижимых сцен;
- экспорт в PDF/CBZ и PWA-режим офлайн-чтения;
- Prometheus/Grafana и централизованное хранение логов.

Источники изображений перечислены в [ASSET_SOURCES.md](./ASSET_SOURCES.md), а материал для пояснительной записки собран в [DIPLOMA_EXPLANATORY_NOTE.md](./DIPLOMA_EXPLANATORY_NOTE.md).
