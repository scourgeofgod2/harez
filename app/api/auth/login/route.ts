import bcrypt from "bcryptjs";
import { findUserByEmail, setSession, type SessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return Response.json({ error: "E-posta ve şifre gerekli" }, { status: 400 });
  }

  const row = await findUserByEmail(email.trim());
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return Response.json({ error: "E-posta veya şifre hatalı" }, { status: 401 });
  }

  const user: SessionUser = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
  await setSession(user);
  return Response.json({ user });
}
