// Catálogos de referência do domínio disciplinar.
// Fonte normativa: RDAER (Decreto nº 76.322/1975) e ICA 111-6/2021.

import type { Classificacao, TipoPunicao } from "@prisma/client";

export const AVISO_CATALOGO =
  "Amostra ilustrativa do art. 10 do RDAER. A carga oficial dos 116 itens deve ser " +
  "conferida contra o Decreto nº 76.322/1975 antes do uso em processo real.";

export interface ItemArt10 {
  id: string;
  numero: number;
  resumo: string;
}

export const ITENS_ART10: ItemArt10[] = [
  { id: "art10-9", numero: 9, resumo: "Deixar de cumprir ou de fazer cumprir normas regulamentares" },
  { id: "art10-14", numero: 14, resumo: "Deixar de comunicar a tempo, ao superior, ocorrência de que tenha conhecimento" },
  { id: "art10-19", numero: 19, resumo: "Faltar ou chegar atrasado a serviço para o qual tenha sido escalado" },
  { id: "art10-21", numero: 21, resumo: "Deixar de apresentar-se, no prazo devido, à OM de destino ou após afastamento" },
  { id: "art10-27", numero: 27, resumo: "Trabalhar mal, intencionalmente ou por falta de atenção, em serviço ou instrução" },
  { id: "art10-33", numero: 33, resumo: "Portar-se de modo inconveniente ou sem compostura" },
  { id: "art10-38", numero: 38, resumo: "Desrespeitar ou ofender superior hierárquico" },
  { id: "art10-42", numero: 42, resumo: "Apresentar-se com uniforme em desacordo com o regulamento" },
  { id: "art10-46", numero: 46, resumo: "Ausentar-se do local de serviço sem autorização" },
  { id: "art10-58", numero: 58, resumo: "Fazer uso indevido de bem ou material sob carga da Administração" },
  { id: "art10-71", numero: 71, resumo: "Apresentar-se ao serviço sob efeito de bebida alcoólica" },
  { id: "art10-94", numero: 94, resumo: "Utilizar meio eletrônico ou rede social de forma a comprometer a imagem da instituição" },
];

export function itemPorId(id: string): ItemArt10 | null {
  return ITENS_ART10.find((i) => i.id === id) ?? null;
}
export function rotularItem(id: string): string {
  const it = itemPorId(id);
  return it ? `Item ${it.numero} — ${it.resumo}` : id;
}
export function rotularItemCurto(id: string): string {
  const it = itemPorId(id);
  return it ? `Item ${it.numero}` : id;
}

export interface Circunstancia {
  id: string;
  letra: string;
  resumo: string;
}

export const ATENUANTES: Circunstancia[] = [
  { id: "at-a", letra: "a", resumo: "Bom comportamento" },
  { id: "at-b", letra: "b", resumo: "Relevantes serviços prestados" },
  { id: "at-c", letra: "c", resumo: "Falta de prática do serviço" },
  { id: "at-d", letra: "d", resumo: "Ter sido cometida para evitar mal maior" },
];

export const AGRAVANTES: Circunstancia[] = [
  { id: "ag-a", letra: "a", resumo: "Mau comportamento" },
  { id: "ag-b", letra: "b", resumo: "Prática simultânea de duas ou mais transgressões" },
  { id: "ag-c", letra: "c", resumo: "Reincidência" },
  { id: "ag-d", letra: "d", resumo: "Conluio de duas ou mais pessoas" },
  { id: "ag-e", letra: "e", resumo: "Ser praticada em presença de subordinado" },
];

export function rotularCircunstancia(id: string): string {
  const achado = [...ATENUANTES, ...AGRAVANTES].find((a) => a.id === id);
  return achado ? `Letra "${achado.letra}" — ${achado.resumo}` : id;
}

export function letrasCircunstancias(ids: string[], fonte: Circunstancia[]): string {
  const ls = ids.map((id) => fonte.find((a) => a.id === id)?.letra).filter(Boolean);
  if (!ls.length) return "";
  return ls.map((l) => `"${l}"`).join(", ");
}

export const CLASSIFICACOES: Record<Classificacao, string> = {
  LEVE: "Leve",
  MEDIA: "Média",
  GRAVE: "Grave",
};

export const PUNICOES: Record<TipoPunicao, { rotulo: string; privativa: boolean }> = {
  ADVERTENCIA: { rotulo: "Advertência", privativa: false },
  REPREENSAO: { rotulo: "Repreensão", privativa: false },
  DETENCAO: { rotulo: "Detenção", privativa: true },
  PRISAO: { rotulo: "Prisão", privativa: true },
  PRISAO_EM_SEPARADO: { rotulo: "Prisão em separado", privativa: true },
};

export const COMPORTAMENTOS: Record<string, string> = {
  EXCEPCIONAL: "Excepcional",
  OTIMO: "Ótimo",
  BOM: "Bom",
  INSUFICIENTE: "Insuficiente",
  MAU: "Mau",
};

export function alertasDeEnquadramento(
  classificacao: Classificacao | null | undefined,
  punicao: TipoPunicao | null | undefined,
): string[] {
  const alertas: string[] = [];
  if (!classificacao || !punicao) return alertas;
  const privativa = PUNICOES[punicao].privativa;
  if (classificacao === "LEVE" && privativa) {
    alertas.push("Transgressão leve não pode ser punida com prisão (RDAER, arts. 11 e 12).");
  }
  if (classificacao === "GRAVE" && !privativa) {
    alertas.push("Transgressão grave, em regra, é punida com prisão (RDAER, arts. 11 e 12).");
  }
  if (punicao === "PRISAO" || punicao === "PRISAO_EM_SEPARADO") {
    alertas.push(
      "A primeira punição de prisão do militar é sempre atribuição do Comandante da OM e não pode ser delegada (RDAER, art. 38).",
    );
  }
  return alertas;
}

export const TARJA_SIGILO = "INFORMAÇÃO PESSOAL – ACESSO RESTRITO";
export const BASES_SIGILO = [
  "Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988",
  "Art. 31 da Lei nº 12.527, de 2011",
  "Arts. 55 a 62 do Decreto nº 7.724, de 2012",
];

export const ANEXOS: Record<string, { titulo: string }> = {
  ORIGEM: { titulo: "Documento de origem" },
  B: { titulo: "Anexo B — Despacho de Abertura e Designação de Apurador" },
  C: { titulo: "Anexo C — Capa" },
  D: { titulo: "Anexo D — Formulário de Apuração de Transgressão Disciplinar (FATD)" },
  E: { titulo: "Anexo E — Certidão de Recusa de Ciência" },
  F: { titulo: "Anexo F — Alegações de Defesa" },
  G: { titulo: "Anexo G — Certidão de Preclusão" },
  H: { titulo: "Anexo H — Termo de Inquirição do Arrolado" },
  I: { titulo: "Anexo I — Relatório do Oficial Apurador" },
  J: { titulo: "Anexo J — Decisão da Autoridade Competente" },
  K: { titulo: "Anexo K — Nota de Punição Disciplinar (NPD)" },
  M: { titulo: "Anexo M — Pedido de Reconsideração" },
  Q: { titulo: "Anexo Q — Termo de Inquirição de Testemunha" },
};

export const ORDEM_AUTUACAO = ["C", "ORIGEM", "B", "D", "E", "F", "G", "H", "Q", "I", "J", "K", "M"];

/** Anexos de apoio (evidências enviadas pelo usuário) — limites do protótipo. */
export const LIMITE_ANEXOS_QTD = 3;
export const LIMITE_ANEXOS_BYTES = 4 * 1024 * 1024;

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
