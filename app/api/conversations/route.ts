import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT id, title, status, updated_at
     FROM public.conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 100`,
    [user.id],
  );

  return Response.json({
    threads: rows.map((row) => ({
      remoteId: row.id,
      status: row.status === "archived" ? "archived" : "regular",
      title: row.title,
      lastMessageAt: row.updated_at,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const { remoteId } = (await req.json()) as { remoteId?: string };
  if (!remoteId) {
    return Response.json({ error: "remoteId gerekli" }, { status: 400 });
  }

  await ensureSchema();
  await getPool().query(
    `INSERT INTO public.conversations (id, user_id, title, model_id)
     VALUES ($1, $2, 'Yeni sohbet', '')
     ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
    [remoteId, user.id],
  );

  return Response.json({ remoteId });
}
