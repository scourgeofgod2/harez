import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT
       coalesce(sum(prompt_tokens), 0)::int AS prompt,
       coalesce(sum(completion_tokens), 0)::int AS completion,
       coalesce(sum(total_tokens), 0)::int AS total
     FROM public.token_usage WHERE user_id = $1`,
    [user.id],
  );

  return Response.json({ user, usage: rows[0] });
}
