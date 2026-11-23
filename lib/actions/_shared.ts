import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contaAtual, type ContaAtual } from "@/lib/auth/current";
import { conferirSenha } from "@/lib/auth/senha";
import { acoesDisponiveis, type EstadoProcessoParaAcoes, type Perfil } from "@/lib/domain/rbac";
import { ROTULO_PERFIL } from "@/lib/domain/estados";
import { hojeISO } from "@/lib/domain/prazos";
import type { Ctx } from "@/lib/domain/transicoes";

export class AcaoError extends Error {}

export async function validarCredenciaisAssinatura(formData: FormData, conta: ContaAtual): Promise<void> {
  const saram = String(formData.get("assinaturaSaram") ?? "").trim();
  const senha = String(formData.get("assinaturaSenha") ?? "").trim();

  if (!saram || !senha) {
    throw new AcaoError("Informe o SARAM e a senha para confirmar a assinatura digital.");
  }

  if (saram !== conta.saram) {
    throw new AcaoError("O SARAM informado não confere com o da conta autenticada.");
  }

  const contaDb = await prisma.conta.findUnique({
    where: { id: conta.contaId },
    select: { senhaHash: true },
  });

  if (!contaDb || !(await conferirSenha(senha, contaDb.senhaHash))) {
    throw new AcaoError("Senha incorreta. A assinatura não pôde ser confirmada.");
  }
}

function paraISOData(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function carregarProcessoParaAcoes(
  processoId: string,
): Promise<(EstadoProcessoParaAcoes & { id: string; comandanteId: string; arroladoId: string; omId: string }) | null> {
  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    include: {
      prazos: { where: { status: { not: "CUMPRIDO" } }, orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });
  if (!processo) return null;
  const prazo = processo.prazos[0];
  return {
    id: processo.id,
    status: processo.status,
    apuradorId: processo.apuradorId,
    arroladoId: processo.arroladoId,
    comandanteId: processo.comandanteId,
    omId: processo.omId,
    recebidoApuradorEm: processo.recebidoApuradorEm,
    cienciaDecisaoEm: processo.cienciaDecisaoEm,
    prazoAtivo: prazo
      ? { status: prazo.status, venceEm: paraISOData(prazo.venceEm)!, prorrogadoAte: paraISOData(prazo.prorrogadoAte) }
      : null,
  };
}

export interface AcaoPreparada {
  conta: ContaAtual;
  processo: Awaited<ReturnType<typeof carregarProcessoParaAcoes>> & object;
  ctx: Ctx;
}

/** Recarrega o processo, recomputa as ações permitidas e valida a ação pedida antes de qualquer escrita. */
export async function prepararAcao(
  processoId: string,
  acaoId: string,
  perfilInformado: string,
  formData?: FormData,
): Promise<AcaoPreparada> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");

  if (formData) {
    await validarCredenciaisAssinatura(formData, conta);
  }

  const processo = await carregarProcessoParaAcoes(processoId);
  if (!processo) throw new AcaoError("Processo não encontrado.");

  const hoje = hojeISO();
  const acoes = acoesDisponiveis(processo, conta, hoje);
  const acao = acoes.find((a) => a.id === acaoId && a.comoPerfil.includes(perfilInformado as Perfil));
  if (!acao) throw new AcaoError("Ação não permitida para o seu perfil neste momento.");

  const ctx: Ctx = {
    autorId: conta.militarId,
    autorPerfil: ROTULO_PERFIL[perfilInformado as Perfil],
    em: new Date(),
    data: hoje,
  };

  return { conta, processo, ctx };
}
