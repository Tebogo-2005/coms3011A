import { getDb } from "./db";

const VALID_STATUSES = ["Todo", "In-Progress", "Complete"];

const VALID_SORTS = {
  topic: "topic",
  status: "status",
  dueDate: "due_date",
};

function withOverdue(row, now = new Date()) {
  const isArchived = Boolean(row.archived_at);
  const isComplete = row.status === "Complete";
  const dueDate = new Date(row.due_date);
  const overdue = !isArchived && !isComplete && dueDate.getTime() < now.getTime();
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    topic: row.topic,
    status: row.status,
    archived: isArchived,
    archivedAt: row.archived_at,
    overdue,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTask(input, dbPath) {
  const { title, description = "", dueDate, topic } = input;
  if (!title || !title.trim()) throw new Error("title is required");
  if (!dueDate) throw new Error("dueDate is required");
  if (!topic || !topic.trim()) throw new Error("topic is required");

  const db = getDb(dbPath);
  const stmt = db.prepare(
    `INSERT INTO tasks (title, description, due_date, topic, status)
     VALUES (@title, @description, @dueDate, @topic, 'Todo')`
  );
  const info = stmt.run({ title, description, dueDate, topic });
  return getTaskById(info.lastInsertRowid, dbPath);
}

export function getTaskById(id, dbPath) {
  const db = getDb(dbPath);
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  return row ? withOverdue(row) : null;
}

export function listTasks({ sortBy = "dueDate", includeArchived = false } = {}, dbPath) {
  const db = getDb(dbPath);
  const column = VALID_SORTS[sortBy] || VALID_SORTS.dueDate;
  const where = includeArchived ? "" : "WHERE archived_at IS NULL";
  const rows = db
    .prepare(`SELECT * FROM tasks ${where} ORDER BY ${column} ASC, id ASC`)
    .all();
  return rows;
}

export function updateTask(id, updates, dbPath) {
  const db = getDb(dbPath);
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  if (!existing) throw new Error("task not found");

  const fieldMap = {
    title: updates.title,
    description: updates.description,
    due_date: updates.dueDate,
    topic: updates.topic,
    status: updates.status,
  };

  if (updates.status && !VALID_STATUSES.includes(updates.status)) {
    throw new Error("invalid status");
  }

  const sets = [];
  const params = { id };
  for (const [col, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      sets.push(`${col} = @${col}`);
      params[col] = value;
    }
  }
  if (sets.length === 0) return getTaskById(id, dbPath);

   sets.push(`updated_at = datetime('now')`);

  db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = @id`).run(params);
  return getTaskById(id, dbPath);
}

export function archiveTask(id, dbPath) {
  const db = getDb(dbPath);
  const existing = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  if (!existing) throw new Error("task not found");
  db.prepare(
  `UPDATE tasks SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).run(id);
  return getTaskById(id, dbPath);
}
