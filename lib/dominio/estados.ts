/**
 * Máquina de estados do PATD (PRD, seção 4.1).
 *
 * Cada estado sabe quem é o responsável da vez, qual etapa numerada representa e
 * qual documento da ICA 111-6 é produzido ali. As telas leem daqui em vez de
 * espalhar `switch (status)` pela interface.
 */

import type { AnexoId, Perfil, StatusProcesso } from "./tipos";

export type Tom = "neutro" | "info" | "aviso" | "sucesso" | "perigo";

export interface DefinicaoEstado {
  /** Rótulo da etapa conforme o fluxo aprovado (1 a 8, com 7a e 7b opcionais). */
  etapa: string;
  titulo: string;
  /** O que o processo está esperando, em linguagem de quem opera. */
  aguardando: string;
  responsavel: Perfil | null;
  anexos: AnexoId[];
  tom: Tom;
}

export const ESTADOS: Record<StatusProcesso, DefinicaoEstado> = {
  PARA_ABERTURA: {
    etapa: "1",
    titulo: "Para abertura",
    aguardando: "Autuação pelo Admin",
    responsavel: "ADMIN",
    anexos: ["ORIGEM"],
    tom: "neutro",
  },
  A_CIENTIFICAR: {
    etapa: "2",
    titulo: "A cientificar",
    aguardando: "Ciência do militar arrolado",
    responsavel: "ADMIN",
    anexos: ["B", "C", "D"],
    tom: "aviso",
  },
  AGUARDANDO_DEFESA: {
    etapa: "3",
    titulo: "Aguardando defesa",
    aguardando: "Alegações de defesa do arrolado",
    responsavel: "ARROLADO",
    anexos: ["F", "G"],
    tom: "aviso",
  },
  EM_APURACAO: {
    etapa: "4",
    titulo: "Em apuração",
    aguardando: "Instrução e relatório do oficial apurador",
    responsavel: "APURADOR",
    anexos: ["H", "Q"],
    tom: "info",
  },
  AGUARDANDO_DESPACHO: {
    etapa: "5",
    titulo: "Aguardando despacho",
    aguardando: "Recebimento do relatório pelo comandante",
    responsavel: "COMANDANTE",
    anexos: ["I"],
    tom: "info",
  },
  AGUARDANDO_DECISAO: {
    etapa: "6",
    titulo: "Aguardando decisão",
    aguardando: "Decisão da autoridade competente",
    responsavel: "COMANDANTE",
    anexos: ["J"],
    tom: "info",
  },
  CIENCIA_DA_DECISAO: {
    etapa: "7",
    titulo: "Ciência da decisão",
    aguardando: "Ciência do arrolado sobre a decisão",
    responsavel: "ARROLADO",
    anexos: ["K"],
    tom: "aviso",
  },
  RECONSIDERACAO_EM_ANALISE: {
    etapa: "7a",
    titulo: "Reconsideração em análise",
    aguardando: "Julgamento do pedido de reconsideração",
    responsavel: "COMANDANTE",
    anexos: ["M"],
    tom: "info",
  },
  CIENCIA_NOVA_DECISAO: {
    etapa: "7b",
    titulo: "Ciência da nova decisão",
    aguardando: "Ciência do arrolado sobre o julgamento da reconsideração",
    responsavel: "ARROLADO",
    anexos: ["J", "K"],
    tom: "aviso",
  },
  FINALIZADO: {
    etapa: "8",
    titulo: "Finalizado",
    aguardando: "Nada — processo encerrado",
    responsavel: null,
    anexos: [],
    tom: "sucesso",
  },
};

/** Ordem canônica para trilhas de progresso; 7a/7b só aparecem se percorridos. */
export const ORDEM_ESTADOS: StatusProcesso[] = [
  "PARA_ABERTURA",
  "A_CIENTIFICAR",
  "AGUARDANDO_DEFESA",
  "EM_APURACAO",
  "AGUARDANDO_DESPACHO",
  "AGUARDANDO_DECISAO",
  "CIENCIA_DA_DECISAO",
  "RECONSIDERACAO_EM_ANALISE",
  "CIENCIA_NOVA_DECISAO",
  "FINALIZADO",
];

/** Trilha exibida quando o processo não passou por reconsideração. */
export const TRILHA_PADRAO: StatusProcesso[] = ORDEM_ESTADOS.filter(
  (s) => s !== "RECONSIDERACAO_EM_ANALISE" && s !== "CIENCIA_NOVA_DECISAO",
);



