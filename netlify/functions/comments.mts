import type { Config } from "@netlify/functions";
import { getDatabase } from "@netlify/database";

const db = getDatabase();

export default async (req: Request) => {
  if (req.method === "GET") {
    const comments = await db.sql`
      SELECT id, name, body, created_at FROM comments
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return Response.json(comments);
  }

  if (req.method === "POST") {
    let payload: { name?: unknown; body?: unknown };
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const body = typeof payload.body === "string" ? payload.body.trim() : "";

    if (!name || !body) {
      return Response.json({ error: "Name and comment are required" }, { status: 400 });
    }
    if (name.length > 80 || body.length > 2000) {
      return Response.json({ error: "Name or comment is too long" }, { status: 400 });
    }

    const [comment] = await db.sql`
      INSERT INTO comments (name, body) VALUES (${name}, ${body})
      RETURNING id, name, body, created_at
    `;
    return Response.json(comment, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/comments",
};
