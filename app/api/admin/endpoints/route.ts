import { getSession } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";
import { listEndpoints, publicEndpoint } from "@/lib/endpoints";

async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const rows = await listEndpoints();
  return Response.json({ endpoints: rows.map(publicEndpoint) });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = (await req.json()) as {
    id?: string;
    label?: string;
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    kind?: "chat" | "image";
    enabled?: boolean;
  };

  if (!body.id || !body.label || !body.baseUrl || !body.model) {
    return Response.json({ error: "Eksik alan" }, { status: 400 });
  }

  await ensureSchema();
  await getPool().query(
    `INSERT INTO public.endpoints (id, label, base_url, api_key, model, kind, enabled)
     VALUES ($1, $2, $3, coalesce($4, ''), $5, $6, coalesce($7, true))
     ON CONFLICT (id) DO UPDATE SET
       label = EXCLUDED.label,
       base_url = EXCLUDED.base_url,
       api_key = CASE WHEN $4 IS NULL OR $4 = '' THEN public.endpoints.api_key ELSE EXCLUDED.api_key END,
       model = EXCLUDED.model,
       kind = EXCLUDED.kind,
       enabled = EXCLUDED.enabled`,
    [
      body.id,
      body.label,
      body.baseUrl.replace(/\/$/, ""),
      body.apiKey ?? "",
      body.model,
      body.kind ?? "chat",
      body.enabled ?? true,
    ],
  );

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }
  const { id } = (await req.json()) as { id?: string };
  if (!id) return Response.json({ error: "id gerekli" }, { status: 400 });
  await ensureSchema();
  await getPool().query(`DELETE FROM public.endpoints WHERE id = $1`, [id]);
  return Response.json({ ok: true });
}
