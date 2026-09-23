import { getSession } from "@/lib/auth";
import { listEndpoints, publicEndpoint } from "@/lib/endpoints";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ error: "Giriş gerekli" }, { status: 401 });
  const rows = await listEndpoints("chat");
  return Response.json({
    models: rows.filter((row) => row.enabled).map(publicEndpoint),
  });
}
