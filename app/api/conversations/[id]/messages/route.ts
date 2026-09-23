import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT m.id, m.role, m.content, m.created_at
     FROM public.messages m
     JOIN public.conversations c ON c.id = m.conversation_id
     WHERE m.conversation_id = $1 AND c.user_id = $2
     ORDER BY m.created_at ASC`,
    [id, user.id],
  );

  return Response.json({
    messages: rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    })),
  });
}
