// Transições do PATD.
//
// Cada função recebe um cliente de transação Prisma, o processo já
// carregado e um contexto de autoria, e produz as escritas necessárias:
// documento gerado, assinatura lançada, prazo aberto/cumprido, evento de
// auditoria registrado e o novo status do processo. Porta fielmente as
// regras do artefato de referência (RDAER / ICA 111-6), mas persiste em
// banco em vez de devolver um novo objeto em memória.

import type { AnexoTipo, Prisma, PrazoTipo } from "@prisma/client";
import { ANEXOS } from "./catalogo";
import { DIAS_POR_PRAZO, calcularVencimentoPrazo, prorrogarVencimento } from "./prazos";
import { conteudoParaAssinar, gerarProtocolo, hashConteudo } from "./assinatura";

type Tx = Prisma.TransactionClient;

export interface Ctx {
  /** Militar que pratica o ato. */
  autorId: string;
  /** Rótulo do perfil sob o qual o ato é praticado (trilha de auditoria). */
  autorPerfil: string;
  /** Instante completo do ato. */
  em: Date;
  /** Data civil (ISO, America/Sao_Paulo) usada para contagem de prazos. */
  data: string;
}

async function criarDocumento(tx: Tx, processoId: string, anexo: AnexoTipo, dados: unknown = {}) {
  return tx.documento.create({
    data: { processoId, anexo, titulo: ANEXOS[anexo]!.titulo, dados: dados as Prisma.InputJsonValue },
  });
}

async function assinar(tx: Tx, documento: { id: string; processoId: string; anexo: string; dados: unknown }, signatarioId: string, papel: string, em: Date) {
  const conteudo = conteudoParaAssinar({ documentoId: documento.id, processoId: documento.processoId, anexo: documento.anexo, dados: documento.dados });
  return tx.assinatura.create({
    data: {
      documentoId: documento.id,
      signatarioId,
      papel,
      assinadoEm: em,
      hash: hashConteudo(conteudo),
      protocolo: gerarProtocolo(),
    },
  });
}

async function registrarEvento(tx: Tx, processoId: string, ctx: Ctx, acao: string, detalhe: string) {
  const hash = hashConteudo(`${processoId}|${acao}|${ctx.em.toISOString()}|${ctx.autorId}`);
  return tx.evento.create({
    data: { processoId, em: ctx.em, autorId: ctx.autorId, autorPerfil: ctx.autorPerfil, acao, detalhe, hash },
  });
}

async function abrirPrazo(tx: Tx, processoId: string, tipo: PrazoTipo, inicioEm: string) {
  const venceEm = calcularVencimentoPrazo(tipo, inicioEm);
  const regra = DIAS_POR_PRAZO[tipo];
  return tx.prazo.create({
    data: {
      processoId,
      tipo,
      inicioEm: new Date(`${inicioEm}T00:00:00Z`),
      venceEm: new Date(`${venceEm}T00:00:00Z`),
      contagem: regra.contagem,
      quantidade: regra.quantidade,
      status: "EM_CURSO",
    },
  });
}

async function cumprirPrazo(tx: Tx, processoId: string, tipo: PrazoTipo, em: string) {
  await tx.prazo.updateMany({
    where: { processoId, tipo, status: { not: "CUMPRIDO" } },
    data: { status: "CUMPRIDO", cumpridoEm: new Date(`${em}T00:00:00Z`) },
  });
}

// -------------------------------------------------------------------------

export interface DadosAutuacao {
  apuradorId: string;
  itensArt10: string[];
  portaria: string;
  boletim: string;
}

export async function autuar(tx: Tx, processo: { id: string; comandanteId: string }, ctx: Ctx, d: DadosAutuacao) {
  await tx.processo.update({
    where: { id: processo.id },
    data: { status: "A_CIENTIFICAR", apuradorId: d.apuradorId, itensArt10: d.itensArt10, autuadoEm: new Date(`${ctx.data}T00:00:00Z`) },
  });
  await criarDocumento(tx, processo.id, "C");
  const despacho = await criarDocumento(tx, processo.id, "B", { portaria: d.portaria, boletim: d.boletim });
  await assinar(tx, despacho, processo.comandanteId, "Autoridade competente", ctx.em);
  const fatd = await criarDocumento(tx, processo.id, "D");
  await assinar(tx, fatd, d.apuradorId, "Oficial Apurador", ctx.em);
  await registrarEvento(tx, processo.id, ctx, "Autuação", "Processo autuado, apurador designado e FATD emitido para ciência do arrolado.");
}

