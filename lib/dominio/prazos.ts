/**
 * Motor de prazos (PRD, épico E2).
 *
 * Regras da ICA 111-6/2021:
 *  - item 7.2: dia útil é aquele em que houver expediente administrativo na OM;
 *  - itens 5.1.2 "b", 5.1.7 e 5.1.11: 5 dias úteis para defesa, relatório e decisão,
 *    contados do primeiro dia útil subsequente ao fato gerador (ciência/recebimento);
 *  - RDAER art. 58: 15 dias para pedido de reconsideração (contagem corrida).
 */

import type { Prazo, StatusPrazo, TipoPrazo } from "./tipos";

export const DIAS_POR_PRAZO: Record<
  TipoPrazo,
  { quantidade: number; contagem: "UTEIS" | "CORRIDOS"; rotulo: string; base: string }
> = {
  DEFESA: {
    quantidade: 5,
    contagem: "UTEIS",
    rotulo: "Alegações de defesa",
    base: "ICA 111-6, item 5.1.2 “b”",
  },
  RELATORIO: {
    quantidade: 5,
    contagem: "UTEIS",
    rotulo: "Relatório do apurador",
    base: "ICA 111-6, item 5.1.7",
  },
  DECISAO: {
    quantidade: 5,
    contagem: "UTEIS",
    rotulo: "Decisão da autoridade",
    base: "ICA 111-6, item 5.1.11",
  },
  RECONSIDERACAO: {
    quantidade: 15,
    contagem: "CORRIDOS",
    rotulo: "Pedido de reconsideração",
    base: "RDAER, art. 58",
  },
};

/** Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher. */
function domingoDePascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function somarDias(data: Date, dias: number): Date {
  const d = new Date(data.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

export function paraISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/**
 * Dias sem expediente administrativo na OM.
 *
 * Feriados nacionais + datas institucionais da FAB. No produto real esta lista vem
 * do calendário da própria OM (o item 7.2 da ICA amarra a contagem ao expediente
 * local, não ao feriado nacional).
 */
export function diasSemExpediente(ano: number): Map<string, string> {
  const pascoa = domingoDePascoa(ano);
  const mapa = new Map<string, string>([
    [`${ano}-01-01`, "Confraternização Universal"],
    [`${ano}-04-21`, "Tiradentes"],
    [`${ano}-05-01`, "Dia do Trabalho"],
    [`${ano}-09-07`, "Independência do Brasil"],
    [`${ano}-10-12`, "Nossa Senhora Aparecida"],
    [`${ano}-10-23`, "Dia do Aviador e da Força Aérea Brasileira"],
    [`${ano}-11-02`, "Finados"],
    [`${ano}-11-15`, "Proclamação da República"],
    [`${ano}-11-20`, "Consciência Negra"],
    [`${ano}-12-25`, "Natal"],
  ]);
  mapa.set(paraISO(somarDias(pascoa, -48)), "Carnaval");
  mapa.set(paraISO(somarDias(pascoa, -47)), "Carnaval");
  mapa.set(paraISO(somarDias(pascoa, -2)), "Sexta-feira Santa");
  mapa.set(paraISO(somarDias(pascoa, 60)), "Corpus Christi");
  return mapa;
}

export function motivoSemExpediente(iso: string): string | null {
  const data = deISO(iso);
  const semana = data.getUTCDay();
  if (semana === 0) return "Domingo";
  if (semana === 6) return "Sábado";
  return diasSemExpediente(data.getUTCFullYear()).get(iso) ?? null;
}

export function ehDiaUtil(iso: string): boolean {
  return motivoSemExpediente(iso) === null;
}

export function proximoDiaUtil(iso: string): string {
  let atual = somarDias(deISO(iso), 1);
  while (!ehDiaUtil(paraISO(atual))) atual = somarDias(atual, 1);
  return paraISO(atual);
}

/**
 * Calcula o vencimento a partir do fato gerador.
 *
 * Em dias úteis a contagem começa no primeiro dia útil subsequente ao fato gerador.
 * Em dias corridos, o vencimento que cair em dia sem expediente rola para o próximo
 * dia útil (RF-21).
 */
export function calcularVencimento(
  inicioEm: string,
  quantidade: number,
  contagem: "UTEIS" | "CORRIDOS",
): string {
  if (contagem === "CORRIDOS") {
    const bruto = paraISO(somarDias(deISO(inicioEm), quantidade));
    return ehDiaUtil(bruto) ? bruto : proximoDiaUtil(bruto);
  }
  let atual = inicioEm;
  for (let i = 0; i < quantidade; i += 1) atual = proximoDiaUtil(atual);
  return atual;
}

/** Dias úteis restantes até o vencimento (negativo quando já venceu). */
export function diasUteisRestantes(venceEm: string, hoje: string): number {
  if (venceEm === hoje) return 0;
  const atrasado = venceEm < hoje;
  const [de, ate] = atrasado ? [venceEm, hoje] : [hoje, venceEm];
  let contador = 0;
  let cursor = de;
  while (cursor < ate) {
    cursor = proximoDiaUtil(cursor);
    contador += 1;
  }
  return atrasado ? -contador : contador;
}

export type SituacaoPrazo = "CUMPRIDO" | "VENCIDO" | "EM_RISCO" | "EM_CURSO";

/** Prazo com 2 dias úteis ou menos para vencer entra em "em risco" (RF-22). */
export const LIMIAR_RISCO_DIAS = 2;

export function situacaoDoPrazo(prazo: Prazo, hoje: string): SituacaoPrazo {
  if (prazo.status === "CUMPRIDO") return "CUMPRIDO";
  const limite = prazo.prorrogadoAte ?? prazo.venceEm;
  if (limite < hoje) return "VENCIDO";
  const restantes = diasUteisRestantes(limite, hoje);
  return restantes <= LIMIAR_RISCO_DIAS ? "EM_RISCO" : "EM_CURSO";
}

export function criarPrazo(
  processoId: string,
  tipo: TipoPrazo,
  inicioEm: string,
  id: string,
): Prazo {
  const regra = DIAS_POR_PRAZO[tipo];
  return {
    id,
    processoId,
    tipo,
    inicioEm,
    venceEm: calcularVencimento(inicioEm, regra.quantidade, regra.contagem),
    contagem: regra.contagem,
    quantidade: regra.quantidade,
    status: "EM_CURSO" satisfies StatusPrazo,
  };
}

/** Prorrogação de até 5 dias úteis do prazo de defesa (ICA 111-6, item 5.1.4). */
export function prorrogarDefesa(prazo: Prazo, diasExtras = 5): Prazo {
  return {
    ...prazo,
    status: "PRORROGADO",
    prorrogadoAte: calcularVencimento(prazo.venceEm, diasExtras, "UTEIS"),
  };
}

export function formatarData(iso?: string): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatarData(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "Anápolis-GO, 14 de agosto de 2026" — fecho dos documentos oficiais. */
export function dataPorExtenso(iso: string, local?: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  const texto = `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${ano}`;
  return local ? `${local}, ${texto}.` : texto;
}
