/**
 * Transições do PATD.
 *
 * Funções puras: recebem o processo e devolvem um novo processo, já com o documento
 * gerado, o prazo aberto/fechado e o evento de auditoria registrado. São usadas tanto
 * pelas telas quanto pelo gerador de dados de demonstração, então o histórico da massa
 * de teste nasce das mesmas regras que a interface aplica.
 */

import { situacaoDoPrazo, criarPrazo, prorrogarDefesa } from "./prazos";
import type {
  AnexoId,
  Assinatura,
  Classificacao,
  Comportamento,
  Documento,
  Inquiricao,
  Perfil,
  Prazo,
  Processo,
  TipoPrazo,
  TipoPunicao,
} from "./tipos";
import { ANEXOS } from "./anexos";

export interface Contexto {
  /** Militar que praticou o ato. */
  autorId: string;
  autorPerfil: Perfil;
  /** Data-hora do ato (ISO completo). */
  em: string;
  /** Data do ato (ISO, só data) — base de contagem dos prazos. */
  data: string;
}

let sequencia = 0;
function id(prefixo: string, semente: string): string {
  sequencia += 1;
  return `${prefixo}_${semente}_${sequencia.toString(36)}`;
}

function hash(entrada: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < entrada.length; i += 1) {
    h = Math.imul(h ^ entrada.charCodeAt(i), 0x01000193) >>> 0;
  }
  let saida = "";
  let x = h;
  while (saida.length < 64) {
    x = Math.imul(x ^ (x >>> 15), 0x2545f491) >>> 0;
    saida += x.toString(16).padStart(8, "0");
  }
  return saida.slice(0, 64);
}

