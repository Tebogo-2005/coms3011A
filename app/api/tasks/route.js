import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/tasks";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sortBy") || "dueDate";
  const includeArchived = searchParams.get("includeArchived") === "true";
  const tasks = listTasks({ sortBy, includeArchived });
  return NextResponse.json({ tasks });
}

export async function POST(request) {
  const body = await request.json();
  try {
    const task = createTask(body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
