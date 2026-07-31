import { NextResponse } from "next/server";
import { getState } from "@/lib/store";

// Dev-only: eyeball the entire in-memory store as JSON.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(await getState());
}
