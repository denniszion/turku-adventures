import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const MAX_NAME = 60;
const MAX_MESSAGE = 2000;

export default async (req: Request) => {
  const db = getDatabase();

  if (req.method === "GET") {
    const rows = await db.sql`
      SELECT id, name, message, created_at
      FROM comments
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return Response.json(rows);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    // Honeypot field: real visitors never fill it in, bots usually do
    if (body.website) {
      return Response.json({ ok: true }, { status: 201 });
    }

    const name = String(body.name ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !message) {
      return Response.json({ error: "Please add your name and a comment." }, { status: 400 });
    }
    if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
      return Response.json({ error: "Your name or comment is too long." }, { status: 400 });
    }

    const [comment] = await db.sql`
      INSERT INTO comments (name, message)
      VALUES (${name}, ${message})
      RETURNING id, name, message, created_at
    `;
    return Response.json(comment, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/comments",
};
