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
