import { NextResponse } from "next/server";
import { archiveTask } from "@/lib/tasks";

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const task = archiveTask(Number(id));
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
