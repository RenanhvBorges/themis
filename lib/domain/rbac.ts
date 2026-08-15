// Controle de acesso por perfil (RF-24 / RNF-01 do artefato de referência).
//
// COMANDANTE e ADMIN são papéis funcionais concedidos à conta
// (Conta.perfisFuncionais). APURADOR e ARROLADO nunca são "concedidos": são
// sempre derivados da relação do militar com um processo específico
// (processo.apuradorId / processo.arroladoId), porque qualquer militar pode
// ser designado apurador ou vir a ser arrolado em um processo concreto.
//
// `acessoTotalTeste` é uma bandeira exclusiva de homologação: faz a conta
// se comportar como se detivesse os 4 perfis em qualquer processo, para uma
// única pessoa conseguir percorrer o fluxo inteiro sozinha antes de existir
// uma conta real para cada papel. Ver README — nunca deve ser usada com
// processos reais.

import type { PerfilFuncional, StatusProcesso } from "@prisma/client";
import { situacaoDoPrazo, type PrazoLike } from "./prazos";

export type Perfil = "COMANDANTE" | "ADMIN" | "APURADOR" | "ARROLADO";
const TODOS_PERFIS: Perfil[] = ["COMANDANTE", "ADMIN", "APURADOR", "ARROLADO"];

export interface ContaRBAC {
  militarId: string;
  perfisFuncionais: PerfilFuncional[];
  acessoTotalTeste: boolean;
}

export interface ProcessoRBAC {
  status: StatusProcesso;
  apuradorId: string | null;
  arroladoId: string;
}

/** Perfis globais da conta, independentes de um processo específico. */
export function perfisGlobais(conta: ContaRBAC): Perfil[] {
  if (conta.acessoTotalTeste) return TODOS_PERFIS;
  return conta.perfisFuncionais;
}

/** Perfis que a conta efetivamente exerce sobre um processo concreto. */
export function perfisEfetivos(conta: ContaRBAC, processo: ProcessoRBAC): Perfil[] {
  if (conta.acessoTotalTeste) return TODOS_PERFIS;
  const perfis = new Set<Perfil>(conta.perfisFuncionais);
  if (processo.apuradorId === conta.militarId) perfis.add("APURADOR");
  if (processo.arroladoId === conta.militarId) perfis.add("ARROLADO");
  return [...perfis];
}

export function podeVer(conta: ContaRBAC, processo: ProcessoRBAC): boolean {
  return perfisEfetivos(conta, processo).length > 0;
}

export function podeVerPainel(conta: ContaRBAC): boolean {
  return perfisGlobais(conta).includes("COMANDANTE");
}

export function podeAbrirProcesso(conta: ContaRBAC): boolean {
  return perfisGlobais(conta).includes("ADMIN");
}

export interface Acao {
  id: string;
  rotulo: string;
  ajuda: string;
  principal: boolean;
  /** Perfil(is) sob o(s) qual(is) esta ação está disponível para a conta. */
  comoPerfil: Perfil[];
}

