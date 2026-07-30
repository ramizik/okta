import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { resolveRole } from "@/lib/roles";
import { streamChatReply, type ChatMessage } from "@/lib/chat";

export const dynamic = "force-dynamic";

// POST /api/chat — { messages: [{role, content}], path: string }
// Streams the reply as plain text. Identity and data visibility come from
// the session, never from the request body.

function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 20) {
    return null;
  }
  const out: ChatMessage[] = [];
  for (const m of input) {
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      content.length === 0 ||
      content.length > 2000
    ) {
      return null;
    }
    out.push({ role, content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const session = await auth0.getSession();

  // Dev-only identity override so the flow is curl-testable without a
  // browser login. Never active in production builds.
  let email = session?.user.email ?? null;
  if (!email && process.env.NODE_ENV !== "production") {
    email = req.headers.get("x-demo-user");
  }
  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { messages?: unknown; path?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
  if (!messages) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const stream = await streamChatReply(
      resolveRole(email),
      email,
      path,
      messages,
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.warn("[chat] upstream failed:", (err as Error).message);
    return NextResponse.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }
}
