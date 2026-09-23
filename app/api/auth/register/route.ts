import bcrypt from "bcryptjs";
import { ensureSchema, getPool } from "@/lib/db";
import { setSession, userCount, type SessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, name, password } = (await req.json()) as {
    email?: string;
    name?: string;
    password?: string;
  };

  if (!email || !name || !password || password.length < 6) {
    return Response.json(
      { error: "Ad, e-posta ve en az 6 karakter şifre gerekli" },
      { status: 400 },
    );
  }

  await ensureSchema();
  const role = (await userCount()) === 0 ? "admin" : "user";
  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await getPool().query(
      `INSERT INTO public.users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [email.toLowerCase().trim(), name.trim(), hash, role],
    );
    const user = rows[0] as SessionUser;
    await setSession(user);
    return Response.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("kayıt hatası", error);
    const duplicate = message.includes("duplicate") || message.includes("unique");
    return Response.json(
      { error: duplicate ? "Bu e-posta zaten kayıtlı" : message },
      { status: duplicate ? 409 : 500 },
    );
  }
}
