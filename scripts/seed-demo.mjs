const API_BASE_URL = (process.env.VITE_API_BASE_URL ?? "https://api.ustyantsevmd.ru").replace(
  /\/$/,
  "",
);

const now = new Date();
const stamp = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}).format(now);

const stages = [
  { title: "Новая", cards: [] },
  { title: "В работе", cards: [] },
  { title: "На согласовании", cards: [] },
  { title: "Выполнена", cards: [] },
  { title: "Просрочена", cards: [] },
];

const demoBoards = [
  {
    title: `Демо: молодые таланты ${stamp}`,
    description: "Планирование и контроль задач по направлению молодых талантов.",
    cardsByStage: {
      "Новая": [
        ["Согласовать постановку кейса", "Подготовить финальную версию кейса для команды."],
        ["Собрать список вузов", "Подготовить первичный список партнёров для обсуждения."],
      ],
      "В работе": [
        ["Подготовить участие в хакатоне", "Собрать материалы, расписание и список ответственных."],
        ["Развить партнёрство с 5 вузами", "Проверить текущие договорённости и следующие шаги."],
      ],
      "На согласовании": [
        ["Заключить соглашение с МИРЭА", "Документы переданы на внутреннее согласование."],
      ],
      "Выполнена": [
        ["Опубликовать программу встречи", "Программа размещена для участников."],
      ],
      "Просрочена": [
        ["Обновить список наставников", "Нужно повторно запросить подтверждения участия."],
      ],
    },
  },
  {
    title: `Демо: операционная подготовка ${stamp}`,
    description: "Задачи по подготовке рабочих мест и внутренних мероприятий.",
    cardsByStage: {
      "Новая": [
        ["Проверить переговорные", "Сверить доступность комнат перед мероприятием."],
        ["Заказать расходные материалы", "Подготовить список необходимого оборудования."],
      ],
      "В работе": [
        ["Подготовить рабочие места для стажёров", "Проверить оборудование и доступы."],
        ["Обновить инструкцию для офиса", "Собрать короткую памятку для новых участников."],
      ],
      "На согласовании": [
        ["Согласовать план рассадки", "План передан на проверку организаторам."],
      ],
      "Выполнена": [
        ["Проверить проекторы", "Оборудование проверено и готово к работе."],
      ],
      "Просрочена": [
        ["Подготовить таблички навигации", "Макеты готовы, печать задерживается."],
      ],
    },
  },
  {
    title: `Демо: HR и адаптация ${stamp}`,
    description: "Задачи по найму, адаптации и внутренним коммуникациям.",
    cardsByStage: {
      "Новая": [
        ["Подготовить вопросы для интервью", "Собрать единый список вопросов для команды."],
      ],
      "В работе": [
        ["Обновить программу адаптации новичков", "Проверить материалы и расписание первой недели."],
        ["Подготовить отчёт по найму молодых специалистов", "Собрать текущие цифры и основные выводы."],
      ],
      "На согласовании": [
        ["Согласовать welcome-презентацию", "Версия отправлена руководителю команды."],
      ],
      "Выполнена": [
        ["Обновить шаблон письма кандидату", "Новый шаблон добавлен в процесс найма."],
      ],
      "Просрочена": [
        ["Проверить обратную связь по стажировке", "Не хватает ответов от части участников."],
      ],
    },
  },
  {
    title: `Демо: финансы и ИТ ${stamp}`,
    description: "Контроль задач по отчётности, доступам и инфраструктуре.",
    cardsByStage: {
      "Новая": [
        ["Проверить доступы новых сотрудников", "Сверить список учётных записей и рабочих сервисов."],
        ["Запланировать проверку оборудования", "Согласовать окно для технической проверки."],
      ],
      "В работе": [
        ["Подготовить отчёт по затратам подразделения", "Собрать данные по текущему периоду."],
        ["Проверить резервные каналы связи", "Проверить доступность и зафиксировать результат."],
      ],
      "На согласовании": [
        ["Согласовать бюджет мероприятия", "Финальная версия сметы на проверке."],
      ],
      "Выполнена": [
        ["Обновить список сервисных заявок", "Список актуализирован для команды."],
      ],
      "Просрочена": [
        ["Закрыть старые заявки по доступам", "Часть заявок требует повторной проверки."],
      ],
    },
  },
];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} -> ${response.status}: ${text}`);
  }

  return payload;
}

function toStageList(cardsByStage) {
  return stages.map((stage) => ({
    ...stage,
    cards: cardsByStage[stage.title] ?? [],
  }));
}

async function seed() {
  const createdBoards = [];
  let createdColumns = 0;
  let createdCards = 0;

  for (const boardSeed of demoBoards) {
    const board = await request("/boards", {
      method: "POST",
      body: JSON.stringify({
        title: boardSeed.title,
        description: boardSeed.description,
      }),
    });
    createdBoards.push(board);

    const stageList = toStageList(boardSeed.cardsByStage);

    for (const [stageIndex, stage] of stageList.entries()) {
      const column = await request(`/boards/${board.id}/columns`, {
        method: "POST",
        body: JSON.stringify({
          title: stage.title,
          position: stageIndex,
        }),
      });
      createdColumns += 1;

      for (const [cardIndex, [title, description]] of stage.cards.entries()) {
        await request(`/columns/${column.id}/cards`, {
          method: "POST",
          body: JSON.stringify({
            title,
            description,
            position: cardIndex,
          }),
        });
        createdCards += 1;
      }
    }
  }

  console.log("Демо-данные добавлены в реальный API.");
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Досок: ${createdBoards.length}`);
  console.log(`Колонок: ${createdColumns}`);
  console.log(`Карточек: ${createdCards}`);
  console.log("Созданные доски:");
  for (const board of createdBoards) {
    console.log(`- #${board.id}: ${board.title}`);
  }
}

seed().catch((error) => {
  console.error("Не удалось добавить демо-данные.");
  console.error(error);
  process.exit(1);
});
