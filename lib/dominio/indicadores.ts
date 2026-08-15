/**
 * Indicadores do painel do Comandante (PRD, seção 7).
 *
 * Derivados diretamente dos dados operacionais: como todo PATD nasce estruturado no
 * sistema, nenhum destes números exige preenchimento extra por parte de quem opera.
 */

import { ESTADOS } from "./estados";
import { situacaoDoPrazo, deISO } from "./prazos";
import { PUNICOES, rotularItemCurto } from "./rdaer";
import type {
  Perfil,
  Prazo,
  Processo,
  StatusProcesso,
  TipoPunicao,
} from "./tipos";

export interface Fatia {
  chave: string;
  rotulo: string;
  valor: number;
}

export interface PrazoCritico {
  processo: Processo;
  prazo: Prazo;
  situacao: "VENCIDO" | "EM_RISCO";
  responsavel: Perfil | null;
}

export interface Reincidente {
  militarId: string;
  total: number;
  comPunicao: number;
}

export interface Indicadores {
  total: number;
  emAndamento: number;
  finalizados: number;
  porStatus: Fatia[];
  prazosCriticos: PrazoCritico[];
  vencidos: number;
  emRisco: number;
  tempoMedioDias: number | null;
  tempoMedioPorEtapa: { etapa: string; rotulo: string; dias: number }[];
  porItemArt10: Fatia[];
  desfechos: { punicao: number; arquivamento: number };
  porPunicao: Fatia[];
  reconsideracao: {
    elegiveis: number;
    pedidos: number;
    deferidos: number;
    parciais: number;
    indeferidos: number;
    emAnalise: number;
  };
  reincidentes: Reincidente[];
}

