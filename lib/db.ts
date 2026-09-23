import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL tanımlı değil");
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString,
      options: "-c search_path=public",
    });
  }

  return globalForPg.pgPool;
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(`CREATE SCHEMA IF NOT EXISTS public`)
      .then(() =>
        getPool().query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id uuid PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text)::uuid,
          email text NOT NULL UNIQUE,
          name text NOT NULL,
          password_hash text NOT NULL,
          role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS public.endpoints (
          id text PRIMARY KEY,
          label text NOT NULL,
          base_url text NOT NULL,
          api_key text NOT NULL DEFAULT '',
          model text NOT NULL,
          kind text NOT NULL DEFAULT 'chat' CHECK (kind IN ('chat', 'image')),
          enabled boolean NOT NULL DEFAULT true,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS public.conversations (
          id uuid PRIMARY KEY,
          user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
          title text NOT NULL DEFAULT 'Yeni sohbet',
          model_id text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS public.messages (
          id uuid PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text)::uuid,
          conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
          role text NOT NULL,
          content text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS public.token_usage (
          id uuid PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text)::uuid,
          user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          conversation_id uuid,
          model_id text NOT NULL,
          prompt_tokens integer NOT NULL DEFAULT 0,
          completion_tokens integer NOT NULL DEFAULT 0,
          total_tokens integer NOT NULL DEFAULT 0,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS messages_conversation_idx
          ON public.messages (conversation_id, created_at);
        CREATE INDEX IF NOT EXISTS token_usage_user_idx
          ON public.token_usage (user_id, created_at);
      `),
      )
      .then(async () => {
        await getPool().query(
          `ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE`,
        );
        await getPool().query(
          `ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'regular'`,
        );
      })
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}
