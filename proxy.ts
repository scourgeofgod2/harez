import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/giris", "/kayit", "/api/auth/login", "/api/auth/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    PUBLIC.some((path) => pathname === path) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("harez_session")?.value;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
