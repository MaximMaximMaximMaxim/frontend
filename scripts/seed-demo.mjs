const API_BASE_URL = (process.env.VITE_API_BASE_URL ?? "https://api.ustyantsevmd.ru").replace(
  /\/$/,
  "",
);

const projectSeed = {
  name: "Транстелематика — хакатон MVP",
  description: "Демо-проект для проверки системы управления задачами и командной аналитики.",
};

const boardSeed = {
  name: "План работ команды",
  is_default: false,
};

const columnSeeds = [
  { name: "Новая", column_type: "backlog", position: 1 },
  { name: "Запланирована", column_type: "custom", position: 2 },
  { name: "В работе", column_type: "in_progress", position: 3 },
  { name: "На согласовании", column_type: "review", position: 4 },
  { name: "Просрочена", column_type: "custom", position: 5 },
  { name: "Выполнена", column_type: "done", position: 6 },
];

const taskSeeds = [
  {
    column: "В работе",
    title: "Развить партнёрство с 5 вузами",
    description: ["Период: Год", "Отдел: Молодые таланты", "Ответственный: Иван"],
    priority: "high",
    estimate: 40,
    due_date: "2026-12-31",
  },
  {
    column: "На согласовании",
    title: "Заключить соглашение с МИРЭА",
    description: ["Период: Квартал", "Отдел: Молодые таланты", "Ответственный: Иван"],
    priority: "high",
    estimate: 24,
    due_date: "2026-07-15",
  },
  {
    column: "В работе",
    title: "Подготовить участие в хакатоне",
    description: ["Период: Месяц", "Отдел: Молодые таланты", "Ответственный: Иван"],
    priority: "high",
    estimate: 32,
    due_date: "2026-06-10",
  },
  {
    column: "Новая",
    title: "Согласовать постановку кейса",
    description: ["Период: Неделя", "Отдел: Молодые таланты", "Ответственный: Иван"],
    priority: "high",
    estimate: 8,
    due_date: "2026-05-28",
  },
  {
    column: "Запланирована",
    title: "Подготовить рабочие места для стажёров",
    description: ["Период: Месяц", "Отдел: АХО", "Ответственный: Мария"],
    priority: "medium",
    estimate: 16,
    due_date: "2026-06-20",
  },
  {
    column: "В работе",
    title: "Проверить переговорные перед мероприятием",
    description: ["Период: Неделя", "Отдел: АХО", "Ответственный: Алексей"],
    priority: "medium",
    estimate: 6,
    due_date: "2026-05-25",
  },
  {
    column: "Запланирована",
    title: "Обновить программу адаптации новичков",
    description: ["Период: Квартал", "Отдел: HR", "Ответственный: Ольга"],
    priority: "medium",
    estimate: 20,
    due_date: "2026-07-01",
  },
  {
    column: "В работе",
    title: "Подготовить отчёт по найму молодых специалистов",
    description: ["Период: Месяц", "Отдел: HR", "Ответственный: Анна"],
    priority: "medium",
    estimate: 12,
    due_date: "2026-06-05",
  },
  {
    column: "В работе",
    title: "Проверить доступы новых сотрудников",
    description: ["Период: Неделя", "Отдел: ИТ", "Ответственный: Дмитрий"],
    priority: "medium",
    estimate: 8,
    due_date: "2026-05-27",
  },
  {
    column: "Просрочена",
    title: "Подготовить отчёт по затратам подразделения",
    description: ["Период: Месяц", "Отдел: Финансы", "Ответственный: Елена"],
    priority: "high",
    estimate: 16,
    due_date: "2026-05-01",
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
    const method = options.method ?? "GET";
    const detail =
      payload && typeof payload === "object" ? JSON.stringify(payload, null, 2) : text;
    throw new Error(`${method} ${path} -> ${response.status}\n${detail}`);
  }

  return payload;
}

function jsonBody(payload) {
  return JSON.stringify(payload);
}

function toApiDateTime(date) {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

function makeTaskPayload(taskSeed, projectId, columnId) {
  const payload = {
    project_id: projectId,
    column_id: columnId,
    title: taskSeed.title,
    description: taskSeed.description.join("\n"),
    priority: taskSeed.priority,
    estimate: taskSeed.estimate,
    due_date: toApiDateTime(taskSeed.due_date),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value != null),
  );
}

async function createProject() {
  return request("/projects/", {
    method: "POST",
    body: jsonBody(projectSeed),
  });
}

async function createBoard(projectId) {
  return request("/boards/", {
    method: "POST",
    body: jsonBody({
      project_id: projectId,
      name: boardSeed.name,
      is_default: boardSeed.is_default,
    }),
  });
}

async function createColumns(boardId) {
  const columns = [];

  for (const columnSeed of columnSeeds) {
    const column = await request(`/boards/${boardId}/columns`, {
      method: "POST",
      body: jsonBody(columnSeed),
    });
    columns.push(column);
  }

  return columns;
}

async function createTasks(projectId, columns) {
  const columnsByName = new Map(columns.map((column) => [column.name, column]));
  const tasks = [];

  for (const taskSeed of taskSeeds) {
    const column = columnsByName.get(taskSeed.column);

    if (!column) {
      throw new Error(`Не найдена колонка для задачи "${taskSeed.title}": ${taskSeed.column}`);
    }

    const task = await request("/tasks/", {
      method: "POST",
      body: jsonBody(makeTaskPayload(taskSeed, projectId, column.id)),
    });
    tasks.push(task);
  }

  return tasks;
}

async function seed() {
  console.log("Создаю демо-данные в реальном API.");
  console.log(`API: ${API_BASE_URL}`);

  const project = await createProject();
  const board = await createBoard(project.id);
  const columns = await createColumns(board.id);
  const tasks = await createTasks(project.id, columns);

  console.log("Демо-данные созданы.");
  console.log(`Project: #${project.id} ${project.name}`);
  console.log(`Board: #${board.id} ${board.name}`);
  console.log(`Columns: ${columns.length}`);
  console.log(`Tasks: ${tasks.length}`);
  console.log("Columns:");
  for (const column of columns) {
    console.log(`- #${column.id}: ${column.name} (${column.column_type})`);
  }
  console.log("Tasks:");
  for (const task of tasks) {
    console.log(`- #${task.id}: ${task.title}`);
  }
}

seed().catch((error) => {
  console.error("Не удалось создать демо-данные.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