export async function registrarCiencia(tx: Tx, processo: { id: string; arroladoId: string }, ctx: Ctx) {
  const fatd = await tx.documento.findFirst({ where: { processoId: processo.id, anexo: "D" } });
  if (fatd) await assinar(tx, fatd, processo.arroladoId, "Militar Arrolado", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "AGUARDANDO_DEFESA", cienciaEm: new Date(`${ctx.data}T00:00:00Z`) } });
  await abrirPrazo(tx, processo.id, "DEFESA", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Ciência do arrolado", "Ciência registrada no FATD. Prazo de 5 dias úteis para alegações de defesa iniciado.");
}

export async function registrarRecusaDeCiencia(tx: Tx, processo: { id: string }, ctx: Ctx, justificativa: string) {
  const certidao = await criarDocumento(tx, processo.id, "E", { justificativa });
  await assinar(tx, certidao, ctx.autorId, "Oficial Apurador", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "AGUARDANDO_DEFESA", cienciaEm: new Date(`${ctx.data}T00:00:00Z`) } });
  await abrirPrazo(tx, processo.id, "DEFESA", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Recusa de ciência certificada", `Certidão de Recusa de Ciência lavrada. ${justificativa}`);
}

export async function prorrogarPrazoDefesa(tx: Tx, processo: { id: string }, ctx: Ctx, justificativa: string) {
  const prazo = await tx.prazo.findFirst({ where: { processoId: processo.id, tipo: "DEFESA", status: { not: "CUMPRIDO" } } });
  if (prazo) {
    const venceEmISO = prazo.venceEm.toISOString().slice(0, 10);
    const prorrogadoAte = prorrogarVencimento(venceEmISO, 5);
    await tx.prazo.update({ where: { id: prazo.id }, data: { status: "PRORROGADO", prorrogadoAte: new Date(`${prorrogadoAte}T00:00:00Z`) } });
  }
  await registrarEvento(tx, processo.id, ctx, "Prorrogação do prazo de defesa", `Prazo prorrogado por 5 dias úteis. Justificativa: ${justificativa}`);
}

export async function apresentarDefesa(tx: Tx, processo: { id: string; arroladoId: string }, ctx: Ctx, texto: string) {
  const folha = await criarDocumento(tx, processo.id, "F", { texto });
  await assinar(tx, folha, processo.arroladoId, "Militar Arrolado", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "EM_APURACAO" } });
  await tx.defesa.upsert({
    where: { processoId: processo.id },
    create: { processoId: processo.id, apresentada: true, texto, apresentadaEm: new Date(`${ctx.data}T00:00:00Z`) },
    update: { apresentada: true, texto, apresentadaEm: new Date(`${ctx.data}T00:00:00Z`) },
  });
  await cumprirPrazo(tx, processo.id, "DEFESA", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Alegações de defesa apresentadas", "Defesa juntada aos autos. Processo segue para o oficial apurador.");
}

export async function declararPreclusao(tx: Tx, processo: { id: string }, ctx: Ctx) {
  const certidao = await criarDocumento(tx, processo.id, "G");
  await assinar(tx, certidao, ctx.autorId, "Oficial Apurador", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "EM_APURACAO" } });
  await tx.defesa.upsert({
    where: { processoId: processo.id },
    create: { processoId: processo.id, apresentada: false, preclusa: true },
    update: { apresentada: false, preclusa: true },
  });
  await cumprirPrazo(tx, processo.id, "DEFESA", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Preclusão certificada", "Transcorrido o prazo de defesa sem manifestação. Certidão de Preclusão lavrada.");
}

