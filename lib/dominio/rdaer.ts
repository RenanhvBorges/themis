/**
 * Catálogo de referência do RDAER (Decreto nº 76.322/1975).
 *
 * ATENÇÃO — CARGA PENDENTE DE VALIDAÇÃO
 * Os itens do art. 10 abaixo são uma AMOSTRA ILUSTRATIVA, com descrições resumidas,
 * para dar substância às telas do protótipo. O art. 10 do RDAER tem 116 itens: antes
 * de qualquer uso real, a lista precisa ser carregada e conferida integralmente contra
 * o texto oficial do Decreto. As telas que consomem este catálogo exibem esse aviso.
 */

import type { Classificacao, Comportamento, TipoPunicao } from "./tipos";

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

export function itemPorId(id: string): ItemArt10 | undefined {
  return ITENS_ART10.find((i) => i.id === id);
}

export function rotularItem(id: string): string {
  const item = itemPorId(id);
  return item ? `Item ${item.numero} — ${item.resumo}` : id;
}

export function rotularItemCurto(id: string): string {
  const item = itemPorId(id);
  return item ? `Item ${item.numero}` : id;
}

/** Circunstâncias atenuantes — art. 13, número 2, do RDAER (rótulos resumidos). */
export const ATENUANTES = [
  { id: "at-a", letra: "a", resumo: "Bom comportamento" },
  { id: "at-b", letra: "b", resumo: "Relevantes serviços prestados" },
  { id: "at-c", letra: "c", resumo: "Falta de prática do serviço" },
  { id: "at-d", letra: "d", resumo: "Ter sido cometida para evitar mal maior" },
];

/** Circunstâncias agravantes — art. 13, número 3, do RDAER (rótulos resumidos). */
export const AGRAVANTES = [
  { id: "ag-a", letra: "a", resumo: "Mau comportamento" },
  { id: "ag-b", letra: "b", resumo: "Prática simultânea de duas ou mais transgressões" },
  { id: "ag-c", letra: "c", resumo: "Reincidência" },
  { id: "ag-d", letra: "d", resumo: "Conluio de duas ou mais pessoas" },
  { id: "ag-e", letra: "e", resumo: "Ser praticada em presença de subordinado" },
];

export function rotularCircunstancia(id: string): string {
  const achado =
    ATENUANTES.find((a) => a.id === id) ?? AGRAVANTES.find((a) => a.id === id);
  return achado ? `Letra “${achado.letra}” — ${achado.resumo}` : id;
}

export const CLASSIFICACOES: Record<Classificacao, string> = {
  LEVE: "Leve",
  MEDIA: "Média",
  GRAVE: "Grave",
};

export const PUNICOES: Record<TipoPunicao, { rotulo: string; privativaDeLiberdade: boolean }> = {
  ADVERTENCIA: { rotulo: "Advertência", privativaDeLiberdade: false },
  REPREENSAO: { rotulo: "Repreensão", privativaDeLiberdade: false },
  DETENCAO: { rotulo: "Detenção", privativaDeLiberdade: true },
  PRISAO: { rotulo: "Prisão", privativaDeLiberdade: true },
  PRISAO_EM_SEPARADO: { rotulo: "Prisão em separado", privativaDeLiberdade: true },
};

export const COMPORTAMENTOS: Record<Comportamento, string> = {
  EXCEPCIONAL: "Excepcional",
  OTIMO: "Ótimo",
  BOM: "Bom",
  INSUFICIENTE: "Insuficiente",
  MAU: "Mau",
};

/**
 * Travas do RDAER que o sistema sinaliza ao apurador/comandante (RF-16 e correlatas).
 * O sistema alerta, não bloqueia: a decisão continua sendo da autoridade.
 */
export function alertasDeEnquadramento(
  classificacao: Classificacao | undefined,
  punicao: TipoPunicao | undefined,
): string[] {
  const alertas: string[] = [];
  if (!classificacao || !punicao) return alertas;
  const privativa = PUNICOES[punicao].privativaDeLiberdade;
  if (classificacao === "LEVE" && privativa) {
    alertas.push(
      "Transgressão leve não pode ser punida com prisão (RDAER, arts. 11 e 12).",
    );
  }
  if (classificacao === "GRAVE" && !privativa) {
    alertas.push(
      "Transgressão grave, em regra, é punida com prisão (RDAER, arts. 11 e 12).",
    );
  }
  if (punicao === "PRISAO" || punicao === "PRISAO_EM_SEPARADO") {
    alertas.push(
      "A primeira punição de prisão do militar é sempre atribuição do Comandante da OM " +
        "e não pode ser delegada (RDAER, art. 38).",
    );
  }
  return alertas;
}
