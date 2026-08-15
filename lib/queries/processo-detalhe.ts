import { prisma } from "@/lib/prisma";
import type { ContaAtual } from "@/lib/auth/current";
import { acoesDisponiveis, podeVer, type Acao, type EstadoProcessoParaAcoes } from "@/lib/domain/rbac";
import { hojeISO } from "@/lib/domain/prazos";
import type { Prisma } from "@prisma/client";

const processoInclude = {
  arrolado: true,
  apurador: true,
  comandante: true,
  abertoPor: true,
  om: true,
  defesa: true,
  relatorio: true,
  decisao: { include: { decididoPor: true } },
  reconsideracao: true,
  inquiricoes: { include: { autor: true }, orderBy: { registradoEm: "asc" } },
  documentos: {
    include: { assinaturas: { include: { signatario: true } } },
    orderBy: { criadoEm: "asc" },
  },
  eventos: { include: { autor: true }, orderBy: { em: "desc" } },
  prazos: { orderBy: { criadoEm: "desc" } },
} satisfies Prisma.ProcessoInclude;

export type ProcessoCompleto = Prisma.ProcessoGetPayload<{ include: typeof processoInclude }>;
export type DocumentoCompleto = ProcessoCompleto["documentos"][number];

export type ResultadoProcessoDetalhe =
  | null
  | { negado: true }
  | { negado: false; processo: ProcessoCompleto; acoes: Acao[]; hoje: string; prazoAtivo: ProcessoCompleto["prazos"][number] | null };

export async function carregarProcessoDetalhe(processoId: string, conta: ContaAtual): Promise<ResultadoProcessoDetalhe> {
  const processo = await prisma.processo.findUnique({
    where: { id: processoId },
    include: processoInclude,
  });
  if (!processo) return null;
  if (!podeVer(conta, processo)) return { negado: true };

  const hoje = hojeISO();
  const prazoAtivo = processo.prazos.find((p) => p.status !== "CUMPRIDO") ?? null;
  const estado: EstadoProcessoParaAcoes = {
    status: processo.status,
    apuradorId: processo.apuradorId,
    arroladoId: processo.arroladoId,
    recebidoApuradorEm: processo.recebidoApuradorEm,
    cienciaDecisaoEm: processo.cienciaDecisaoEm,
    prazoAtivo: prazoAtivo
      ? {
          status: prazoAtivo.status,
          venceEm: prazoAtivo.venceEm.toISOString().slice(0, 10),
          prorrogadoAte: prazoAtivo.prorrogadoAte?.toISOString().slice(0, 10) ?? null,
        }
      : null,
  };
  const acoes = acoesDisponiveis(estado, conta, hoje);

  return { negado: false, processo, acoes, hoje, prazoAtivo };
}
