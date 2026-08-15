import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { prisma } from "@/lib/prisma";
import { carregarProcessoDetalhe } from "@/lib/queries/processo-detalhe";
import { StatusChip, PrazoChip } from "@/components/chips";
import { Trilha } from "@/components/Trilha";
import { AcoesProcesso } from "@/components/AcoesProcesso";
import { Icon } from "@/components/icons";
import { ANEXOS, ITENS_ART10, ATENUANTES, AGRAVANTES, CLASSIFICACOES, PUNICOES, COMPORTAMENTOS } from "@/lib/domain/catalogo";
import { formatarData, formatarDataHora } from "@/lib/domain/prazos";

export default async function ProcessoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  const { id } = await params;

  const resultado = await carregarProcessoDetalhe(id, conta);
  if (!resultado) notFound();
  if (resultado.negado) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            A peça não existe ou está fora do seu perfil de acesso. A documentação do PATD é classificada como
            informação pessoal de acesso restrito (Lei nº 12.527/2011, art. 31).
          </p>
        </div>
      </div>
    );
  }
  const { processo, acoes, hoje } = resultado;

  const candidatosApurador = await prisma.militar.findMany({
    where: { omId: processo.omId },
    select: { id: true, nome: true, postoGrad: true, saram: true },
    orderBy: { nome: "asc" },
  });

  const houveReconsideracao = Boolean(processo.reconsideracao);

  return (
    <>
      <Link href="/processos" className="hstack" style={{ gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
        <Icon name="voltar" /> Voltar para processos
      </Link>

      <div className="page-head hstack between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1>{processo.numero}</h1>
          <p>Processo Administrativo de Transgressão Disciplinar</p>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <StatusChip status={processo.status} />
          <PrazoChip prazo={resultado.prazoAtivo ? { status: resultado.prazoAtivo.status, venceEm: resultado.prazoAtivo.venceEm.toISOString().slice(0, 10), prorrogadoAte: resultado.prazoAtivo.prorrogadoAte?.toISOString().slice(0, 10) ?? null, tipo: resultado.prazoAtivo.tipo } : null} hoje={hoje} detalhado />
        </div>
      </div>

      <AcoesProcesso
        processoId={processo.id}
        acoes={acoes}
        itensArt10={ITENS_ART10}
        atenuantes={ATENUANTES}
        agravantes={AGRAVANTES}
        candidatosApurador={candidatosApurador}
      />

      <div className="grid-5-3">
        <div className="vstack" style={{ gap: 22 }}>
          <div className="card">
            <div className="card-head">
              <h2>Dossiê</h2>
            </div>
            <div className="card-body">
              <dl className="def-grid">
                <div>
                  <dt>Militar arrolado</dt>
                  <dd>
                    {processo.arrolado.postoGrad} {processo.arrolado.nome}
                    <small>
                      SARAM {processo.arrolado.saram} · {processo.arrolado.secao}
                      {processo.arrolado.comportamento ? ` · comportamento ${COMPORTAMENTOS[processo.arrolado.comportamento]}` : ""}
                    </small>
                  </dd>
                </div>
                <div>
                  <dt>Oficial apurador</dt>
                  <dd>
                    {processo.apurador ? (
                      <>
                        {processo.apurador.postoGrad} {processo.apurador.nome}
                        <small>
                          SARAM {processo.apurador.saram} · {processo.apurador.secao}
                        </small>
                      </>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Ainda não designado — definido na autuação</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Documento de origem</dt>
                  <dd>
                    {processo.origemTipo === "OFICIO" ? "Ofício" : processo.origemTipo.replaceAll("_", " ")} nº {processo.origemNumero}
                    <small>{formatarData(processo.origemData.toISOString().slice(0, 10))}</small>
                  </dd>
                </div>
                <div>
                  <dt>Aberto por</dt>
                  <dd>
                    {processo.abertoPor.postoGrad} {processo.abertoPor.nome}
                    <small>{formatarData(processo.criadoEm.toISOString().slice(0, 10))}</small>
                  </dd>
                </div>
                <div className="full">
                  <dt>Relato do fato</dt>
                  <dd>{processo.relatoFato}</dd>
                </div>
                {processo.itensArt10.length ? (
                  <div className="full">
                    <dt>Enquadramento (art. 10, RDAER)</dt>
                    <dd>
                      {processo.itensArt10
                        .map((idx) => ITENS_ART10.find((i) => i.id === idx))
                        .filter(Boolean)
                        .map((it) => `Item ${it!.numero} — ${it!.resumo}`)
                        .join("; ")}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          {processo.defesa ? (
            <div className="card">
              <div className="card-head">
                <h2>Defesa</h2>
              </div>
              <div className="card-body vstack" style={{ gap: 6 }}>
                {processo.defesa.preclusa ? (
                  <p style={{ fontSize: 13 }}>Prazo transcorrido sem apresentação de defesa — preclusão certificada.</p>
                ) : (
                  <>
                    <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{processo.defesa.texto}</p>
                    <span className="hint">Apresentada em {formatarData(processo.defesa.apresentadaEm?.toISOString().slice(0, 10))}</span>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {processo.relatorio ? (
            <div className="card">
              <div className="card-head">
                <h2>Relatório do apurador</h2>
              </div>
              <div className="card-body vstack" style={{ gap: 6 }}>
                <span className={`chip tone-${processo.relatorio.conclusao === "PROCEDENTE" ? "aviso" : "sucesso"}`} style={{ alignSelf: "flex-start" }}>
                  {processo.relatorio.conclusao === "PROCEDENTE" ? "Procedente" : "Improcedente"}
                </span>
                {processo.relatorio.classificacao ? <p style={{ fontSize: 13 }}>Classificação: {CLASSIFICACOES[processo.relatorio.classificacao]}</p> : null}
                {processo.relatorio.recomendacaoPunicao ? (
                  <p style={{ fontSize: 13 }}>
                    Punição recomendada: {PUNICOES[processo.relatorio.recomendacaoPunicao].rotulo}
                    {processo.relatorio.recomendacaoDias ? ` — ${processo.relatorio.recomendacaoDias} dia(s)` : ""}
                  </p>
                ) : null}
                <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{processo.relatorio.fundamentacao}</p>
              </div>
            </div>
          ) : null}

          {processo.decisao ? (
            <div className="card">
              <div className="card-head">
                <h2>Decisão</h2>
              </div>
              <div className="card-body vstack" style={{ gap: 6 }}>
                <span className={`chip tone-${processo.decisao.tipo === "PUNICAO" ? "perigo" : "sucesso"}`} style={{ alignSelf: "flex-start" }}>
                  {processo.decisao.tipo === "PUNICAO" ? "Punição aplicada" : "Arquivado"}
                </span>
                {processo.decisao.punicao ? (
                  <p style={{ fontSize: 13 }}>
                    {PUNICOES[processo.decisao.punicao].rotulo}
                    {processo.decisao.dias ? ` — ${processo.decisao.dias} dia(s)` : ""}
                  </p>
                ) : null}
                <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{processo.decisao.fundamentacao}</p>
                <span className="hint">
                  {processo.decisao.decididoPor.postoGrad} {processo.decisao.decididoPor.nome} · {formatarData(processo.decisao.decididoEm.toISOString().slice(0, 10))}
                </span>
              </div>
            </div>
          ) : null}

          {processo.reconsideracao ? (
            <div className="card">
              <div className="card-head">
                <h2>Pedido de reconsideração</h2>
              </div>
              <div className="card-body vstack" style={{ gap: 6 }}>
                <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{processo.reconsideracao.razoes}</p>
                {processo.reconsideracao.desfecho ? (
                  <>
                    <span className="chip tone-info" style={{ alignSelf: "flex-start" }}>
                      {processo.reconsideracao.desfecho.replaceAll("_", " ")}
                    </span>
                    <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{processo.reconsideracao.fundamentacao}</p>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {processo.inquiricoes.length ? (
            <div className="card">
              <div className="card-head">
                <h2>Inquirições</h2>
              </div>
              <div className="divide">
                {processo.inquiricoes.map((inq) => (
                  <div key={inq.id} className="card-body">
                    <p style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {inq.postoInquirido} {inq.nomeInquirido} — {inq.tipo === "ARROLADO" ? "Militar arrolado" : "Testemunha"}
                    </p>
                    <p style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{inq.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="vstack" style={{ gap: 22 }}>
          <div className="card">
            <div className="card-head">
              <h2>Andamento</h2>
            </div>
            <Trilha
              status={processo.status}
              houveReconsideracao={houveReconsideracao}
              datas={{
                PARA_ABERTURA: processo.criadoEm,
                A_CIENTIFICAR: processo.autuadoEm,
                AGUARDANDO_DEFESA: processo.cienciaEm,
                EM_APURACAO: processo.defesa?.apresentadaEm,
                AGUARDANDO_DESPACHO: processo.relatorio?.emitidoEm,
                AGUARDANDO_DECISAO: processo.recebidoComandanteEm,
                CIENCIA_DA_DECISAO: processo.decisao?.decididoEm,
                RECONSIDERACAO_EM_ANALISE: processo.reconsideracao?.pedidoEm,
                CIENCIA_NOVA_DECISAO: processo.reconsideracao?.decididoEm,
                FINALIZADO: processo.finalizadoEm,
              }}
            />
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Documentos</h2>
            </div>
            <div className="divide">
              {processo.documentos.length === 0 ? (
                <div className="empty">Nenhum documento gerado ainda.</div>
              ) : (
                processo.documentos.map((doc) => (
                  <Link key={doc.id} href={`/processos/${processo.id}/documentos/${doc.id}`} className="doc-row">
                    <Icon name="documento" className="file" />
                    <div className="grow">
                      <div className="ttl">{ANEXOS[doc.anexo]?.titulo ?? doc.titulo}</div>
                      <div className="meta">{formatarDataHora(doc.criadoEm.toISOString())}</div>
                      {doc.assinaturas.length ? (
                        <div className="sig-line">
                          <Icon name="check" />
                          {doc.assinaturas.length} assinatura(s)
                        </div>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Trilha de auditoria</h2>
            </div>
            <div className="divide">
              {processo.eventos.map((ev) => (
                <div key={ev.id} className="evt-row">
                  <div className="top">
                    <span className="acao">{ev.acao}</span>
                    <time>{formatarDataHora(ev.em.toISOString())}</time>
                  </div>
                  <div className="detalhe">{ev.detalhe}</div>
                  <div className="autor">
                    {ev.autor.postoGrad} {ev.autor.nome} · {ev.autorPerfil}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