function diasEntre(inicio: string, fim: string): number {
  const ms = deISO(fim).getTime() - deISO(inicio).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function media(valores: number[]): number | null {
  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/** Marcos de cada etapa, para medir quanto tempo o processo passou em cada uma. */
function marcos(p: Processo): { etapa: string; rotulo: string; de?: string; ate?: string }[] {
  return [
    { etapa: "1", rotulo: "Abertura → autuação", de: p.abertoEm, ate: p.autuadoEm },
    { etapa: "2", rotulo: "Autuação → ciência", de: p.autuadoEm, ate: p.cienciaEm },
    {
      etapa: "3",
      rotulo: "Ciência → fim da defesa",
      de: p.cienciaEm,
      ate: p.defesa?.apresentadaEm ?? p.recebidoApuradorEm,
    },
    {
      etapa: "4",
      rotulo: "Apuração → relatório",
      de: p.recebidoApuradorEm,
      ate: p.relatorio?.emitidoEm,
    },
    {
      etapa: "5",
      rotulo: "Relatório → recebimento",
      de: p.relatorio?.emitidoEm,
      ate: p.recebidoComandanteEm,
    },
    {
      etapa: "6",
      rotulo: "Recebimento → decisão",
      de: p.recebidoComandanteEm,
      ate: p.decisao?.decididoEm,
    },
    {
      etapa: "7",
      rotulo: "Decisão → ciência",
      de: p.decisao?.decididoEm,
      ate: p.cienciaDecisaoEm,
    },
  ];
}

export function calcularIndicadores(
  processos: Processo[],
  hoje: string,
): Indicadores {
  const emAndamento = processos.filter((p) => p.status !== "FINALIZADO");
  const finalizados = processos.filter((p) => p.status === "FINALIZADO");

  const contagemStatus = new Map<StatusProcesso, number>();
  for (const p of processos) {
    contagemStatus.set(p.status, (contagemStatus.get(p.status) ?? 0) + 1);
  }
  const porStatus: Fatia[] = (Object.keys(ESTADOS) as StatusProcesso[])
    .map((s) => ({
      chave: s,
      rotulo: ESTADOS[s].titulo,
      valor: contagemStatus.get(s) ?? 0,
    }))
    .filter((f) => f.valor > 0);

  const prazosCriticos: PrazoCritico[] = [];
  for (const p of emAndamento) {
    for (const prazo of p.prazos) {
      if (prazo.status === "CUMPRIDO") continue;
      const situacao = situacaoDoPrazo(prazo, hoje);
      if (situacao === "VENCIDO" || situacao === "EM_RISCO") {
        prazosCriticos.push({
          processo: p,
          prazo,
          situacao,
          responsavel: ESTADOS[p.status].responsavel,
        });
      }
    }
  }
  prazosCriticos.sort((a, b) => {
    if (a.situacao !== b.situacao) return a.situacao === "VENCIDO" ? -1 : 1;
    return (a.prazo.prorrogadoAte ?? a.prazo.venceEm).localeCompare(
      b.prazo.prorrogadoAte ?? b.prazo.venceEm,
    );
  });

  const tempoMedioDias = media(
    finalizados
      .filter((p) => p.finalizadoEm)
      .map((p) => diasEntre(p.abertoEm, p.finalizadoEm!)),
  );

  const acumuladoEtapa = new Map<string, { rotulo: string; dias: number[] }>();
  for (const p of processos) {
    for (const m of marcos(p)) {
      if (!m.de || !m.ate) continue;
      const atual = acumuladoEtapa.get(m.etapa) ?? { rotulo: m.rotulo, dias: [] };
      atual.dias.push(diasEntre(m.de, m.ate));
      acumuladoEtapa.set(m.etapa, atual);
    }
  }
  const tempoMedioPorEtapa = [...acumuladoEtapa.entries()]
    .map(([etapa, v]) => ({
      etapa,
      rotulo: v.rotulo,
      dias: Math.round(((media(v.dias) ?? 0) + Number.EPSILON) * 10) / 10,
    }))
    .sort((a, b) => a.etapa.localeCompare(b.etapa));

  const contagemItens = new Map<string, number>();
  for (const p of processos) {
    for (const item of p.itensArt10) {
      contagemItens.set(item, (contagemItens.get(item) ?? 0) + 1);
    }
  }
  const porItemArt10: Fatia[] = [...contagemItens.entries()]
    .map(([chave, valor]) => ({ chave, rotulo: rotularItemCurto(chave), valor }))
    .sort((a, b) => b.valor - a.valor);

  const comDecisao = processos.filter((p) => p.decisao);
  const desfechos = {
    punicao: comDecisao.filter((p) => p.decisao!.tipo === "PUNICAO").length,
    arquivamento: comDecisao.filter((p) => p.decisao!.tipo === "ARQUIVAMENTO").length,
  };

  const contagemPunicao = new Map<TipoPunicao, number>();
  for (const p of comDecisao) {
    const punicao = p.decisao!.punicao;
    if (!punicao) continue;
    contagemPunicao.set(punicao, (contagemPunicao.get(punicao) ?? 0) + 1);
  }
  const porPunicao: Fatia[] = [...contagemPunicao.entries()]
    .map(([chave, valor]) => ({
      chave,
      rotulo: PUNICOES[chave].rotulo,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor);

  const elegiveis = processos.filter(
    (p) => p.decisao?.tipo === "PUNICAO" && p.cienciaDecisaoEm,
  );
  const comPedido = processos.filter((p) => p.reconsideracao);
  const reconsideracao = {
    elegiveis: elegiveis.length,
    pedidos: comPedido.length,
    deferidos: comPedido.filter((p) => p.reconsideracao?.desfecho === "DEFERIDO").length,
    parciais: comPedido.filter(
      (p) => p.reconsideracao?.desfecho === "PARCIALMENTE_DEFERIDO",
    ).length,
    indeferidos: comPedido.filter((p) => p.reconsideracao?.desfecho === "INDEFERIDO")
      .length,
    emAnalise: comPedido.filter((p) => !p.reconsideracao?.desfecho).length,
  };

  const porMilitar = new Map<string, { total: number; comPunicao: number }>();
  for (const p of processos) {
    const atual = porMilitar.get(p.arroladoId) ?? { total: 0, comPunicao: 0 };
    atual.total += 1;
    if (p.decisao?.tipo === "PUNICAO") atual.comPunicao += 1;
    porMilitar.set(p.arroladoId, atual);
  }
  const reincidentes: Reincidente[] = [...porMilitar.entries()]
    .filter(([, v]) => v.total > 1)
    .map(([militarId, v]) => ({ militarId, ...v }))
    .sort((a, b) => b.total - a.total);

  return {
    total: processos.length,
    emAndamento: emAndamento.length,
    finalizados: finalizados.length,
    porStatus,
    prazosCriticos,
    vencidos: prazosCriticos.filter((p) => p.situacao === "VENCIDO").length,
    emRisco: prazosCriticos.filter((p) => p.situacao === "EM_RISCO").length,
    tempoMedioDias:
      tempoMedioDias === null ? null : Math.round(tempoMedioDias * 10) / 10,
    tempoMedioPorEtapa,
    porItemArt10,
    desfechos,
    porPunicao,
    reconsideracao,
    reincidentes,
  };
}
