import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await ensureSchema();
  const { rows } = await getPool().query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      coalesce(sum(t.prompt_tokens), 0)::int AS prompt_tokens,
      coalesce(sum(t.completion_tokens), 0)::int AS completion_tokens,
      coalesce(sum(t.total_tokens), 0)::int AS total_tokens
    FROM public.users u
    LEFT JOIN public.token_usage t ON t.user_id = u.id
    GROUP BY u.id
    ORDER BY total_tokens DESC, u.created_at
  `);

  return Response.json({ users: rows });
}
