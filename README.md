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
  - стили переходов (`SLIDE_LEFT`, `SLIDE_RIGHT`, `FADE`, `ZOOM`, `NONE`).
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
- Шаблоны иллюстраций страниц (визуальные пресеты) и автогенерация `prompt` из сцены.
- AI-генерация кадра по prompt прямо в редакторе страниц.
- Генерация черновой структуры страниц из сценария (по абзацам).
- Ч/б современный интерфейс в стилистике sketch/noir.
- Расширенный seed-сюжет `City Of Ink` (8 сцен и разветвлённый финал).

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
- `POST /api/comics`
- `PUT /api/comics/:comicId`
- `POST /api/comics/:comicId/publish`
- `POST /api/comics/:comicId/bookmark`
- `POST /api/comics/:comicId/progress`

## Что можно доработать дальше

- drag-and-drop граф ветвлений с визуальными узлами;
- улучшение генерации изображений: control style/character consistency, batch variants;
- lazy-loading и code splitting для снижения стартового bundle;
- e2e тесты (Playwright) и метрики наблюдаемости.
