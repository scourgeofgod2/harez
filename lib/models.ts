export type HarezModel = {
  id: string;
  label: string;
  /** OpenAI-compatible base URL, no trailing slash. */
  baseURL: string;
  model: string;
  apiKeyEnv: string;
};

export const HAREZ_MODELS: HarezModel[] = [
  {
    id: "grok",
    label: "Grok 4.6",
    baseURL: process.env.LLM_1_BASE_URL ?? "https://grok.claude.gg/v1",
    model: process.env.LLM_1_MODEL ?? "grok-4.6",
    apiKeyEnv: "LLM_1_API_KEY",
  },
  {
    id: "sonnet",
    label: "Claude Sonnet 4.6",
    baseURL: process.env.LLM_2_BASE_URL ?? "https://app.claude.gg/v1",
    model: process.env.LLM_2_MODEL ?? "claude-sonnet-4-6",
    apiKeyEnv: "LLM_2_API_KEY",
  },
];

export const DEFAULT_MODEL_ID = HAREZ_MODELS[0].id;

export function getModel(id: string | undefined): HarezModel {
  return HAREZ_MODELS.find((m) => m.id === id) ?? HAREZ_MODELS[0];
}
