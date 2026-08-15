"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { contaAtual } from "@/lib/auth/current";
import { podeAbrirProcesso, type Perfil } from "@/lib/domain/rbac";
import { AcaoError, prepararAcao } from "./_shared";
import * as t from "@/lib/domain/transicoes";
import { hashConteudo } from "@/lib/domain/assinatura";
import type {
  ConclusaoRelatorio,
  Classificacao,
  DesfechoReconsideracao,
  OrigemTipo,
  TipoDecisao,
  TipoInquiricao,
  TipoPunicao,
} from "@prisma/client";

export interface AcaoState {
  erro?: string;
  ok?: boolean;
}

async function comTratamento(fn: () => Promise<void>): Promise<AcaoState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof AcaoError) return { erro: e.message };
    throw e;
  }
  return { ok: true };
}

function revalidarProcesso(processoId: string) {
  revalidatePath(`/processos/${processoId}`);
  revalidatePath("/processos");
  revalidatePath("/painel");
}

function textoObrigatorio(formData: FormData, campo: string): string {
  const v = String(formData.get(campo) ?? "").trim();
  if (!v) throw new AcaoError(`Preencha o campo "${campo}".`);
  return v;
}

// ---------------------------------------------------------------------
// Abertura do processo
// ---------------------------------------------------------------------

async function proximoNumeroProcesso(omId: string, sigla: string): Promise<string> {
  const ano = new Date().getFullYear();
  const existentes = await prisma.processo.findMany({
    where: { omId, numero: { endsWith: `/${ano}` } },
    select: { numero: true },
  });
  let maior = 0;
  for (const p of existentes) {
    const n = Number(p.numero.split("/")[0]);
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return `${String(maior + 1).padStart(3, "0")}/${sigla}/${ano}`;
}

export async function criarProcessoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeAbrirProcesso(conta)) return { erro: "Apenas o Admin pode abrir processos." };

  const arroladoId = textoObrigatorio(formData, "arroladoId");
  const origemTipo = textoObrigatorio(formData, "origemTipo") as OrigemTipo;
  const origemNumero = textoObrigatorio(formData, "origemNumero");
  const origemDataStr = textoObrigatorio(formData, "origemData");
  const relatoFato = textoObrigatorio(formData, "relatoFato");

  const om = await prisma.organizacaoMilitar.findUniqueOrThrow({ where: { id: conta.omId } });
  const comandanteConta = await prisma.conta.findFirst({
    where: { perfisFuncionais: { has: "COMANDANTE" } },
    include: { militar: true },
  });
  const comandanteId = comandanteConta?.militarId ?? conta.militarId;

  let novoId = "";
  await comTratamento(async () => {
    const numero = await proximoNumeroProcesso(om.id, om.sigla);
    await prisma.$transaction(async (tx) => {
      const processo = await tx.processo.create({
        data: {
          numero,
          omId: om.id,
          arroladoId,
          comandanteId,
          abertoPorId: conta.militarId,
          origemTipo,
          origemNumero,
          origemData: new Date(`${origemDataStr}T00:00:00Z`),
          relatoFato,
          itensArt10: [],
        },
      });
      await tx.documento.create({
        data: { processoId: processo.id, anexo: "ORIGEM", titulo: "Documento de origem", dados: { numero: origemNumero } },
      });
      const hash = hashConteudo(`${processo.id}|abertura|${Date.now()}`);
      await tx.evento.create({
        data: {
          processoId: processo.id,
          autorId: conta.militarId,
          autorPerfil: "Admin",
          acao: "Abertura registrada",
          detalhe: `Documento de origem ${origemNumero} lançado no sistema.`,
          hash,
        },
      });
      novoId = processo.id;
    });
  });

  if (novoId) redirect(`/processos/${novoId}`);
  return { erro: "Não foi possível abrir o processo." };
}

// ---------------------------------------------------------------------
// Transições
// ---------------------------------------------------------------------