export async function receberAutos(tx: Tx, processo: { id: string }, ctx: Ctx) {
  await tx.processo.update({ where: { id: processo.id }, data: { recebidoApuradorEm: new Date(`${ctx.data}T00:00:00Z`) } });
  await abrirPrazo(tx, processo.id, "RELATORIO", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Recebimento dos autos", "Oficial apurador assinou o recebimento. Prazo de 5 dias úteis para o relatório iniciado.");
}

export interface DadosInquiricao {
  tipo: "ARROLADO" | "TESTEMUNHA";
  nomeInquirido: string;
  postoInquirido: string;
  texto: string;
}

export async function registrarInquiricao(tx: Tx, processo: { id: string }, ctx: Ctx, d: DadosInquiricao) {
  const inquiricao = await tx.inquiricao.create({
    data: {
      processoId: processo.id,
      tipo: d.tipo,
      nomeInquirido: d.nomeInquirido,
      postoInquirido: d.postoInquirido,
      texto: d.texto,
      autorId: ctx.autorId,
    },
  });
  const anexoId: AnexoTipo = d.tipo === "ARROLADO" ? "H" : "Q";
  const doc = await criarDocumento(tx, processo.id, anexoId, { inquiricaoId: inquiricao.id });
  await assinar(tx, doc, ctx.autorId, "Oficial Apurador", ctx.em);
  await registrarEvento(
    tx,
    processo.id,
    ctx,
    "Termo de inquirição lavrado",
    `Inquirição de ${d.postoInquirido} ${d.nomeInquirido} (${d.tipo === "ARROLADO" ? "militar arrolado" : "testemunha"}).`,
  );
}

export interface DadosRelatorio {
  conclusao: "PROCEDENTE" | "IMPROCEDENTE";
  classificacao?: "LEVE" | "MEDIA" | "GRAVE" | null;
  itensConfirmados: string[];
  recomendacaoPunicao?: string | null;
  recomendacaoDias?: number | null;
  atenuantes: string[];
  agravantes: string[];
  fundamentacao: string;
}

export async function emitirRelatorio(tx: Tx, processo: { id: string }, ctx: Ctx, d: DadosRelatorio) {
  const doc = await criarDocumento(tx, processo.id, "I");
  await assinar(tx, doc, ctx.autorId, "Oficial Apurador", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "AGUARDANDO_DESPACHO" } });
  await tx.relatorioApuracao.upsert({
    where: { processoId: processo.id },
    create: {
      processoId: processo.id,
      conclusao: d.conclusao,
      classificacao: d.classificacao ?? null,
      itensConfirmados: d.itensConfirmados,
      recomendacaoPunicao: (d.recomendacaoPunicao as never) ?? null,
      recomendacaoDias: d.recomendacaoDias ?? null,
      atenuantes: d.atenuantes,
      agravantes: d.agravantes,
      fundamentacao: d.fundamentacao,
      emitidoEm: new Date(`${ctx.data}T00:00:00Z`),
    },
    update: {
      conclusao: d.conclusao,
      classificacao: d.classificacao ?? null,
      itensConfirmados: d.itensConfirmados,
      recomendacaoPunicao: (d.recomendacaoPunicao as never) ?? null,
      recomendacaoDias: d.recomendacaoDias ?? null,
      atenuantes: d.atenuantes,
      agravantes: d.agravantes,
      fundamentacao: d.fundamentacao,
      emitidoEm: new Date(`${ctx.data}T00:00:00Z`),
    },
  });
  await cumprirPrazo(tx, processo.id, "RELATORIO", ctx.data);
  await registrarEvento(
    tx,
    processo.id,
    ctx,
    "Relatório emitido",
    d.conclusao === "PROCEDENTE" ? "Apurador concluiu pela procedência e propôs punição." : "Apurador concluiu pela improcedência e propôs o arquivamento.",
  );
}

