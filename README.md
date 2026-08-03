# Todo — COMS3011A Lab 1

---
AI Declaration: The preceding document was reviewed and edited with the
assistance of: Claude-Web[Claude Sonnet 5], DeepSeek-Web[DeepSeek-V3]
---

A local-first todo application. No accounts, no deployment — a single user
runs it on their own machine.

## AI Usage

This repository makes use of AI code generation using the following tools:
Claude-Web[Claude Sonnet 5], DeepSeek-Web[DeepSeek-V3]

This repository does not use AI in-line editing tools.

This repository makes use of AI code review using the following tools:
Claude-Web[Claude Sonnet 5], DeepSeek-Web[DeepSeek-V3]

## Third-Party Code

| Package | Why it was chosen |
|---|---|
| `next` (16.x, App Router) | Gives file-based routing, API routes and a React frontend in one project, which matches the brief without needing a separate backend framework. |
| `react` / `react-dom` | Required peer dependencies of Next.js for building the UI. |
| `better-sqlite3` | Synchronous SQLite driver — no async/callback overhead in API routes, well-suited to a single-user local app, and it creates the schema/tables directly with plain SQL rather than requiring an ORM. |
| `tailwindcss` (+ `@tailwindcss/postcss`) | Utility-first styling so the UI could be built quickly without hand-writing a separate CSS file per component. |
| `vitest` (dev) | Fast, zero-config test runner that works natively with ES modules, used to exercise the task business logic against a throwaway SQLite file. |
| `eslint` / `eslint-config-next` (dev) | Ships with `create-next-app`; kept for basic linting during development. |

## Database Design

Single SQLite database file at `data/app.db`, created automatically on first
run. One table:

```
tasks
-----
id            INTEGER PRIMARY KEY AUTOINCREMENT
title         TEXT NOT NULL
description   TEXT NOT NULL DEFAULT ''
due_date      TEXT NOT NULL            -- ISO date, e.g. 2026-08-04
topic         TEXT NOT NULL
status        TEXT NOT NULL DEFAULT 'Todo'
              CHECK (status IN ('Todo', 'In-Progress', 'Complete'))
archived_at   TEXT                      -- NULL while active; set on archive
created_at    TEXT NOT NULL DEFAULT (datetime('now'))
updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
```

Indexes on `topic`, `status`, and `due_date` support the three sort orders.

Design decisions:

- **One table, no relationships.** The brief has a single entity (Task) with
  no other domain object it relates to, so a single flat table is the
  simplest correct design. There is no separate "topics" table — topic is
  free text on the task, since the brief does not require topics to be
  managed as their own entity.
- **Archiving is a nullable timestamp (`archived_at`), not a deletion or a
  copy to another table.** A task is "archived" when this column is set,
  and remains in the same row/table so it stays viewable, per the brief's
  requirement that tasks are never deleted.
- **Overdue is never stored.** It is derived at read time: `due_date` is in
  the past, `status != 'Complete'`, and the task is not archived. This
  keeps it from going stale if a task's due date or status changes after
  the row was written, and keeps it separate from the fixed three-value
  `status` enum as the brief requires.

## Running It

**Tested with Node.js v22.12.0** (v20+ should work, but v22.12.0 is the
exact version used for verification).

From a clean clone:

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The SQLite database file is created
automatically at `data/app.db` on first run, and persists between restarts.

To build and run a production instance instead:

```bash
npm install
npm run build
npm run start
```

To run the test suite:

```bash
npm install
npm test
```

Tests run against a fresh, temporary SQLite file per test (created under the
OS temp directory) — they never touch `data/app.db`, so running tests will
not affect or require any existing local data.
