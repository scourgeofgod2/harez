import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ensureSchema, getPool } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
};

const COOKIE = "harez_session";

function secret() {
  return process.env.AUTH_SECRET ?? "harez-dev-secret-degistir";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE)?.value);
}

export async function setSession(user: SessionUser) {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function findUserByEmail(email: string) {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT id, email, name, password_hash, role FROM public.users WHERE email = $1`,
    [email.toLowerCase()],
  );
  return rows[0] as
    | {
        id: string;
        email: string;
        name: string;
        password_hash: string;
        role: "admin" | "user";
      }
    | undefined;
}

export async function userCount() {
  await ensureSchema();
  const { rows } = await getPool().query(`SELECT count(*)::int AS n FROM public.users`);
  return rows[0].n as number;
}
