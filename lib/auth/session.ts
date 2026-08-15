import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "themis_session";
const DURACAO_SESSAO_SEGUNDOS = 12 * 60 * 60; // 12h

export interface SessionPayload {
  contaId: string;
  militarId: string;
  saram: string;
  deveTrocarSenha: boolean;
}

function segredo(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET ausente ou fraco. Defina uma variável de ambiente AUTH_SECRET com pelo menos 32 bytes aleatórios (openssl rand -base64 32).",
    );
  }
  return new TextEncoder().encode(s);
}

export async function criarTokenSessao(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.contaId)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_SEGUNDOS}s`)
    .sign(segredo());
}

export async function verificarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, segredo());
    if (typeof payload.contaId !== "string" || typeof payload.militarId !== "string" || typeof payload.saram !== "string") {
      return null;
    }
    return {
      contaId: payload.contaId,
      militarId: payload.militarId,
      saram: payload.saram,
      deveTrocarSenha: Boolean(payload.deveTrocarSenha),
    };
  } catch {
    return null;
  }
}

export const COOKIE_OPCOES = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURACAO_SESSAO_SEGUNDOS,
};
