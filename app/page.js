"use client";

import { useEffect, useState } from "react";

const STATUSES = ["Todo", "In-Progress", "Complete"];
const SORTS = [
  { key: "dueDate", label: "Due Date" },
  { key: "topic", label: "Topic" },
  { key: "status", label: "Status" },
];

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState("dueDate");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", topic: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/tasks?sortBy=${sortBy}&includeArchived=${showArchived}`);
    const data = await res.json();
    setTasks(data.tasks || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, showArchived]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create task");
      return;
    }
    setForm({ title: "", description: "", dueDate: "", topic: "" });
    load();
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      topic: task.topic,
      status: task.status,
    });
  }

  async function saveEdit(id) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    load();
  }

  async function handleArchive(id) {
    await fetch(`/api/tasks/${id}/archive`, { method: "POST" });
    load();
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Todo</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 mb-6 space-y-2">
        <h2 className="font-semibold">New Task</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          className="border rounded w-full p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="border rounded w-full p-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="date"
          className="border rounded w-full p-2"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <input
          className="border rounded w-full p-2"
          placeholder="Topic"
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
        />
        <button type="submit" className="bg-black text-white rounded px-4 py-2">
          Add Task
        </button>
      </form>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm">
          Sort by:{" "}
          <select
            className="border rounded p-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`border rounded p-3 ${task.overdue ? "border-red-500 bg-red-50" : ""} ${
              task.archived ? "opacity-60" : ""
            }`}
          >
            {editingId === task.id ? (
              <div className="space-y-2">
                <input
                  className="border rounded w-full p-1"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <textarea
                  className="border rounded w-full p-1"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <input
                  type="date"
                  className="border rounded w-full p-1"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
                <input
                  className="border rounded w-full p-1"
                  value={editForm.topic}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                />
                <select
                  className="border rounded w-full p-1"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    className="bg-black text-white rounded px-3 py-1 text-sm"
                    onClick={() => saveEdit(task.id)}
                  >
                    Save
                  </button>
                  <button
                    className="border rounded px-3 py-1 text-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {task.title}{" "}
                      {task.overdue && (
                        <span className="text-red-600 text-xs font-bold">OVERDUE</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <p className="text-xs text-gray-500">
                      Topic: {task.topic} · Due: {task.dueDate} · Status: {task.status}
                    </p>
                  </div>
                  {!task.archived && (
                    <div className="flex gap-2">
                      <button
                        className="text-sm underline"
                        onClick={() => startEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-sm underline"
                        onClick={() => handleArchive(task.id)}
                      >
                        Archive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
        {tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
      </ul>
    </main>
  );
}
