import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { createTask, listTasks, updateTask, archiveTask } from "../lib/tasks.js";

let dbPath;

beforeEach(() => {
  // Fresh throwaway db file per test - never touches the developer's real data.db
  dbPath = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random()}.db`);
});

afterEach(() => {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe("creating and listing tasks", () => {
  it("creates a task and lists it sorted by topic", () => {
    createTask(
      { title: "Zebra task", dueDate: "2026-12-01", topic: "Zoology" },
      dbPath
    );
    createTask(
      { title: "Apple task", dueDate: "2026-12-01", topic: "Botany" },
      dbPath
    );

    const tasks = listTasks({ sortBy: "topic" }, dbPath);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].topic).toBe("Botany");
    expect(tasks[1].topic).toBe("Zoology");
  });
});

describe("editing tasks", () => {
  it("edits a task and persists the change", () => {
    const task = createTask(
      { title: "Original", dueDate: "2026-12-01", topic: "General" },
      dbPath
    );

    updateTask(task.id, { title: "Updated title", status: "In-Progress" }, dbPath);

    const [reloaded] = listTasks({}, dbPath);
    expect(reloaded.title).toBe("Updated title");
    expect(reloaded.status).toBe("In-Progress");
  });

  it("rejects an invalid status", () => {
    const task = createTask(
      { title: "Task", dueDate: "2026-12-01", topic: "General" },
      dbPath
    );
    expect(() => updateTask(task.id, { status: "Overdue" }, dbPath)).toThrow();
  });
});

describe("archiving and overdue detection", () => {
  it("archives a task so it leaves the active list but remains viewable", () => {
    const task = createTask(
      { title: "To archive", dueDate: "2026-12-01", topic: "General" },
      dbPath
    );

    archiveTask(task.id, dbPath);

    const active = listTasks({ includeArchived: false }, dbPath);
    const all = listTasks({ includeArchived: true }, dbPath);

    expect(active).toHaveLength(0);
    expect(all).toHaveLength(1);
    expect(all[0].archived).toBe(true);
  });

  it("flags a task with a past due date as overdue, but not one due in the future", () => {
    createTask(
      { title: "Past due", dueDate: "2000-01-01", topic: "General" },
      dbPath
    );
    createTask(
      { title: "Future", dueDate: "2999-01-01", topic: "General" },
      dbPath
    );

    const tasks = listTasks({}, dbPath);
    const past = tasks.find((t) => t.title === "Past due");
    const future = tasks.find((t) => t.title === "Future");

    expect(past.overdue).toBe(true);
    expect(future.overdue).toBe(false);
  });

  it("does not flag a completed task as overdue even if its due date has passed", () => {
    const task = createTask(
      { title: "Late but done", dueDate: "2000-01-01", topic: "General" },
      dbPath
    );
    updateTask(task.id, { status: "Complete" }, dbPath);

    const [reloaded] = listTasks({}, dbPath);
    expect(reloaded.overdue).toBe(false);
  });
});
