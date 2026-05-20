# Syveren Frontend MVP

Это frontend MVP проекта Syveren.

## Стек

- React
- Vite
- TypeScript
- Tailwind CSS

## Локальный запуск

```powershell
cd frontend
npm install
npm run dev
```

## Production build

```powershell
cd frontend
npm run build
```

## Запуск через Docker Compose

Docker Compose используется для серверного или демо-запуска. Контейнер не
запускает Vite dev server: он собирает frontend через `npm run build` и
раздаёт готовую папку `dist/` через Nginx.

```powershell
cd frontend
docker compose up --build
```

После запуска frontend доступен по адресу:

```text
http://localhost:8080
```

Остановка:

```powershell
docker compose down
```

`npm run dev` используется только для локальной разработки. `docker compose up`
используется для воспроизводимого серверного или демо-запуска production build.
Frontend обращается к реальному API `https://api.ustyantsevmd.ru`. Backend не
входит в этот compose, backend compose не изменяется, моки не используются.

## API

По умолчанию используется:

```text
https://api.ustyantsevmd.ru
```

При необходимости можно создать `.env` и указать:

```text
VITE_API_BASE_URL=https://api.ustyantsevmd.ru
```

## Что реализовано

- Дашборд
- Задачи
- Канбан
- Создание досок, колонок и карточек
- Редактирование, удаление и перемещение карточек
- Работа только с реальным API
- Без моков

## Demo seed

Опциональная ручная команда:

```powershell
npm run seed:demo
```

Она пишет демо-данные в реальный API `https://api.ustyantsevmd.ru`.
Команда не запускается автоматически при `npm install`, `npm run dev` или `npm run build`.

## Ограничения

- Отделы, дедлайны, приоритеты, ответственные и AI-аналитика не реализованы как реальные данные, потому что отсутствуют в текущей OpenAPI-спецификации.
- Для таких блоков показывается состояние недоступности.
