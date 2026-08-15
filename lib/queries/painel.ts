import { prisma } from "@/lib/prisma";
import { hojeISO, situacaoDoPrazo } from "@/lib/domain/prazos";
import { ESTADOS, ORDEM_ESTADOS } from "@/lib/domain/estados";

export async function carregarPainel(omId: string) {
  const hoje = hojeISO();

  const processos = await prisma.processo.findMany({
    where: { omId },
    select: {
      id: true,
      numero: true,
      status: true,
      criadoEm: true,
      finalizadoEm: true,
      arrolado: { select: { nome: true, postoGrad: true } },
      decisao: { select: { tipo: true } },
      prazos: { where: { status: { not: "CUMPRIDO" } }, orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });

  const total = processos.length;
  const finalizados = processos.filter((p) => p.status === "FINALIZADO").length;
  const emAndamento = total - finalizados;

  const criticos = processos
    .map((p) => {
      const prazo = p.prazos[0];
      if (!prazo) return null;
      const situacao = situacaoDoPrazo(
        { status: prazo.status, venceEm: prazo.venceEm.toISOString().slice(0, 10), prorrogadoAte: prazo.prorrogadoAte?.toISOString().slice(0, 10) ?? null },
        hoje,
      );
      if (situacao !== "VENCIDO" && situacao !== "EM_RISCO") return null;
      return { ...p, situacao };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => (a.situacao === b.situacao ? 0 : a.situacao === "VENCIDO" ? -1 : 1));

  const porStatus = ORDEM_ESTADOS.map((status) => ({
    status,
    titulo: ESTADOS[status].titulo,
    quantidade: processos.filter((p) => p.status === status).length,
  })).filter((s) => s.quantidade > 0);

  const punicoes = processos.filter((p) => p.decisao?.tipo === "PUNICAO").length;
  const arquivamentos = processos.filter((p) => p.decisao?.tipo === "ARQUIVAMENTO").length;

  return { total, emAndamento, finalizados, criticos, porStatus, punicoes, arquivamentos };
}
