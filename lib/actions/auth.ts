"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { conferirSenha, gerarHashSenha, validarNovaSenha } from "@/lib/auth/senha";
import { COOKIE_OPCOES, SESSION_COOKIE, criarTokenSessao } from "@/lib/auth/session";
import { contaAtual } from "@/lib/auth/current";
import { saramValido } from "@/lib/domain/militar";

export interface LoginState {
  erro?: string;
}

const JANELA_BLOQUEIO_MIN = 15;
const MAX_TENTATIVAS = 5;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const saram = String(formData.get("saram") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = hdrs.get("user-agent");

  if (!saramValido(saram) || !senha) {
    return { erro: "Informe o SARAM e a senha." };
  }

  const militar = await prisma.militar.findUnique({ where: { saram }, include: { conta: true } });
  const conta = militar?.conta;

  if (conta) {
    const desde = new Date(Date.now() - JANELA_BLOQUEIO_MIN * 60 * 1000);
    const falhasRecentes = await prisma.logAcesso.count({
      where: { contaId: conta.id, sucesso: false, em: { gte: desde } },
    });
    if (falhasRecentes >= MAX_TENTATIVAS) {
      return { erro: `Muitas tentativas de acesso. Aguarde ${JANELA_BLOQUEIO_MIN} minutos e tente novamente.` };
    }
  }

  const senhaOk = conta ? await conferirSenha(senha, conta.senhaHash) : false;

  if (!conta || !senhaOk || !conta.ativa) {
    if (conta) {
      await prisma.logAcesso.create({
        data: { contaId: conta.id, ip, userAgent, sucesso: false, motivoFalha: !conta.ativa ? "conta_inativa" : "senha_incorreta" },
      });
    }
    return { erro: "SARAM ou senha inválidos." };
  }

  await prisma.logAcesso.create({ data: { contaId: conta.id, ip, userAgent, sucesso: true } });
  await prisma.conta.update({ where: { id: conta.id }, data: { ultimoLoginEm: new Date() } });

  const token = await criarTokenSessao({
    contaId: conta.id,
    militarId: conta.militarId,
    saram,
    deveTrocarSenha: conta.deveTrocarSenha,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, COOKIE_OPCOES);

  redirect(conta.deveTrocarSenha ? "/trocar-senha" : "/");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export interface TrocarSenhaState {
  erro?: string;
}

export async function trocarSenhaAction(_prevState: TrocarSenhaState, formData: FormData): Promise<TrocarSenhaState> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");

  const senhaAtual = String(formData.get("senhaAtual") ?? "");
  const novaSenha = String(formData.get("novaSenha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  const registro = await prisma.conta.findUniqueOrThrow({ where: { id: conta.contaId } });
  const senhaAtualOk = await conferirSenha(senhaAtual, registro.senhaHash);
  if (!senhaAtualOk) return { erro: "Senha atual incorreta." };

  if (novaSenha !== confirmacao) return { erro: "A confirmação não corresponde à nova senha." };
  const problema = validarNovaSenha(novaSenha, conta.saram);
  if (problema) return { erro: problema };

  const senhaHash = await gerarHashSenha(novaSenha);
  await prisma.conta.update({ where: { id: conta.contaId }, data: { senhaHash, deveTrocarSenha: false } });

  const token = await criarTokenSessao({
    contaId: conta.contaId,
    militarId: conta.militarId,
    saram: conta.saram,
    deveTrocarSenha: false,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, COOKIE_OPCOES);

  redirect("/");
}
