import { NextResponse } from "next/server";
import { updateTask } from "@/lib/tasks";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  try {
    const task = updateTask(Number(id), body);
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
