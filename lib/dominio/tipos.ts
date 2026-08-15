/**
 * Tipos do domínio PATD.
 *
 * Espelham o modelo conceitual da seção 9 do PRD. São puros (sem dependência de
 * React/persistência) para que a troca do store do protótipo por Prisma/PostgreSQL
 * não exija reescrever a lógica de processo.
 */

export type Perfil = "ADMIN" | "APURADOR" | "COMANDANTE" | "ARROLADO";

/** Os 10 estados do fluxo definido na seção 4.1 do PRD. */
export type StatusProcesso =
  | "PARA_ABERTURA"
  | "A_CIENTIFICAR"
  | "AGUARDANDO_DEFESA"
  | "EM_APURACAO"
  | "AGUARDANDO_DESPACHO"
  | "AGUARDANDO_DECISAO"
  | "CIENCIA_DA_DECISAO"
  | "RECONSIDERACAO_EM_ANALISE"
  | "CIENCIA_NOVA_DECISAO"
  | "FINALIZADO";

/** Letra do Anexo da ICA 111-6/2021 correspondente ao documento. */
export type AnexoId =
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "M"
  | "Q"
  | "ORIGEM";

export type Comportamento =
  | "EXCEPCIONAL"
  | "OTIMO"
  | "BOM"
  | "INSUFICIENTE"
  | "MAU";

export interface OrganizacaoMilitar {
  id: string;
  sigla: string;
  nome: string;
  cidade: string;
  uf: string;
}

export interface Militar {
  id: string;
  nome: string;
  postoGrad: string;
  quadro: string;
  saram: string;
  secao: string;
  omId: string;
  comportamento: Comportamento;
}

/** Conta de acesso: um militar exercendo um perfil no sistema. */
export interface Conta {
  id: string;
  militarId: string;
  perfil: Perfil;
  funcao: string;
}

export interface Assinatura {
  id: string;
  documentoId: string;
  signatarioId: string;
  papel: string;
  assinadoEm: string;
  hash: string;
  protocolo: string;
}

export interface Documento {
  id: string;
  processoId: string;
  anexo: AnexoId;
  titulo: string;
  criadoEm: string;
  /** Conteúdo estruturado usado para renderizar o documento e gerar o PDF. */
  dados: Record<string, string | string[]>;
  assinaturas: Assinatura[];
  /** Documento anexado pelo usuário (ofício de origem), não gerado pelo sistema. */
  anexado?: boolean;
}

export type TipoPrazo = "DEFESA" | "RELATORIO" | "DECISAO" | "RECONSIDERACAO";

export type StatusPrazo = "EM_CURSO" | "CUMPRIDO" | "VENCIDO" | "PRORROGADO";

export interface Prazo {
  id: string;
  processoId: string;
  tipo: TipoPrazo;
  /** Fato gerador: ciência do arrolado, recebimento dos autos etc. */
  inicioEm: string;
  venceEm: string;
  /** Contagem em dias úteis (ICA 7.2) ou corridos (reconsideração, RDAER art. 58). */
  contagem: "UTEIS" | "CORRIDOS";
  quantidade: number;
  status: StatusPrazo;
  cumpridoEm?: string;
  prorrogadoAte?: string;
}

export interface EventoAuditoria {
  id: string;
  processoId: string;
  em: string;
  autorId: string;
  autorPerfil: Perfil;
  acao: string;
  detalhe: string;
  hash: string;
}

export type TipoDecisao = "PUNICAO" | "ARQUIVAMENTO";

export type TipoPunicao =
  | "ADVERTENCIA"
  | "REPREENSAO"
  | "DETENCAO"
  | "PRISAO"
  | "PRISAO_EM_SEPARADO";

export type Classificacao = "LEVE" | "MEDIA" | "GRAVE";

export interface Decisao {
  tipo: TipoDecisao;
  concordaComRelatorio: boolean;
  punicao?: TipoPunicao;
  dias?: number;
  fundamentacao: string;
  comportamentoResultante?: Comportamento;
  decididoEm: string;
  decididoPor: string;
}

export interface Relatorio {
  conclusao: "PROCEDENTE" | "IMPROCEDENTE";
  classificacao?: Classificacao;
  atenuantes: string[];
  agravantes: string[];
  analise: string;
  propostaPunicao?: TipoPunicao;
  propostaDias?: number;
  emitidoEm: string;
}

export interface Defesa {
  apresentada: boolean;
  texto?: string;
  apresentadaEm?: string;
  /** True quando o prazo venceu sem manifestação (gera Certidão de Preclusão). */
  preclusa?: boolean;
}

export interface Reconsideracao {
  pedidoEm: string;
  razoes: string;
  desfecho?: "DEFERIDO" | "INDEFERIDO" | "PARCIALMENTE_DEFERIDO";
  decididoEm?: string;
  fundamentacao?: string;
}

export interface Inquiricao {
  id: string;
  tipo: "ARROLADO" | "TESTEMUNHA";
  nomeInquirido: string;
  postoInquirido: string;
  realizadaEm: string;
  depoimento: string;
}

export interface Origem {
  tipo: "OFICIO" | "PARTE" | "SINDICANCIA" | "IPM";
  numero: string;
  data: string;
  protocoloComaer?: string;
  arquivo?: string;
}

export interface Processo {
  id: string;
  numero: string;
  status: StatusProcesso;
  omId: string;
  arroladoId: string;
  apuradorId?: string;
  comandanteId: string;
  origem: Origem;
  relatoFato: string;
  /** Itens do art. 10 do RDAER — enquadramento prévio feito pelo Admin. */
  itensArt10: string[];
  abertoEm: string;
  autuadoEm?: string;
  cienciaEm?: string;
  recebidoApuradorEm?: string;
  recebidoComandanteEm?: string;
  cienciaDecisaoEm?: string;
  cienciaNovaDecisaoEm?: string;
  finalizadoEm?: string;
  defesa?: Defesa;
  inquiricoes: Inquiricao[];
  relatorio?: Relatorio;
  decisao?: Decisao;
  reconsideracao?: Reconsideracao;
  documentos: Documento[];
  prazos: Prazo[];
  eventos: EventoAuditoria[];
}

export interface EstadoSistema {
  om: OrganizacaoMilitar;
  militares: Militar[];
  contas: Conta[];
  processos: Processo[];
}
