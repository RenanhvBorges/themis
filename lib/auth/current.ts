import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verificarTokenSessao } from "./session";
import type { ContaRBAC } from "@/lib/domain/rbac";

export interface ContaAtual extends ContaRBAC {
  contaId: string;
  saram: string;
  deveTrocarSenha: boolean;
  nome: string;
  postoGrad: string;
  secao: string;
  omId: string;
}

/**
 * Sessão + conta atuais, memoizado por requisição (React `cache`) para
 * evitar recarregar do banco em cada Server Component da árvore.
 * Retorna `null` quando não há sessão válida.
 */
export const contaAtual = cache(async (): Promise<ContaAtual | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessao = await verificarTokenSessao(token);
  if (!sessao) return null;

  const conta = await prisma.conta.findUnique({
    where: { id: sessao.contaId },
    include: { militar: true },
  });
  if (!conta || !conta.ativa) return null;

  return {
    contaId: conta.id,
    militarId: conta.militarId,
    saram: conta.militar.saram,
    deveTrocarSenha: conta.deveTrocarSenha,
    perfisFuncionais: conta.perfisFuncionais,
    acessoTotalTeste: conta.acessoTotalTeste,
    nome: conta.militar.nome,
    postoGrad: conta.militar.postoGrad,
    secao: conta.militar.secao,
    omId: conta.militar.omId,
  };
});

/** Lança redirecionamento (via middleware) se não usado corretamente — prefira `exigirConta` em Server Components que exigem sessão. */
export async function exigirConta(): Promise<ContaAtual> {
  const conta = await contaAtual();
  if (!conta) {
    throw new Error("Sessão ausente. Esta função só deve ser chamada em rotas protegidas pelo middleware.");
  }
  return conta;
}
