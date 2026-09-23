import { createOpenAI } from "@ai-sdk/openai";
import { frontendTools } from "@assistant-ui/ai-sdk";
import {
  type JSONSchema7,
  streamText,
  convertToModelMessages,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema, getPool, toConversationUuid } from "@/lib/db";
import { getEndpoint, listEndpoints } from "@/lib/endpoints";

export const maxDuration = 60;

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? part.text : ""))
    .join("\n");
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });

  const {
    messages,
    system,
    tools,
    id,
    modelId,
  }: {
    messages: UIMessage[];
    system?: string;
    tools?: Record<string, { description?: string; parameters: JSONSchema7 }>;
    id?: string;
    modelId?: string;
  } = await req.json();

  const selected = await getEndpoint(modelId ?? "grok");
  if (!selected || selected.kind !== "chat") {
    return Response.json({ error: "Sohbet modeli yok" }, { status: 400 });
  }
  if (!selected.api_key) {
    return Response.json(
      { error: "Bu modelin API anahtarı admin panelinden girilmemiş" },
      { status: 500 },
    );
  }

  const provider = createOpenAI({
    apiKey: selected.api_key,
    baseURL: selected.base_url,
  });

  const imageEndpoints = (await listEndpoints("image")).filter(
    (row) => row.enabled && row.api_key,
  );
  const imageEndpoint = imageEndpoints[0];

  const result = streamText({
    model: provider.chat(selected.model),
    messages: await convertToModelMessages(messages),
    system:
      system ??
      "Sen harez.io asistanısın. Her zaman Türkçe yanıt ver. Kullanıcı görsel isterse generate_image aracını çağır.",
    tools: {
      ...frontendTools(tools ?? {}),
      ...(imageEndpoint
        ? {
            generate_image: tool({
              description:
                "Kullanıcı bir görsel, resim, illüstrasyon veya poster istediğinde çağır.",
              inputSchema: z.object({
                prompt: z.string().describe("İngilizce, ayrıntılı görsel tarifi"),
              }),
              execute: async ({ prompt }) => {
                const response = await fetch(
                  `${imageEndpoint.base_url}/images/generations`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${imageEndpoint.api_key}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      model: imageEndpoint.model,
                      prompt,
                      n: 1,
                      size: "1024x1024",
                    }),
                  },
                );
                if (!response.ok) {
                  const detail = await response.text();
                  return { error: `Görsel üretilemedi: ${detail.slice(0, 300)}` };
                }
                const data = (await response.json()) as {
                  data?: { url?: string; b64_json?: string }[];
                };
                const first = data.data?.[0];
                const url = first?.url
                  ? first.url
                  : first?.b64_json
                    ? `data:image/png;base64,${first.b64_json}`
                    : null;
                return url
                  ? { url, prompt }
                  : { error: "Görsel yanıtı boş geldi" };
              },
            }),
          }
        : {}),
    },
    onFinish: async ({ text, totalUsage }) => {
      if (!id) return;
      try {
        await ensureSchema();
        const pool = getPool();
        const conversationId = toConversationUuid(id);
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const title =
          textOf(lastUser ?? messages[0]!).slice(0, 80) || "Yeni sohbet";

        await pool.query(
          `INSERT INTO public.conversations (id, user_id, title, model_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET updated_at = now(), model_id = $4, user_id = $2`,
          [conversationId, user.id, title, selected.id],
        );

        if (lastUser) {
          const content = textOf(lastUser);
          await pool.query(
            `INSERT INTO public.messages (conversation_id, role, content)
             SELECT $1, 'user', $2
             WHERE NOT EXISTS (
               SELECT 1 FROM public.messages
               WHERE conversation_id = $1 AND role = 'user' AND content = $2
             )`,
            [conversationId, content],
          );
        }

        if (text) {
          await pool.query(
            `INSERT INTO public.messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
            [conversationId, text],
          );
        }

        const prompt = totalUsage?.inputTokens ?? 0;
        const completion = totalUsage?.outputTokens ?? 0;
        await pool.query(
          `INSERT INTO public.token_usage
             (user_id, conversation_id, model_id, prompt_tokens, completion_tokens, total_tokens)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.id,
            conversationId,
            selected.id,
            prompt,
            completion,
            prompt + completion,
          ],
        );
      } catch (error) {
        console.error("kayıt başarısız", error);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: (error) =>
      error instanceof Error ? error.message : String(error),
  });
}
