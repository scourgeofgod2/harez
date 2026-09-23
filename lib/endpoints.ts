import { ensureSchema, getPool } from "@/lib/db";

export type EndpointRow = {
  id: string;
  label: string;
  base_url: string;
  api_key: string;
  model: string;
  kind: "chat" | "image";
  enabled: boolean;
};

const SEED: Omit<EndpointRow, "enabled">[] = [
  {
    id: "grok",
    label: "Grok 4.6",
    base_url: process.env.LLM_1_BASE_URL ?? "https://grok.claude.gg/v1",
    api_key: process.env.LLM_1_API_KEY ?? "",
    model: process.env.LLM_1_MODEL ?? "grok-4.6",
    kind: "chat",
  },
  {
    id: "sonnet",
    label: "Claude Sonnet 4.6",
    base_url: process.env.LLM_2_BASE_URL ?? "https://app.claude.gg/v1",
    api_key: process.env.LLM_2_API_KEY ?? "",
    model: process.env.LLM_2_MODEL ?? "claude-sonnet-4-6",
    kind: "chat",
  },
  {
    id: "image",
    label: "Görsel üretimi",
    base_url: process.env.IMAGE_BASE_URL ?? "https://grok.claude.gg/v1",
    api_key: process.env.IMAGE_API_KEY ?? process.env.LLM_1_API_KEY ?? "",
    model: process.env.IMAGE_MODEL ?? "dall-e-3",
    kind: "image",
  },
];

export async function listEndpoints(kind?: "chat" | "image") {
  await ensureSchema();
  const pool = getPool();
  for (const row of SEED) {
    await pool.query(
      `INSERT INTO public.endpoints (id, label, base_url, api_key, model, kind)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [row.id, row.label, row.base_url, row.api_key, row.model, row.kind],
    );
  }
  const { rows } = await pool.query(
    kind
      ? `SELECT id, label, base_url, api_key, model, kind, enabled FROM public.endpoints WHERE kind = $1 ORDER BY created_at`
      : `SELECT id, label, base_url, api_key, model, kind, enabled FROM public.endpoints ORDER BY created_at`,
    kind ? [kind] : [],
  );
  return rows as EndpointRow[];
}

export async function getEndpoint(id: string) {
  const all = await listEndpoints();
  return all.find((row) => row.id === id && row.enabled) ?? all.find((row) => row.kind === "chat" && row.enabled);
}

export function publicEndpoint(row: EndpointRow) {
  return {
    id: row.id,
    label: row.label,
    baseUrl: row.base_url,
    model: row.model,
    kind: row.kind,
    enabled: row.enabled,
    hasKey: Boolean(row.api_key),
  };
}