function acoesParaPerfil(
  p: ProcessoRBAC,
  perfil: Perfil,
  militarId: string,
  situacaoPrazoAtivo: ReturnType<typeof situacaoDoPrazo> | null,
): Omit<Acao, "comoPerfil">[] {
  const acoes: Omit<Acao, "comoPerfil">[] = [];
  const ehArroladoDoProcesso = perfil === "ARROLADO" && militarId === p.arroladoId;
  const ehApuradorDoProcesso = perfil === "APURADOR" && militarId === p.apuradorId;
  const vencido = situacaoPrazoAtivo === "VENCIDO";
  const add = (id: string, rotulo: string, ajuda: string, principal: boolean) =>
    acoes.push({ id, rotulo, ajuda, principal });

  switch (p.status) {
    case "PARA_ABERTURA":
      if (perfil === "ADMIN") add("AUTUAR", "Autuar processo", "Designar apurador, enquadrar no art. 10 do RDAER e gerar o FATD.", true);
      break;
    case "A_CIENTIFICAR":
      if (ehArroladoDoProcesso) add("REGISTRAR_CIENCIA", "Registrar ciência", "Assinar o termo de ciência do FATD e iniciar o prazo de defesa.", true);
      if (perfil === "ADMIN") add("REGISTRAR_RECUSA", "Certificar recusa de ciência", "Lavrar a Certidão de Recusa (Anexo E) quando o arrolado se recusa a assinar.", false);
      break;
    case "AGUARDANDO_DEFESA":
      if (ehArroladoDoProcesso) add("APRESENTAR_DEFESA", "Apresentar defesa", "Enviar as alegações de defesa (Anexo F).", true);
      if (perfil === "APURADOR" || perfil === "ADMIN") {
        if (!vencido) add("PRORROGAR_DEFESA", "Prorrogar prazo", "Conceder mais 5 dias úteis mediante justificativa por escrito.", false);
        if (vencido) add("DECLARAR_PRECLUSAO", "Certificar preclusão", "Lavrar a Certidão de Preclusão (Anexo G) e seguir o rito.", true);
      }
      break;
    case "EM_APURACAO":
      if (ehApuradorDoProcesso) {
        // A distinção entre "ainda não recebeu os autos" e "já recebeu" é
        // resolvida pelo chamador, que filtra via processo.recebidoApuradorEm.
        add("RECEBER_AUTOS", "Assinar recebimento dos autos", "Inicia o prazo de 5 dias úteis para elaboração do relatório.", true);
        add("REGISTRAR_INQUIRICAO", "Lavrar termo de inquirição", "Registrar oitiva do arrolado (Anexo H) ou de testemunha (Anexo Q).", false);
        add("EMITIR_RELATORIO", "Emitir relatório", "Concluir a apuração e despachar com a autoridade competente.", true);
      }
      break;
    case "AGUARDANDO_DESPACHO":
      if (perfil === "COMANDANTE") add("RECEBER_RELATORIO", "Receber relatório", "Assinar o recebimento e iniciar o prazo de 5 dias úteis para decidir.", true);
      break;
    case "AGUARDANDO_DECISAO":
      if (perfil === "COMANDANTE") add("DECIDIR", "Registrar decisão", "Aplicar punição ou arquivar o processo (Anexo J).", true);
      break;
    case "CIENCIA_DA_DECISAO":
      // As duas sub-fases (ainda sem ciência / já com ciência) são
      // resolvidas pelo chamador via processo.cienciaDecisaoEm.
      if (ehArroladoDoProcesso || perfil === "ADMIN") {
        add("REGISTRAR_CIENCIA_DECISAO", "Registrar ciência da decisão", "Assinar a ciência da decisão e, havendo punição, da NPD.", true);
      }
      if (ehArroladoDoProcesso && !vencido) add("PEDIR_RECONSIDERACAO", "Pedir reconsideração", "Interpor pedido de reconsideração da punição (Anexo M).", true);
      if (perfil === "ADMIN" && vencido) add("ENCERRAR_POR_PRAZO", "Encerrar processo", "Prazo de reconsideração transcorrido sem pedido.", true);
      break;
    case "RECONSIDERACAO_EM_ANALISE":
      if (perfil === "COMANDANTE") add("JULGAR_RECONSIDERACAO", "Julgar reconsideração", "Decidir sobre o pedido e emitir nova decisão.", true);
      break;
    case "CIENCIA_NOVA_DECISAO":
      if (ehArroladoDoProcesso || perfil === "ADMIN") {
        add("REGISTRAR_CIENCIA_NOVA_DECISAO", "Registrar ciência da nova decisão", "Assinar a ciência do julgamento da reconsideração e encerrar o processo.", true);
      }
      break;
  }
  return acoes;
}

export interface EstadoProcessoParaAcoes extends ProcessoRBAC {
  recebidoApuradorEm: Date | string | null;
  cienciaDecisaoEm: Date | string | null;
  prazoAtivo: PrazoLike | null;
}

export function acoesDisponiveis(p: EstadoProcessoParaAcoes, conta: ContaRBAC, hoje: string): Acao[] {
  const situacao = p.prazoAtivo ? situacaoDoPrazo(p.prazoAtivo, hoje) : null;
  const perfis = perfisEfetivos(conta, p);
  const porId = new Map<string, Acao>();

  for (const perfil of perfis) {
    let brutas = acoesParaPerfil(p, perfil, conta.militarId, situacao);

    // Refinamentos que dependem de sub-fase (o switch acima cobre o status,
    // mas duas fases têm o mesmo status com ações diferentes conforme o
    // andamento interno do processo).
    if (p.status === "EM_APURACAO" && perfil === "APURADOR") {
      brutas = p.recebidoApuradorEm
        ? brutas.filter((a) => a.id !== "RECEBER_AUTOS")
        : brutas.filter((a) => a.id === "RECEBER_AUTOS");
    }
    if (p.status === "CIENCIA_DA_DECISAO") {
      brutas = p.cienciaDecisaoEm
        ? brutas.filter((a) => a.id !== "REGISTRAR_CIENCIA_DECISAO")
        : brutas.filter((a) => a.id === "REGISTRAR_CIENCIA_DECISAO");
    }

    for (const a of brutas) {
      const existente = porId.get(a.id);
      if (existente) {
        existente.comoPerfil.push(perfil);
      } else {
        porId.set(a.id, { ...a, comoPerfil: [perfil] });
      }
    }
  }
  return [...porId.values()];
}