function protocolo(semente: string): string {
  const h = hash(semente).toUpperCase();
  return `GOVBR-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}

function criarDocumento(
  processo: Processo,
  anexo: AnexoId,
  criadoEm: string,
  dados: Record<string, string | string[]> = {},
): Documento {
  const docId = id("doc", `${processo.id}${anexo}`);
  return {
    id: docId,
    processoId: processo.id,
    anexo,
    titulo: ANEXOS[anexo].titulo,
    criadoEm,
    dados,
    assinaturas: [],
  };
}

function assinar(
  doc: Documento,
  signatarioId: string,
  papel: string,
  em: string,
): Documento {
  const conteudo = `${doc.id}|${doc.processoId}|${doc.anexo}|${JSON.stringify(doc.dados)}`;
  const assinatura: Assinatura = {
    id: id("asn", doc.id + signatarioId),
    documentoId: doc.id,
    signatarioId,
    papel,
    assinadoEm: em,
    hash: hash(conteudo),
    protocolo: protocolo(doc.id + signatarioId + em),
  };
  return { ...doc, assinaturas: [...doc.assinaturas, assinatura] };
}

function registrar(
  processo: Processo,
  ctx: Contexto,
  acao: string,
  detalhe: string,
): Processo {
  const evento = {
    id: id("evt", processo.id + acao),
    processoId: processo.id,
    em: ctx.em,
    autorId: ctx.autorId,
    autorPerfil: ctx.autorPerfil,
    acao,
    detalhe,
    hash: hash(`${processo.id}|${acao}|${ctx.em}|${ctx.autorId}`),
  };
  return { ...processo, eventos: [...processo.eventos, evento] };
}

function abrirPrazo(processo: Processo, tipo: TipoPrazo, inicioEm: string): Processo {
  const prazo = criarPrazo(processo.id, tipo, inicioEm, id("prz", processo.id + tipo));
  return { ...processo, prazos: [...processo.prazos, prazo] };
}

function cumprirPrazo(processo: Processo, tipo: TipoPrazo, em: string): Processo {
  return {
    ...processo,
    prazos: processo.prazos.map((p) =>
      p.tipo === tipo && p.status !== "CUMPRIDO"
        ? { ...p, status: "CUMPRIDO" as const, cumpridoEm: em }
        : p,
    ),
  };
}

export function prazoAtivo(processo: Processo): Prazo | undefined {
  return [...processo.prazos].reverse().find((p) => p.status !== "CUMPRIDO");
}

// ---------------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------------

export interface DadosAutuacao {
  apuradorId: string;
  itensArt10: string[];
  relatoFato: string;
  portaria: string;
  boletim: string;
}

/** Etapa 1 → 2. Admin designa apurador, enquadra e autua os autos. */
export function autuar(p: Processo, ctx: Contexto, d: DadosAutuacao): Processo {
  let np: Processo = {
    ...p,
    status: "A_CIENTIFICAR",
    apuradorId: d.apuradorId,
    itensArt10: d.itensArt10,
    relatoFato: d.relatoFato,
    autuadoEm: ctx.data,
  };
  const capa = criarDocumento(np, "C", ctx.em);
  const despacho = assinar(
    criarDocumento(np, "B", ctx.em, { portaria: d.portaria, boletim: d.boletim }),
    p.comandanteId,
    "Autoridade competente",
    ctx.em,
  );
  const fatd = assinar(
    criarDocumento(np, "D", ctx.em),
    d.apuradorId,
    "Oficial Apurador",
    ctx.em,
  );
  np = { ...np, documentos: [...np.documentos, capa, despacho, fatd] };
  return registrar(
    np,
    ctx,
    "Autuação",
    "Processo autuado, apurador designado e FATD emitido para ciência do arrolado.",
  );
}

/** Etapa 2 → 3. Arrolado assina o termo de ciência do FATD; abre o prazo de defesa. */
export function registrarCiencia(p: Processo, ctx: Contexto): Processo {
  const documentos = p.documentos.map((doc) =>
    doc.anexo === "D" ? assinar(doc, p.arroladoId, "Militar Arrolado", ctx.em) : doc,
  );
  let np: Processo = {
    ...p,
    status: "AGUARDANDO_DEFESA",
    cienciaEm: ctx.data,
    documentos,
  };
  np = abrirPrazo(np, "DEFESA", ctx.data);
  return registrar(
    np,
    ctx,
    "Ciência do arrolado",
    "Ciência registrada no FATD. Prazo de 5 dias úteis para alegações de defesa iniciado.",
  );
}

/** Etapa 2 → 3 pela via da recusa: gera a Certidão de Recusa de Ciência (Anexo E). */
export function registrarRecusaDeCiencia(
  p: Processo,
  ctx: Contexto,
  justificativa: string,
): Processo {
  const certidao = assinar(
    criarDocumento(p, "E", ctx.em, { justificativa }),
    ctx.autorId,
    "Oficial Apurador",
    ctx.em,
  );
  let np: Processo = {
    ...p,
    status: "AGUARDANDO_DEFESA",
    cienciaEm: ctx.data,
    documentos: [...p.documentos, certidao],
  };
  np = abrirPrazo(np, "DEFESA", ctx.data);
  return registrar(
    np,
    ctx,
    "Recusa de ciência certificada",
    `Certidão de Recusa de Ciência lavrada. ${justificativa}`,
  );
}

/** Prorrogação de até 5 dias úteis do prazo de defesa (ICA 111-6, item 5.1.4). */
export function prorrogarPrazoDefesa(
  p: Processo,
  ctx: Contexto,
  justificativa: string,
): Processo {
  const np: Processo = {
    ...p,
    prazos: p.prazos.map((pz) =>
      pz.tipo === "DEFESA" && pz.status !== "CUMPRIDO" ? prorrogarDefesa(pz) : pz,
    ),
  };
  return registrar(
    np,
    ctx,
    "Prorrogação do prazo de defesa",
    `Prazo prorrogado por 5 dias úteis. Justificativa: ${justificativa}`,
  );
}

/** Etapa 3 → 4 com defesa apresentada (Anexo F). */
export function apresentarDefesa(p: Processo, ctx: Contexto, texto: string): Processo {
  const folha = assinar(
    criarDocumento(p, "F", ctx.em, { texto }),
    p.arroladoId,
    "Militar Arrolado",
    ctx.em,
  );
  let np: Processo = {
    ...p,
    status: "EM_APURACAO",
    defesa: { apresentada: true, texto, apresentadaEm: ctx.data },
    documentos: [...p.documentos, folha],
  };
  np = cumprirPrazo(np, "DEFESA", ctx.data);
  return registrar(
    np,
    ctx,
    "Alegações de defesa apresentadas",
    "Defesa juntada aos autos. Processo segue para o oficial apurador.",
  );
}

/** Etapa 3 → 4 por preclusão: prazo vencido sem manifestação (Anexo G). */
export function declararPreclusao(p: Processo, ctx: Contexto): Processo {
  const certidao = assinar(
    criarDocumento(p, "G", ctx.em),
    ctx.autorId,
    "Oficial Apurador",
    ctx.em,
  );
  let np: Processo = {
    ...p,
    status: "EM_APURACAO",
    defesa: { apresentada: false, preclusa: true },
    documentos: [...p.documentos, certidao],
  };
  np = cumprirPrazo(np, "DEFESA", ctx.data);
  return registrar(
    np,
    ctx,
    "Preclusão certificada",
    "Transcorrido o prazo de defesa sem manifestação. Certidão de Preclusão lavrada.",
  );
}

/** Dentro da etapa 4: apurador assina o recebimento e dispara o prazo do relatório. */
export function receberAutos(p: Processo, ctx: Contexto): Processo {
  let np: Processo = { ...p, recebidoApuradorEm: ctx.data };
  np = abrirPrazo(np, "RELATORIO", ctx.data);
  return registrar(
    np,
    ctx,
    "Recebimento dos autos",
    "Oficial apurador assinou o recebimento. Prazo de 5 dias úteis para o relatório iniciado.",
  );
}

export function registrarInquiricao(
  p: Processo,
  ctx: Contexto,
  dados: Omit<Inquiricao, "id">,
): Processo {
  const inq: Inquiricao = { ...dados, id: id("inq", p.id) };
  const anexo: AnexoId = inq.tipo === "ARROLADO" ? "H" : "Q";
  const doc = assinar(
    criarDocumento(p, anexo, ctx.em, { inquiricaoId: inq.id }),
    ctx.autorId,
    "Oficial Apurador",
    ctx.em,
  );
  const np: Processo = {
    ...p,
    inquiricoes: [...p.inquiricoes, inq],
    documentos: [...p.documentos, doc],
  };
  return registrar(
    np,
    ctx,
    "Termo de inquirição lavrado",
    `Inquirição de ${inq.postoInquirido} ${inq.nomeInquirido} (${
      inq.tipo === "ARROLADO" ? "militar arrolado" : "testemunha"
    }).`,
  );
}

export interface DadosRelatorio {
  conclusao: "PROCEDENTE" | "IMPROCEDENTE";
  classificacao?: Classificacao;
  atenuantes: string[];
  agravantes: string[];
  analise: string;
  propostaPunicao?: TipoPunicao;
  propostaDias?: number;
}

/** Etapa 4 → 5. Apurador emite o relatório (Anexo I) e despacha com o comandante. */
export function emitirRelatorio(
  p: Processo,
  ctx: Contexto,
  d: DadosRelatorio,
): Processo {
  const doc = assinar(
    criarDocumento(p, "I", ctx.em),
    ctx.autorId,
    "Oficial Apurador",
    ctx.em,
  );
  let np: Processo = {
    ...p,
    status: "AGUARDANDO_DESPACHO",
    relatorio: { ...d, emitidoEm: ctx.data },
    documentos: [...p.documentos, doc],
  };
  np = cumprirPrazo(np, "RELATORIO", ctx.data);
  return registrar(
    np,
    ctx,
    "Relatório emitido",
    d.conclusao === "PROCEDENTE"
      ? "Apurador concluiu pela procedência e propôs punição."
      : "Apurador concluiu pela improcedência e propôs o arquivamento.",
  );
}

/** Etapa 5 → 6. Comandante recebe os autos; começa o prazo de decisão. */
export function receberRelatorio(p: Processo, ctx: Contexto): Processo {
  let np: Processo = {
    ...p,
    status: "AGUARDANDO_DECISAO",
    recebidoComandanteEm: ctx.data,
  };
  np = abrirPrazo(np, "DECISAO", ctx.data);
  return registrar(
    np,
    ctx,
    "Recebimento do relatório",
    "Autoridade competente recebeu os autos. Prazo de 5 dias úteis para decisão iniciado.",
  );
}

export interface DadosDecisao {
  tipo: "PUNICAO" | "ARQUIVAMENTO";
  concordaComRelatorio: boolean;
  punicao?: TipoPunicao;
  dias?: number;
  fundamentacao: string;
  comportamentoResultante?: Comportamento;
}

/** Etapa 6 → 7. Comandante decide (Anexo J) e, havendo punição, emite a NPD (Anexo K). */
export function decidir(p: Processo, ctx: Contexto, d: DadosDecisao): Processo {
  const decisao = assinar(
    criarDocumento(p, "J", ctx.em),
    ctx.autorId,
    "Autoridade competente",
    ctx.em,
  );
  const documentos = [...p.documentos, decisao];
  if (d.tipo === "PUNICAO") {
    documentos.push(
      assinar(criarDocumento(p, "K", ctx.em), ctx.autorId, "Autoridade competente", ctx.em),
    );
  }
  let np: Processo = {
    ...p,
    status: "CIENCIA_DA_DECISAO",
    decisao: { ...d, decididoEm: ctx.data, decididoPor: ctx.autorId },
    documentos,
  };
  np = cumprirPrazo(np, "DECISAO", ctx.data);
  return registrar(
    np,
    ctx,
    "Decisão da autoridade",
    d.tipo === "PUNICAO"
      ? "Decidido pela aplicação de punição disciplinar. NPD emitida."
      : "Decidido pelo arquivamento do processo.",
  );
}

/**
 * Etapa 7. Arrolado toma ciência da decisão. Havendo punição, abre-se o prazo de
 * 15 dias para reconsideração; no arquivamento o processo já se encerra.
 */
export function registrarCienciaDecisao(p: Processo, ctx: Contexto): Processo {
  const documentos = p.documentos.map((doc) =>
    doc.anexo === "J" || doc.anexo === "K"
      ? assinar(doc, p.arroladoId, "Militar Arrolado", ctx.em)
      : doc,
  );
  const punido = p.decisao?.tipo === "PUNICAO";
  let np: Processo = { ...p, cienciaDecisaoEm: ctx.data, documentos };
  if (punido) {
    np = abrirPrazo(np, "RECONSIDERACAO", ctx.data);
    return registrar(
      np,
      ctx,
      "Ciência da decisão",
      "Arrolado assinou a ciência da decisão e da NPD. Prazo de 15 dias para reconsideração iniciado.",
    );
  }
  np = { ...np, status: "FINALIZADO", finalizadoEm: ctx.data };
  return registrar(
    np,
    ctx,
    "Ciência da decisão",
    "Arrolado assinou a ciência do arquivamento. Processo encerrado.",
  );
}

/** Etapa 7 → 7a. Arrolado pede reconsideração (Anexo M). */
export function pedirReconsideracao(
  p: Processo,
  ctx: Contexto,
  razoes: string,
): Processo {
  const doc = assinar(
    criarDocumento(p, "M", ctx.em, { razoes }),
    p.arroladoId,
    "Militar Arrolado",
    ctx.em,
  );
  let np: Processo = {
    ...p,
    status: "RECONSIDERACAO_EM_ANALISE",
    reconsideracao: { pedidoEm: ctx.data, razoes },
    documentos: [...p.documentos, doc],
  };
  np = cumprirPrazo(np, "RECONSIDERACAO", ctx.data);
  return registrar(
    np,
    ctx,
    "Pedido de reconsideração",
    "Arrolado interpôs pedido de reconsideração da punição aplicada.",
  );
}

/** Etapa 7a → 7b. Comandante julga o pedido e emite nova decisão. */
export function julgarReconsideracao(
  p: Processo,
  ctx: Contexto,
  d: {
    desfecho: "DEFERIDO" | "INDEFERIDO" | "PARCIALMENTE_DEFERIDO";
    fundamentacao: string;
    punicao?: TipoPunicao;
    dias?: number;
  },
): Processo {
  const doc = assinar(
    criarDocumento(p, "J", ctx.em, { reconsideracao: "sim" }),
    ctx.autorId,
    "Autoridade competente",
    ctx.em,
  );
  const documentos = [...p.documentos, doc];
  const virouArquivamento = d.desfecho === "DEFERIDO";
  if (!virouArquivamento && d.punicao) {
    documentos.push(
      assinar(
        criarDocumento(p, "K", ctx.em, { reconsideracao: "sim" }),
        ctx.autorId,
        "Autoridade competente",
        ctx.em,
      ),
    );
  }
  const np: Processo = {
    ...p,
    status: "CIENCIA_NOVA_DECISAO",
    reconsideracao: {
      ...p.reconsideracao!,
      desfecho: d.desfecho,
      decididoEm: ctx.data,
      fundamentacao: d.fundamentacao,
    },
    decisao: p.decisao
      ? {
          ...p.decisao,
          tipo: virouArquivamento ? "ARQUIVAMENTO" : "PUNICAO",
          punicao: virouArquivamento ? undefined : (d.punicao ?? p.decisao.punicao),
          dias: virouArquivamento ? undefined : (d.dias ?? p.decisao.dias),
        }
      : p.decisao,
    documentos,
  };
  return registrar(
    np,
    ctx,
    "Julgamento da reconsideração",
    `Pedido de reconsideração ${d.desfecho.toLowerCase().replace(/_/g, " ")}.`,
  );
}

/** Etapa 7b → 8. */
export function registrarCienciaNovaDecisao(p: Processo, ctx: Contexto): Processo {
  const documentos = p.documentos.map((doc) =>
    (doc.anexo === "J" || doc.anexo === "K") && doc.dados.reconsideracao === "sim"
      ? assinar(doc, p.arroladoId, "Militar Arrolado", ctx.em)
      : doc,
  );
  const np: Processo = {
    ...p,
    status: "FINALIZADO",
    cienciaNovaDecisaoEm: ctx.data,
    finalizadoEm: ctx.data,
    documentos,
  };
  return registrar(
    np,
    ctx,
    "Ciência da nova decisão",
    "Arrolado assinou a ciência do julgamento da reconsideração. Processo encerrado.",
  );
}

/** Etapa 7 → 8 automática: prazo de reconsideração expirou sem pedido (RF-17). */
export function encerrarPorDecursoDePrazo(p: Processo, ctx: Contexto): Processo {
  let np: Processo = { ...p, status: "FINALIZADO", finalizadoEm: ctx.data };
  np = cumprirPrazo(np, "RECONSIDERACAO", ctx.data);
  return registrar(
    np,
    ctx,
    "Encerramento por decurso de prazo",
    "Transcorridos 15 dias da ciência sem pedido de reconsideração. Processo encerrado.",
  );
}

// ---------------------------------------------------------------------------
// Ações disponíveis por perfil e estado
// ---------------------------------------------------------------------------

export type AcaoId =
  | "AUTUAR"
  | "REGISTRAR_CIENCIA"
  | "REGISTRAR_RECUSA"
  | "APRESENTAR_DEFESA"
  | "PRORROGAR_DEFESA"
  | "DECLARAR_PRECLUSAO"
  | "RECEBER_AUTOS"
  | "REGISTRAR_INQUIRICAO"
  | "EMITIR_RELATORIO"
  | "RECEBER_RELATORIO"
  | "DECIDIR"
  | "REGISTRAR_CIENCIA_DECISAO"
  | "PEDIR_RECONSIDERACAO"
  | "ENCERRAR_POR_PRAZO"
  | "JULGAR_RECONSIDERACAO"
  | "REGISTRAR_CIENCIA_NOVA_DECISAO";

export interface AcaoDisponivel {
  id: AcaoId;
  rotulo: string;
  ajuda: string;
  /** Ação principal do estado — recebe destaque visual. */
  principal: boolean;
}

/**
 * Ações que o perfil informado pode executar no processo, no estado atual.
 * A tela nunca decide isso sozinha: pergunta aqui.
 */
export function acoesDisponiveis(
  p: Processo,
  perfil: Perfil,
  militarId: string,
  hoje: string,
): AcaoDisponivel[] {
  const acoes: AcaoDisponivel[] = [];
  const ehArroladoDoProcesso = perfil === "ARROLADO" && militarId === p.arroladoId;
  const ehApuradorDoProcesso = perfil === "APURADOR" && militarId === p.apuradorId;
  const prazo = prazoAtivo(p);
  const vencido = prazo ? situacaoDoPrazo(prazo, hoje) === "VENCIDO" : false;

  switch (p.status) {
    case "PARA_ABERTURA":
      if (perfil === "ADMIN") {
        acoes.push({
          id: "AUTUAR",
          rotulo: "Autuar processo",
          ajuda: "Designar apurador, enquadrar no art. 10 do RDAER e gerar o FATD.",
          principal: true,
        });
      }
      break;

    case "A_CIENTIFICAR":
      if (ehArroladoDoProcesso) {
        acoes.push({
          id: "REGISTRAR_CIENCIA",
          rotulo: "Registrar ciência",
          ajuda: "Assinar o termo de ciência do FATD e iniciar o prazo de defesa.",
          principal: true,
        });
      }
      if (perfil === "ADMIN") {
        acoes.push({
          id: "REGISTRAR_RECUSA",
          rotulo: "Certificar recusa de ciência",
          ajuda: "Lavrar a Certidão de Recusa (Anexo E) quando o arrolado se recusa a assinar.",
          principal: false,
        });
      }
      break;

    case "AGUARDANDO_DEFESA":
      if (ehArroladoDoProcesso) {
        acoes.push({
          id: "APRESENTAR_DEFESA",
          rotulo: "Apresentar defesa",
          ajuda: "Enviar as alegações de defesa (Anexo F).",
          principal: true,
        });
      }
      if (perfil === "APURADOR" || perfil === "ADMIN") {
        if (!vencido) {
          acoes.push({
            id: "PRORROGAR_DEFESA",
            rotulo: "Prorrogar prazo",
            ajuda: "Conceder mais 5 dias úteis mediante justificativa por escrito.",
            principal: false,
          });
        }
        if (vencido) {
          acoes.push({
            id: "DECLARAR_PRECLUSAO",
            rotulo: "Certificar preclusão",
            ajuda: "Lavrar a Certidão de Preclusão (Anexo G) e seguir o rito.",
            principal: true,
          });
        }
      }
      break;

    case "EM_APURACAO":
      if (ehApuradorDoProcesso) {
        if (!p.recebidoApuradorEm) {
          acoes.push({
            id: "RECEBER_AUTOS",
            rotulo: "Assinar recebimento dos autos",
            ajuda: "Inicia o prazo de 5 dias úteis para elaboração do relatório.",
            principal: true,
          });
        } else {
          acoes.push({
            id: "REGISTRAR_INQUIRICAO",
            rotulo: "Lavrar termo de inquirição",
            ajuda: "Registrar oitiva do arrolado (Anexo H) ou de testemunha (Anexo Q).",
            principal: false,
          });
          acoes.push({
            id: "EMITIR_RELATORIO",
            rotulo: "Emitir relatório",
            ajuda: "Concluir a apuração e despachar com a autoridade competente.",
            principal: true,
          });
        }
      }
      break;

    case "AGUARDANDO_DESPACHO":
      if (perfil === "COMANDANTE") {
        acoes.push({
          id: "RECEBER_RELATORIO",
          rotulo: "Receber relatório",
          ajuda: "Assinar o recebimento e iniciar o prazo de 5 dias úteis para decidir.",
          principal: true,
        });
      }
      break;

    case "AGUARDANDO_DECISAO":
      if (perfil === "COMANDANTE") {
        acoes.push({
          id: "DECIDIR",
          rotulo: "Registrar decisão",
          ajuda: "Aplicar punição ou arquivar o processo (Anexo J).",
          principal: true,
        });
      }
      break;

    case "CIENCIA_DA_DECISAO":
      if (!p.cienciaDecisaoEm) {
        if (ehArroladoDoProcesso || perfil === "ADMIN") {
          acoes.push({
            id: "REGISTRAR_CIENCIA_DECISAO",
            rotulo: "Registrar ciência da decisão",
            ajuda: "Assinar a ciência da decisão e, havendo punição, da NPD.",
            principal: true,
          });
        }
      } else {
        if (ehArroladoDoProcesso && !vencido) {
          acoes.push({
            id: "PEDIR_RECONSIDERACAO",
            rotulo: "Pedir reconsideração",
            ajuda: "Interpor pedido de reconsideração da punição (Anexo M).",
            principal: true,
          });
        }
        if (perfil === "ADMIN" && vencido) {
          acoes.push({
            id: "ENCERRAR_POR_PRAZO",
            rotulo: "Encerrar processo",
            ajuda: "Prazo de reconsideração transcorrido sem pedido.",
            principal: true,
          });
        }
      }
      break;

    case "RECONSIDERACAO_EM_ANALISE":
      if (perfil === "COMANDANTE") {
        acoes.push({
          id: "JULGAR_RECONSIDERACAO",
          rotulo: "Julgar reconsideração",
          ajuda: "Decidir sobre o pedido e emitir nova decisão.",
          principal: true,
        });
      }
      break;

    case "CIENCIA_NOVA_DECISAO":
      if (ehArroladoDoProcesso || perfil === "ADMIN") {
        acoes.push({
          id: "REGISTRAR_CIENCIA_NOVA_DECISAO",
          rotulo: "Registrar ciência da nova decisão",
          ajuda: "Assinar a ciência do julgamento da reconsideração e encerrar o processo.",
          principal: true,
        });
      }
      break;

    case "FINALIZADO":
      break;
  }

  return acoes;
}
