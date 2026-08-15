/**
 * Catálogo dos documentos que compõem os autos, mapeados aos Anexos da ICA 111-6/2021.
 *
 * O cabeçalho de sigilo é obrigatório em todos eles (CF art. 5º X; Lei 12.527/2011
 * art. 31; Decreto 7.724/2012 arts. 55 a 62) — ver RNF-01 do PRD.
 */

import type { AnexoId } from "./tipos";

export const TARJA_SIGILO = "INFORMAÇÃO PESSOAL – ACESSO RESTRITO";

export const BASES_SIGILO = [
  "Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988",
  "Art. 31 da Lei nº 12.527, de 2011",
  "Arts. 55 a 62 do Decreto nº 7.724, de 2012",
];

export const TIMBRE = [
  "MINISTÉRIO DA DEFESA",
  "COMANDO DA AERONÁUTICA",
];

export interface DefinicaoAnexo {
  /** Rótulo exibido na lista de peças dos autos. */
  titulo: string;
}

export const ANEXOS: Record<AnexoId, DefinicaoAnexo> = {
  ORIGEM: {
    titulo: "Documento de origem",
  },
  B: {
    titulo: "Anexo B — Despacho de Abertura e Designação de Apurador",
  },
  C: {
    titulo: "Anexo C — Capa",
  },
  D: {
    titulo: "Anexo D — Formulário de Apuração de Transgressão Disciplinar (FATD)",
  },
  E: {
    titulo: "Anexo E — Certidão de Recusa de Ciência",
  },
  F: {
    titulo: "Anexo F — Alegações de Defesa",
  },
  G: {
    titulo: "Anexo G — Certidão de Preclusão",
  },
  H: {
    titulo: "Anexo H — Termo de Inquirição do Arrolado",
  },
  I: {
    titulo: "Anexo I — Relatório do Oficial Apurador",
  },
  J: {
    titulo: "Anexo J — Decisão da Autoridade Competente",
  },
  K: {
    titulo: "Anexo K — Nota de Punição Disciplinar (NPD)",
  },
  M: {
    titulo: "Anexo M — Pedido de Reconsideração",
  },
  Q: {
    titulo: "Anexo Q — Termo de Inquirição de Testemunha",
  },
};


/** Ordem de autuação dos documentos no dossiê consolidado (RF-19). */
export const ORDEM_AUTUACAO: AnexoId[] = [
  "C",
  "ORIGEM",
  "B",
  "D",
  "E",
  "F",
  "G",
  "H",
  "Q",
  "I",
  "J",
  "K",
  "M",
];
