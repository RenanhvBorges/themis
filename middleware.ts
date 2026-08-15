import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarTokenSessao } from "@/lib/auth/session";

const CAMINHOS_PUBLICOS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    CAMINHOS_PUBLICOS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    if (pathname === "/login") {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      const sessao = token ? await verificarTokenSessao(token) : null;
      if (sessao) {
        const destino = sessao.deveTrocarSenha ? "/trocar-senha" : "/";
        return NextResponse.redirect(new URL(destino, req.url));
      }
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const sessao = token ? await verificarTokenSessao(token) : null;

  if (!sessao) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  if (sessao.deveTrocarSenha && pathname !== "/trocar-senha") {
    return NextResponse.redirect(new URL("/trocar-senha", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
