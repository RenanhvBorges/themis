import { prisma } from "@/lib/prisma";
import type { ContaAtual } from "@/lib/auth/current";
import { acoesDisponiveis, type EstadoProcessoParaAcoes } from "@/lib/domain/rbac";
import { hojeISO } from "@/lib/domain/prazos";
import type { Prisma } from "@prisma/client";

export function whereVisivel(conta: ContaAtual): Prisma.ProcessoWhereInput {
  const vejoTudo = conta.acessoTotalTeste || conta.perfisFuncionais.includes("COMANDANTE") || conta.perfisFuncionais.includes("ADMIN");
  if (vejoTudo) return {};
  return { OR: [{ apuradorId: conta.militarId }, { arroladoId: conta.militarId }] };
}

const selecaoLista = {
  id: true,
  numero: true,
  status: true,
  relatoFato: true,
  apuradorId: true,
  arroladoId: true,
  recebidoApuradorEm: true,
  cienciaDecisaoEm: true,
  criadoEm: true,
  arquivadoEm: true,
  arrolado: { select: { nome: true, postoGrad: true, secao: true } },
  apurador: { select: { nome: true, postoGrad: true } },
  prazos: {
    where: { status: { not: "CUMPRIDO" as const } },
    orderBy: { criadoEm: "desc" as const },
    take: 1,
  },
} satisfies Prisma.ProcessoSelect;

export async function listarProcessosVisiveis(conta: ContaAtual) {
  const processos = await prisma.processo.findMany({
    // Excluídos (aberto por engano ou em teste) somem das listagens para
    // todos os perfis — ver listarProcessosExcluidos para a trilha de
    // auditoria restrita ao Admin.
    where: { omId: conta.omId, excluidoEm: null, ...whereVisivel(conta) },
    select: selecaoLista,
    orderBy: { criadoEm: "desc" },
  });

  const hoje = hojeISO();
  return processos.map((p) => {
    const estado: EstadoProcessoParaAcoes = {
      status: p.status,
      apuradorId: p.apuradorId,
      arroladoId: p.arroladoId,
      recebidoApuradorEm: p.recebidoApuradorEm,
      cienciaDecisaoEm: p.cienciaDecisaoEm,
      prazoAtivo: p.prazos[0]
        ? {
            status: p.prazos[0].status,
            venceEm: p.prazos[0].venceEm.toISOString().slice(0, 10),
            prorrogadoAte: p.prazos[0].prorrogadoAte?.toISOString().slice(0, 10) ?? null,
          }
        : null,
    };
    const acoes = acoesDisponiveis(estado, conta, hoje);
    return { ...p, prazoAtivo: p.prazos[0] ?? null, temAcaoPendente: acoes.length > 0 };
  });
}

/** Trilha de auditoria de processos excluídos — restrita ao Admin (ver `podeExcluirProcesso`). */
export async function listarProcessosExcluidos(conta: ContaAtual) {
  return prisma.processo.findMany({
    where: { omId: conta.omId, excluidoEm: { not: null } },
    select: {
      id: true,
      numero: true,
      relatoFato: true,
      excluidoEm: true,
      motivoExclusao: true,
      arrolado: { select: { nome: true, postoGrad: true } },
      excluidoPor: { select: { nome: true, postoGrad: true } },
    },
    orderBy: { excluidoEm: "desc" },
  });
}
