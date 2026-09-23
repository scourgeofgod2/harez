import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";

async function requireUser() {
  return getSession();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT id, title, status, updated_at
     FROM public.conversations
     WHERE id = $1 AND user_id = $2`,
    [id, user.id],
  );
  if (rows.length === 0) {
    return Response.json({ error: "Bulunamadı" }, { status: 404 });
  }
  const row = rows[0];
  return Response.json({
    remoteId: row.id,
    status: row.status === "archived" ? "archived" : "regular",
    title: row.title,
    lastMessageAt: row.updated_at,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as { title?: string; status?: string };

  await ensureSchema();
  const sets: string[] = [];
  const values: unknown[] = [id, user.id];
  if (body.title !== undefined) {
    values.push(body.title);
    sets.push(`title = $${values.length}`);
  }
  if (body.status !== undefined) {
    values.push(body.status);
    sets.push(`status = $${values.length}`);
  }
  if (sets.length === 0) {
    return Response.json({ error: "Alan yok" }, { status: 400 });
  }
  sets.push("updated_at = now()");

  await getPool().query(
    `UPDATE public.conversations SET ${sets.join(", ")}
     WHERE id = $1 AND user_id = $2`,
    values,
  );
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  await getPool().query(
    `DELETE FROM public.conversations WHERE id = $1 AND user_id = $2`,
    [id, user.id],
  );
  return Response.json({ ok: true });
}