export async function receberRelatorio(tx: Tx, processo: { id: string }, ctx: Ctx) {
  await tx.processo.update({ where: { id: processo.id }, data: { status: "AGUARDANDO_DECISAO", recebidoComandanteEm: new Date(`${ctx.data}T00:00:00Z`) } });
  await abrirPrazo(tx, processo.id, "DECISAO", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Recebimento do relatório", "Autoridade competente recebeu os autos. Prazo de 5 dias úteis para decisão iniciado.");
}

export interface DadosDecisao {
  tipo: "PUNICAO" | "ARQUIVAMENTO";
  classificacao?: "LEVE" | "MEDIA" | "GRAVE" | null;
  punicao?: string | null;
  dias?: number | null;
  atenuantes: string[];
  agravantes: string[];
  fundamentacao: string;
  concordaComRelatorio: boolean;
  comportamentoResultante?: string | null;
}

export async function decidir(tx: Tx, processo: { id: string }, ctx: Ctx, d: DadosDecisao) {
  const decisaoDoc = await criarDocumento(tx, processo.id, "J");
  await assinar(tx, decisaoDoc, ctx.autorId, "Autoridade competente", ctx.em);
  if (d.tipo === "PUNICAO") {
    const npd = await criarDocumento(tx, processo.id, "K");
    await assinar(tx, npd, ctx.autorId, "Autoridade competente", ctx.em);
  }
  await tx.processo.update({ where: { id: processo.id }, data: { status: "CIENCIA_DA_DECISAO" } });
  await tx.decisao.upsert({
    where: { processoId: processo.id },
    create: {
      processoId: processo.id,
      tipo: d.tipo,
      classificacao: d.classificacao ?? null,
      punicao: (d.punicao as never) ?? null,
      dias: d.dias ?? null,
      atenuantes: d.atenuantes,
      agravantes: d.agravantes,
      fundamentacao: d.fundamentacao,
      concordaComRelatorio: d.concordaComRelatorio,
      comportamentoResultante: (d.comportamentoResultante as never) ?? null,
      decididoPorId: ctx.autorId,
      decididoEm: new Date(`${ctx.data}T00:00:00Z`),
    },
    update: {
      tipo: d.tipo,
      classificacao: d.classificacao ?? null,
      punicao: (d.punicao as never) ?? null,
      dias: d.dias ?? null,
      atenuantes: d.atenuantes,
      agravantes: d.agravantes,
      fundamentacao: d.fundamentacao,
      concordaComRelatorio: d.concordaComRelatorio,
      comportamentoResultante: (d.comportamentoResultante as never) ?? null,
      decididoPorId: ctx.autorId,
      decididoEm: new Date(`${ctx.data}T00:00:00Z`),
      ehJulgamentoReconsideracao: false,
    },
  });
  await cumprirPrazo(tx, processo.id, "DECISAO", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Decisão da autoridade", d.tipo === "PUNICAO" ? "Decidido pela aplicação de punição disciplinar. NPD emitida." : "Decidido pelo arquivamento do processo.");
}

export async function registrarCienciaDecisao(tx: Tx, processo: { id: string; arroladoId: string }, ctx: Ctx) {
  const decisao = await tx.decisao.findUnique({ where: { processoId: processo.id } });
  const docsParaAssinar = await tx.documento.findMany({ where: { processoId: processo.id, anexo: { in: ["J", "K"] } } });
  for (const doc of docsParaAssinar) await assinar(tx, doc, processo.arroladoId, "Militar Arrolado", ctx.em);

  const punido = decisao?.tipo === "PUNICAO";
  if (punido) {
    await tx.processo.update({ where: { id: processo.id }, data: { cienciaDecisaoEm: new Date(`${ctx.data}T00:00:00Z`) } });
    await abrirPrazo(tx, processo.id, "RECONSIDERACAO", ctx.data);
    await registrarEvento(tx, processo.id, ctx, "Ciência da decisão", "Arrolado assinou a ciência da decisão e da NPD. Prazo de 15 dias para reconsideração iniciado.");
  } else {
    await tx.processo.update({
      where: { id: processo.id },
      data: { cienciaDecisaoEm: new Date(`${ctx.data}T00:00:00Z`), status: "FINALIZADO", finalizadoEm: new Date(`${ctx.data}T00:00:00Z`) },
    });
    await registrarEvento(tx, processo.id, ctx, "Ciência da decisão", "Arrolado assinou a ciência do arquivamento. Processo encerrado.");
  }
}

export async function pedirReconsideracao(tx: Tx, processo: { id: string; arroladoId: string }, ctx: Ctx, razoes: string) {
  const doc = await criarDocumento(tx, processo.id, "M", { razoes });
  await assinar(tx, doc, processo.arroladoId, "Militar Arrolado", ctx.em);
  await tx.processo.update({ where: { id: processo.id }, data: { status: "RECONSIDERACAO_EM_ANALISE" } });
  await tx.pedidoReconsideracao.upsert({
    where: { processoId: processo.id },
    create: { processoId: processo.id, razoes, pedidoEm: new Date(`${ctx.data}T00:00:00Z`) },
    update: { razoes, pedidoEm: new Date(`${ctx.data}T00:00:00Z`) },
  });
  await cumprirPrazo(tx, processo.id, "RECONSIDERACAO", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Pedido de reconsideração", "Arrolado interpôs pedido de reconsideração da punição aplicada.");
}

export interface DadosJulgamentoReconsideracao {
  desfecho: "DEFERIDO" | "PARCIALMENTE_DEFERIDO" | "INDEFERIDO";
  fundamentacao: string;
  punicao?: string | null;
  dias?: number | null;
}

export async function julgarReconsideracao(tx: Tx, processo: { id: string }, ctx: Ctx, d: DadosJulgamentoReconsideracao) {
  const doc = await criarDocumento(tx, processo.id, "J", { reconsideracao: "sim" });
  await assinar(tx, doc, ctx.autorId, "Autoridade competente", ctx.em);

  const virouArquivamento = d.desfecho === "DEFERIDO";
  if (!virouArquivamento && d.punicao) {
    const npd = await criarDocumento(tx, processo.id, "K", { reconsideracao: "sim" });
    await assinar(tx, npd, ctx.autorId, "Autoridade competente", ctx.em);
  }

  await tx.processo.update({ where: { id: processo.id }, data: { status: "CIENCIA_NOVA_DECISAO" } });
  await tx.pedidoReconsideracao.update({
    where: { processoId: processo.id },
    data: { desfecho: d.desfecho, fundamentacao: d.fundamentacao, decididoEm: new Date(`${ctx.data}T00:00:00Z`) },
  });
  const decisaoAnterior = await tx.decisao.findUnique({ where: { processoId: processo.id } });
  await tx.decisao.update({
    where: { processoId: processo.id },
    data: {
      tipo: virouArquivamento ? "ARQUIVAMENTO" : "PUNICAO",
      punicao: virouArquivamento ? null : ((d.punicao ?? decisaoAnterior?.punicao) as never),
      dias: virouArquivamento ? null : (d.dias ?? decisaoAnterior?.dias),
      fundamentacao: d.fundamentacao,
      decididoPorId: ctx.autorId,
      decididoEm: new Date(`${ctx.data}T00:00:00Z`),
      ehJulgamentoReconsideracao: true,
    },
  });
  await registrarEvento(tx, processo.id, ctx, "Julgamento da reconsideração", `Pedido de reconsideração ${d.desfecho.toLowerCase().replace(/_/g, " ")}.`);
}

export async function registrarCienciaNovaDecisao(tx: Tx, processo: { id: string; arroladoId: string }, ctx: Ctx) {
  const reconsideracao = await tx.pedidoReconsideracao.findUnique({ where: { processoId: processo.id } });
  const docs = await tx.documento.findMany({ where: { processoId: processo.id, anexo: { in: ["J", "K"] } } });
  const relevantes = docs.filter((d) => (d.dados as { reconsideracao?: string })?.reconsideracao === "sim");
  for (const doc of relevantes) await assinar(tx, doc, processo.arroladoId, "Militar Arrolado", ctx.em);
  void reconsideracao;
  await tx.processo.update({
    where: { id: processo.id },
    data: { status: "FINALIZADO", cienciaNovaDecisaoEm: new Date(`${ctx.data}T00:00:00Z`), finalizadoEm: new Date(`${ctx.data}T00:00:00Z`) },
  });
  await registrarEvento(tx, processo.id, ctx, "Ciência da nova decisão", "Arrolado assinou a ciência do julgamento da reconsideração. Processo encerrado.");
}

export async function encerrarPorDecursoDePrazo(tx: Tx, processo: { id: string }, ctx: Ctx) {
  await tx.processo.update({ where: { id: processo.id }, data: { status: "FINALIZADO", finalizadoEm: new Date(`${ctx.data}T00:00:00Z`) } });
  await cumprirPrazo(tx, processo.id, "RECONSIDERACAO", ctx.data);
  await registrarEvento(tx, processo.id, ctx, "Encerramento por decurso de prazo", "Transcorridos 15 dias da ciência sem pedido de reconsideração. Processo encerrado.");
}
