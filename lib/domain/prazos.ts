// Motor de prazos — dias úteis, feriados nacionais e pontos facultativos da
// FAB. Fonte normativa: ICA 111-6/2021, item 7.2.
//
// Datas de negócio trafegam como string ISO "AAAA-MM-DD" (sem hora), sempre
// calculadas em UTC para evitar deslocamento de fuso horário — a data civil
// é o que importa para contagem de prazo, não o instante.

import type { ContagemPrazo, PrazoTipo, StatusPrazo } from "@prisma/client";

export function paraISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}
export function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(ano, mes - 1, dia));
}
export function somarDias(data: Date, dias: number): Date {
  const d = new Date(data.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}
export function somarISO(iso: string, dias: number): string {
  return paraISO(somarDias(deISO(iso), dias));
}

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

function diasSemExpediente(ano: number): Record<string, string> {
  const pascoa = domingoDePascoa(ano);
  const mapa: Record<string, string> = {};
  mapa[`${ano}-01-01`] = "Confraternização Universal";
  mapa[`${ano}-04-21`] = "Tiradentes";
  mapa[`${ano}-05-01`] = "Dia do Trabalho";
  mapa[`${ano}-09-07`] = "Independência do Brasil";
  mapa[`${ano}-10-12`] = "Nossa Senhora Aparecida";
  mapa[`${ano}-10-23`] = "Dia do Aviador e da FAB";
  mapa[`${ano}-11-02`] = "Finados";
  mapa[`${ano}-11-15`] = "Proclamação da República";
  mapa[`${ano}-11-20`] = "Consciência Negra";
  mapa[`${ano}-12-25`] = "Natal";
  mapa[paraISO(somarDias(pascoa, -48))] = "Carnaval";
  mapa[paraISO(somarDias(pascoa, -47))] = "Carnaval";
  mapa[paraISO(somarDias(pascoa, -2))] = "Sexta-feira Santa";
  mapa[paraISO(somarDias(pascoa, 60))] = "Corpus Christi";
  return mapa;
}

export function motivoSemExpediente(iso: string): string | null {
  const data = deISO(iso);
  const semana = data.getUTCDay();
  if (semana === 0) return "Domingo";
  if (semana === 6) return "Sábado";
  return diasSemExpediente(data.getUTCFullYear())[iso] ?? null;
}

export function ehDiaUtil(iso: string): boolean {
  return motivoSemExpediente(iso) === null;
}

export function proximoDiaUtil(iso: string): string {
  let atual = paraISO(somarDias(deISO(iso), 1));
  while (!ehDiaUtil(atual)) atual = paraISO(somarDias(deISO(atual), 1));
  return atual;
}

export function calcularVencimento(inicioEm: string, quantidade: number, contagem: ContagemPrazo): string {
  if (contagem === "CORRIDOS") {
    const bruto = somarISO(inicioEm, quantidade);
    return ehDiaUtil(bruto) ? bruto : proximoDiaUtil(bruto);
  }
  let atual = inicioEm;
  for (let i = 0; i < quantidade; i++) atual = proximoDiaUtil(atual);
  return atual;
}

export function diasUteisRestantes(venceEm: string, hoje: string): number {
  if (venceEm === hoje) return 0;
  const atrasado = venceEm < hoje;
  const de = atrasado ? venceEm : hoje;
  const ate = atrasado ? hoje : venceEm;
  let contador = 0;
  let cursor = de;
  while (cursor < ate) {
    cursor = proximoDiaUtil(cursor);
    contador++;
  }
  return atrasado ? -contador : contador;
}

export const LIMIAR_RISCO_DIAS = 2;

export type SituacaoPrazo = "CUMPRIDO" | "VENCIDO" | "EM_RISCO" | "EM_CURSO";

export interface PrazoLike {
  status: StatusPrazo;
  venceEm: string;
  prorrogadoAte?: string | null;
}

export function situacaoDoPrazo(prazo: PrazoLike, hoje: string): SituacaoPrazo {
  if (prazo.status === "CUMPRIDO") return "CUMPRIDO";
  const limite = prazo.prorrogadoAte || prazo.venceEm;
  if (limite < hoje) return "VENCIDO";
  const restantes = diasUteisRestantes(limite, hoje);
  return restantes <= LIMIAR_RISCO_DIAS ? "EM_RISCO" : "EM_CURSO";
}

export interface RegraPrazo {
  quantidade: number;
  contagem: ContagemPrazo;
  rotulo: string;
  base: string;
}

export const DIAS_POR_PRAZO: Record<PrazoTipo, RegraPrazo> = {
  DEFESA: { quantidade: 5, contagem: "UTEIS", rotulo: "Alegações de defesa", base: 'ICA 111-6, item 5.1.2 "b"' },
  RELATORIO: { quantidade: 5, contagem: "UTEIS", rotulo: "Relatório do apurador", base: "ICA 111-6, item 5.1.7" },
  DECISAO: { quantidade: 5, contagem: "UTEIS", rotulo: "Decisão da autoridade", base: "ICA 111-6, item 5.1.11" },
  RECONSIDERACAO: { quantidade: 15, contagem: "CORRIDOS", rotulo: "Pedido de reconsideração", base: "RDAER, art. 58" },
};

export function calcularVencimentoPrazo(tipo: PrazoTipo, inicioEm: string): string {
  const regra = DIAS_POR_PRAZO[tipo];
  return calcularVencimento(inicioEm, regra.quantidade, regra.contagem);
}

export function prorrogarVencimento(venceEm: string, diasExtras = 5): string {
  return calcularVencimento(venceEm, diasExtras, "UTEIS");
}

export function formatarData(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const s = iso instanceof Date ? paraISO(iso) : iso;
  const [a, m, d] = s.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function formatarDataHora(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return formatarData(typeof iso === "string" ? iso : undefined);
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
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function dataPorExtenso(iso: string, local?: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  const texto = `${Number(d)} de ${MESES[Number(m) - 1]} de ${iso.slice(0, 4)}`;
  return local ? `${local}, ${texto}.` : texto;
}

/** "Hoje" no fuso de Brasília, como data civil (sem hora), em ISO. */
export function hojeISO(): string {
  const agora = new Date();
  const local = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return paraISO(new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())));
}