export async function autuarAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const apuradorId = textoObrigatorio(formData, "apuradorId");
  const itensArt10 = formData.getAll("itensArt10").map(String);
  const portaria = String(formData.get("portaria") ?? "");
  const boletim = String(formData.get("boletim") ?? "");
  if (itensArt10.length === 0) return { erro: "Selecione ao menos um item do art. 10 do RDAER." };

  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "AUTUAR", perfil);
    await prisma.$transaction((tx) => t.autuar(tx, processo, ctx, { apuradorId, itensArt10, portaria, boletim }));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function registrarCienciaAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "REGISTRAR_CIENCIA", perfil);
    await prisma.$transaction((tx) => t.registrarCiencia(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function registrarRecusaAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const justificativa = textoObrigatorio(formData, "justificativa");
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "REGISTRAR_RECUSA", perfil);
    await prisma.$transaction((tx) => t.registrarRecusaDeCiencia(tx, processo, ctx, justificativa));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function prorrogarDefesaAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const justificativa = textoObrigatorio(formData, "justificativa");
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "PRORROGAR_DEFESA", perfil);
    await prisma.$transaction((tx) => t.prorrogarPrazoDefesa(tx, processo, ctx, justificativa));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function apresentarDefesaAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const texto = textoObrigatorio(formData, "texto");
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "APRESENTAR_DEFESA", perfil);
    await prisma.$transaction((tx) => t.apresentarDefesa(tx, processo, ctx, texto));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function declararPreclusaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "DECLARAR_PRECLUSAO", perfil);
    await prisma.$transaction((tx) => t.declararPreclusao(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function receberAutosAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "RECEBER_AUTOS", perfil);
    await prisma.$transaction((tx) => t.receberAutos(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function registrarInquiricaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const tipo = textoObrigatorio(formData, "tipo") as TipoInquiricao;
  const nomeInquirido = textoObrigatorio(formData, "nomeInquirido");
  const postoInquirido = textoObrigatorio(formData, "postoInquirido");
  const texto = textoObrigatorio(formData, "texto");
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "REGISTRAR_INQUIRICAO", perfil);
    await prisma.$transaction((tx) => t.registrarInquiricao(tx, processo, ctx, { tipo, nomeInquirido, postoInquirido, texto }));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function emitirRelatorioAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const conclusao = textoObrigatorio(formData, "conclusao") as ConclusaoRelatorio;
  const classificacao = (String(formData.get("classificacao") ?? "") || null) as Classificacao | null;
  const itensConfirmados = formData.getAll("itensConfirmados").map(String);
  const recomendacaoPunicao = (String(formData.get("recomendacaoPunicao") ?? "") || null) as TipoPunicao | null;
  const recomendacaoDiasRaw = String(formData.get("recomendacaoDias") ?? "");
  const recomendacaoDias = recomendacaoDiasRaw ? Number(recomendacaoDiasRaw) : null;
  const atenuantes = formData.getAll("atenuantes").map(String);
  const agravantes = formData.getAll("agravantes").map(String);
  const fundamentacao = textoObrigatorio(formData, "fundamentacao");

  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "EMITIR_RELATORIO", perfil);
    await prisma.$transaction((tx) =>
      t.emitirRelatorio(tx, processo, ctx, {
        conclusao,
        classificacao,
        itensConfirmados,
        recomendacaoPunicao,
        recomendacaoDias,
        atenuantes,
        agravantes,
        fundamentacao,
      }),
    );
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function receberRelatorioAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "RECEBER_RELATORIO", perfil);
    await prisma.$transaction((tx) => t.receberRelatorio(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function decidirAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const tipo = textoObrigatorio(formData, "tipo") as TipoDecisao;
  const classificacao = (String(formData.get("classificacao") ?? "") || null) as Classificacao | null;
  const punicao = (String(formData.get("punicao") ?? "") || null) as TipoPunicao | null;
  const diasRaw = String(formData.get("dias") ?? "");
  const dias = diasRaw ? Number(diasRaw) : null;
  const atenuantes = formData.getAll("atenuantes").map(String);
  const agravantes = formData.getAll("agravantes").map(String);
  const fundamentacao = textoObrigatorio(formData, "fundamentacao");
  const concordaComRelatorio = String(formData.get("concordaComRelatorio") ?? "sim") === "sim";
  const comportamentoResultante = String(formData.get("comportamentoResultante") ?? "") || null;

  if (tipo === "PUNICAO" && !punicao) return { erro: "Selecione a punição aplicada." };

  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "DECIDIR", perfil);
    await prisma.$transaction((tx) =>
      t.decidir(tx, processo, ctx, { tipo, classificacao, punicao, dias, atenuantes, agravantes, fundamentacao, concordaComRelatorio, comportamentoResultante }),
    );
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function registrarCienciaDecisaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "REGISTRAR_CIENCIA_DECISAO", perfil);
    await prisma.$transaction((tx) => t.registrarCienciaDecisao(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function encerrarPorPrazoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "ENCERRAR_POR_PRAZO", perfil);
    await prisma.$transaction((tx) => t.encerrarPorDecursoDePrazo(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function pedirReconsideracaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const razoes = textoObrigatorio(formData, "razoes");
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "PEDIR_RECONSIDERACAO", perfil);
    await prisma.$transaction((tx) => t.pedirReconsideracao(tx, processo, ctx, razoes));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function julgarReconsideracaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const desfecho = textoObrigatorio(formData, "desfecho") as DesfechoReconsideracao;
  const fundamentacao = textoObrigatorio(formData, "fundamentacao");
  const punicao = (String(formData.get("punicao") ?? "") || null) as TipoPunicao | null;
  const diasRaw = String(formData.get("dias") ?? "");
  const dias = diasRaw ? Number(diasRaw) : null;

  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "JULGAR_RECONSIDERACAO", perfil);
    await prisma.$transaction((tx) => t.julgarReconsideracao(tx, processo, ctx, { desfecho, fundamentacao, punicao, dias }));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}

export async function registrarCienciaNovaDecisaoAction(_prev: AcaoState, formData: FormData): Promise<AcaoState> {
  const processoId = textoObrigatorio(formData, "processoId");
  const perfil = textoObrigatorio(formData, "perfil") as Perfil;
  const res = await comTratamento(async () => {
    const { processo, ctx } = await prepararAcao(processoId, "REGISTRAR_CIENCIA_NOVA_DECISAO", perfil);
    await prisma.$transaction((tx) => t.registrarCienciaNovaDecisao(tx, processo, ctx));
  });
  if (res.ok) revalidarProcesso(processoId);
  return res;
}
