// Os 10 estados do PATD e seus metadados de exibição.

import type { PrazoTipo, StatusProcesso } from "@prisma/client";

export type Tom = "neutro" | "aviso" | "info" | "sucesso" | "perigo";

export interface EstadoInfo {
  etapa: string;
  titulo: string;
  aguardando: string;
  responsavel: "COMANDANTE" | "ADMIN" | "APURADOR" | "ARROLADO" | null;
  anexos: string[];
  tom: Tom;
}

export const ESTADOS: Record<StatusProcesso, EstadoInfo> = {
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

export const TRILHA_PADRAO = ORDEM_ESTADOS.filter(
  (s) => s !== "RECONSIDERACAO_EM_ANALISE" && s !== "CIENCIA_NOVA_DECISAO",
);

export function posicaoNaOrdem(status: StatusProcesso): number {
  return ORDEM_ESTADOS.indexOf(status);
}

export type Perfil = "COMANDANTE" | "ADMIN" | "APURADOR" | "ARROLADO";

export const ROTULO_PERFIL: Record<Perfil, string> = {
  COMANDANTE: "Comandante",
  ADMIN: "Admin",
  APURADOR: "Oficial Apurador",
  ARROLADO: "Militar Arrolado",
};

export const PRAZO_ROTULO: Record<PrazoTipo, string> = {
  DEFESA: "Alegações de defesa",
  RELATORIO: "Relatório do apurador",
  DECISAO: "Decisão da autoridade",
  RECONSIDERACAO: "Pedido de reconsideração",
};
