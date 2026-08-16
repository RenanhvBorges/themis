"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { contaAtual } from "@/lib/auth/current";
import { podeGerenciarUsuarios, PERFIS_ATRIBUIVEIS } from "@/lib/domain/rbac";
import { saramValido } from "@/lib/domain/militar";
import { gerarHashSenha } from "@/lib/auth/senha";
import type { PerfilFuncional } from "@prisma/client";

export interface UsuarioAcaoState {
  erro?: string;
  ok?: boolean;
}

class UsuarioAcaoError extends Error {}

async function comTratamento(fn: () => Promise<void>): Promise<UsuarioAcaoState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof UsuarioAcaoError) return { erro: e.message };
    throw e;
  }
  return { ok: true };
}

function textoObrigatorio(formData: FormData, campo: string): string {
  const v = String(formData.get(campo) ?? "").trim();
  if (!v) throw new UsuarioAcaoError(`Preencha o campo "${campo}".`);
  return v;
}

function perfisSelecionados(formData: FormData): PerfilFuncional[] {
  const validos = new Set<string>(PERFIS_ATRIBUIVEIS);
  return formData
    .getAll("perfisFuncionais")
    .map(String)
    .filter((v): v is PerfilFuncional => validos.has(v));
}

function revalidarUsuarios() {
  revalidatePath("/usuarios");
}

// ---------------------------------------------------------------------
// Cadastro de usuário (militar + conta)
// ---------------------------------------------------------------------

export async function criarUsuarioAction(_prev: UsuarioAcaoState, formData: FormData): Promise<UsuarioAcaoState> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeGerenciarUsuarios(conta)) return { erro: "Apenas o Admin pode cadastrar usuários." };

  const saram = textoObrigatorio(formData, "saram");
  const nome = textoObrigatorio(formData, "nome");
  const postoGrad = textoObrigatorio(formData, "postoGrad");
  const secao = textoObrigatorio(formData, "secao");
  const quadro = String(formData.get("quadro") ?? "").trim();
  const perfisFuncionais = perfisSelecionados(formData);

  const res = await comTratamento(async () => {
    if (!saramValido(saram)) throw new UsuarioAcaoError("SARAM inválido — informe de 6 a 8 dígitos.");

    const existente = await prisma.militar.findUnique({ where: { saram } });
    if (existente) throw new UsuarioAcaoError("Já existe um militar cadastrado com este SARAM.");

    const senhaHash = await gerarHashSenha(saram);
    await prisma.militar.create({
      data: {
        saram,
        nome,
        postoGrad,
        secao,
        quadro,
        omId: conta.omId,
        conta: {
          create: { senhaHash, deveTrocarSenha: true, perfisFuncionais },
        },
      },
    });
  });

  if (res.ok) redirect("/usuarios");
  return res;
}

// ---------------------------------------------------------------------
// Edição de acesso (perfis funcionais + ativação da conta)
// ---------------------------------------------------------------------

export async function atualizarAcessoAction(_prev: UsuarioAcaoState, formData: FormData): Promise<UsuarioAcaoState> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeGerenciarUsuarios(conta)) return { erro: "Apenas o Admin pode editar acessos." };

  const contaId = textoObrigatorio(formData, "contaId");
  const perfisFuncionais = perfisSelecionados(formData);
  const ativa = formData.get("ativa") === "on";

  const res = await comTratamento(async () => {
    const alvo = await prisma.conta.findFirst({ where: { id: contaId, militar: { omId: conta.omId } } });
    if (!alvo) throw new UsuarioAcaoError("Conta não encontrada.");
    if (alvo.id === conta.contaId) {
      throw new UsuarioAcaoError("Você não pode editar o acesso da própria conta por aqui.");
    }
    await prisma.conta.update({ where: { id: contaId }, data: { perfisFuncionais, ativa } });
  });

  if (res.ok) revalidarUsuarios();
  return res;
}

export async function redefinirSenhaAction(_prev: UsuarioAcaoState, formData: FormData): Promise<UsuarioAcaoState> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeGerenciarUsuarios(conta)) return { erro: "Apenas o Admin pode redefinir senhas." };

  const contaId = textoObrigatorio(formData, "contaId");

  const res = await comTratamento(async () => {
    const alvo = await prisma.conta.findFirst({
      where: { id: contaId, militar: { omId: conta.omId } },
      include: { militar: true },
    });
    if (!alvo) throw new UsuarioAcaoError("Conta não encontrada.");
    if (alvo.id === conta.contaId) {
      throw new UsuarioAcaoError("Você não pode redefinir a senha da própria conta por aqui.");
    }
    const senhaHash = await gerarHashSenha(alvo.militar.saram);
    await prisma.conta.update({ where: { id: contaId }, data: { senhaHash, deveTrocarSenha: true } });
  });

  if (res.ok) revalidarUsuarios();
  return res;
}
