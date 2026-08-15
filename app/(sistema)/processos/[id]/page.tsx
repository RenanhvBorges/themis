"use client";

import Link from "next/link";
import { use, useState } from "react";
import {
  Botao,
  BotaoLink,
  CabecalhoCartao,
  Cartao,
  Etiqueta,
  Rotulo,
  Valor,
} from "@/components/ui/base";
import { IconeBaixar, IconeVoltar } from "@/components/ui/icones";
import { Auditoria } from "@/components/processo/auditoria";
import { ChipPrazo, EtiquetaStatus } from "@/components/processo/indicadores-linha";
import { ListaDocumentos } from "@/components/processo/lista-documentos";
import { ModalAcao } from "@/components/processo/modal-acao";
import { Trilha } from "@/components/processo/trilha";
import { militarPorId, nomeCompleto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import { acoesDisponiveis, type AcaoDisponivel } from "@/lib/dominio/acoes";
import { ESTADOS } from "@/lib/dominio/estados";
import {
  DIAS_POR_PRAZO,
  diasUteisRestantes,
  formatarData,
  situacaoDoPrazo,
} from "@/lib/dominio/prazos";
import {
  CLASSIFICACOES,
  COMPORTAMENTOS,
  PUNICOES,
  rotularCircunstancia,
  rotularItem,
} from "@/lib/dominio/rdaer";
import { podeVer, ROTULO_PERFIL } from "@/lib/dominio/visibilidade";

const DESFECHO_RECONSIDERACAO = {
  DEFERIDO: "Deferido",
  PARCIALMENTE_DEFERIDO: "Deferido em parte",
  INDEFERIDO: "Indeferido",
} as const;

export default function DetalheProcesso({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { estado, conta, militar, hoje, pronto } = useStore();
  const [acaoAberta, setAcaoAberta] = useState<AcaoDisponivel | null>(null);

  const processo = estado.processos.find((p) => p.id === id);

  if (!pronto) return null;

  if (!processo || !podeVer(processo, conta.perfil, militar.id)) {
    return (
      <div className="mx-auto max-w-2xl">
        <Cartao>
          <CabecalhoCartao titulo="Processo não disponível" />
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm leading-relaxed text-neutral-700">
              Este PATD não existe ou está fora do seu perfil de acesso. A documentação
              do processo é classificada como informação pessoal de acesso restrito
              (Lei nº 12.527/2011, art. 31).
            </p>
            <BotaoLink href="/processos">
              <IconeVoltar className="size-4" />
              Voltar aos processos
            </BotaoLink>
          </div>
        </Cartao>
      </div>
    );
  }

  const arrolado = militarPorId(estado, processo.arroladoId);
  const apurador = militarPorId(estado, processo.apuradorId);
  const comandante = militarPorId(estado, processo.comandanteId);
  const acoes = acoesDisponiveis(processo, conta.perfil, militar.id, hoje);
  const def = ESTADOS[processo.status];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/processos"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-primary-700"
        >
          <IconeVoltar className="size-4" />
          Processos
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            PATD nº {processo.numero}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EtiquetaStatus processo={processo} />
            <ChipPrazo processo={processo} hoje={hoje} detalhado />
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            {processo.status === "FINALIZADO"
              ? `Encerrado em ${formatarData(processo.finalizadoEm)}.`
              : `Aguardando: ${def.aguardando}.`}
          </p>
        </div>
        <BotaoLink href={`/dossie/${processo.id}`} variante="secundaria">
          <IconeBaixar className="size-4" />
          Baixar dossiê (PDF)
        </BotaoLink>
      </header>

      {acoes.length ? (
        <Cartao className="border-primary-300 bg-primary-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Ação pendente para {ROTULO_PERFIL[conta.perfil]}
              </p>
              <p className="mt-0.5 text-sm text-neutral-700">
                {acoes.find((a) => a.principal)?.ajuda ?? acoes[0].ajuda}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {acoes.map((a) => (
                <Botao
                  key={a.id}
                  variante={a.principal ? "primaria" : "secundaria"}
                  onClick={() => setAcaoAberta(a)}
                >
                  {a.rotulo}
                </Botao>
              ))}
            </div>
          </div>
        </Cartao>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Cartao>
            <CabecalhoCartao titulo="Dados do processo" />
            <dl className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
              <div>
                <Rotulo>Militar arrolado</Rotulo>
                <Valor>
                  {nomeCompleto(arrolado)}
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    SARAM {arrolado?.saram} · {arrolado?.secao}
                    {arrolado
                      ? ` · comportamento ${COMPORTAMENTOS[arrolado.comportamento]}`
                      : ""}
                  </span>
                </Valor>
              </div>
              <div>
                <Rotulo>Oficial apurador</Rotulo>
                <Valor>
                  {apurador ? (
                    <>
                      {nomeCompleto(apurador)}
                      <span className="mt-0.5 block text-xs text-neutral-600">
                        SARAM {apurador.saram} · {apurador.secao}
                      </span>
                    </>
                  ) : (
                    <span className="text-neutral-500">
                      Ainda não designado — definido na autuação
                    </span>
                  )}
                </Valor>
              </div>
              <div>
                <Rotulo>Autoridade competente</Rotulo>
                <Valor>{nomeCompleto(comandante)}</Valor>
              </div>
              <div>
                <Rotulo>Documento de origem</Rotulo>
                <Valor>
                  {processo.origem.tipo === "OFICIO" ? "Ofício" : processo.origem.tipo}{" "}
                  nº {processo.origem.numero}
                  <span className="mt-0.5 block text-xs text-neutral-600">
                    {formatarData(processo.origem.data)}
                    {processo.origem.protocoloComaer
                      ? ` · Prot. COMAER ${processo.origem.protocoloComaer}`
                      : ""}
                  </span>
                </Valor>
              </div>
              <div className="sm:col-span-2">
                <Rotulo>Relato do fato</Rotulo>
                <Valor>
                  <span className="block leading-relaxed">{processo.relatoFato}</span>
                </Valor>
              </div>
              <div className="sm:col-span-2">
                <Rotulo>Enquadramento prévio — art. 10 do RDAER</Rotulo>
                <Valor>
                  {processo.itensArt10.length ? (
                    <ul className="space-y-1">
                      {processo.itensArt10.map((i) => (
                        <li key={i}>{rotularItem(i)}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-neutral-500">
                      A definir na autuação do processo
                    </span>
                  )}
                </Valor>
              </div>
            </dl>
          </Cartao>

          {processo.defesa ? (
            <Cartao>
              <CabecalhoCartao
                titulo="Alegações de defesa"
                descricao={
                  processo.defesa.apresentada
                    ? `Apresentadas em ${formatarData(processo.defesa.apresentadaEm)} — Anexo F`
                    : "Prazo transcorrido sem manifestação — Certidão de Preclusão (Anexo G)"
                }
              />
              {processo.defesa.texto ? (
                <p className="px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-neutral-800">
                  {processo.defesa.texto}
                </p>
              ) : (
                <p className="px-5 py-4 text-sm text-neutral-600">
                  O militar arrolado, devidamente cientificado, permaneceu inerte no prazo
                  de 5 dias úteis.
                </p>
              )}
            </Cartao>
          ) : null}

          {processo.inquiricoes.length ? (
            <Cartao>
              <CabecalhoCartao
                titulo="Termos de inquirição"
                descricao="Oitivas conduzidas pelo oficial apurador."
              />
              <ul className="divide-y divide-neutral-200">
                {processo.inquiricoes.map((inq) => (
                  <li key={inq.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-neutral-900">
                      {inq.postoInquirido} {inq.nomeInquirido}
                      <Etiqueta tom="neutro">
                        {inq.tipo === "ARROLADO" ? "Anexo H" : "Anexo Q"}
                      </Etiqueta>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      {inq.tipo === "ARROLADO" ? "Militar arrolado" : "Testemunha"} ·{" "}
                      {formatarData(inq.realizadaEm)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                      {inq.depoimento}
                    </p>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          {processo.relatorio ? (
            <Cartao>
              <CabecalhoCartao
                titulo="Relatório do oficial apurador"
                descricao={`Emitido em ${formatarData(processo.relatorio.emitidoEm)} — Anexo I`}
                acao={
                  <Etiqueta
                    tom={
                      processo.relatorio.conclusao === "PROCEDENTE" ? "aviso" : "sucesso"
                    }
                  >
                    {processo.relatorio.conclusao === "PROCEDENTE"
                      ? "Transgressão caracterizada"
                      : "Fatos justificados"}
                  </Etiqueta>
                }
              />
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-800">
                  {processo.relatorio.analise}
                </p>
                <dl className="grid gap-x-6 gap-y-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
                  {processo.relatorio.classificacao ? (
                    <div>
                      <Rotulo>Classificação</Rotulo>
                      <Valor>{CLASSIFICACOES[processo.relatorio.classificacao]}</Valor>
                    </div>
                  ) : null}
                  {processo.relatorio.propostaPunicao ? (
                    <div>
                      <Rotulo>Punição proposta</Rotulo>
                      <Valor>
                        {PUNICOES[processo.relatorio.propostaPunicao].rotulo}
                        {processo.relatorio.propostaDias
                          ? ` — ${processo.relatorio.propostaDias} dias`
                          : ""}
                      </Valor>
                    </div>
                  ) : (
                    <div>
                      <Rotulo>Proposta</Rotulo>
                      <Valor>Arquivamento (RDAER, art. 14)</Valor>
                    </div>
                  )}
                  {processo.relatorio.atenuantes.length ? (
                    <div>
                      <Rotulo>Atenuantes</Rotulo>
                      <Valor>
                        {processo.relatorio.atenuantes
                          .map(rotularCircunstancia)
                          .join("; ")}
                      </Valor>
                    </div>
                  ) : null}
                  {processo.relatorio.agravantes.length ? (
                    <div>
                      <Rotulo>Agravantes</Rotulo>
                      <Valor>
                        {processo.relatorio.agravantes
                          .map(rotularCircunstancia)
                          .join("; ")}
                      </Valor>
                    </div>
                  ) : null}
                </dl>
              </div>
            </Cartao>
          ) : null}

          {processo.decisao ? (
            <Cartao>
              <CabecalhoCartao
                titulo="Decisão da autoridade competente"
                descricao={`Exarada em ${formatarData(processo.decisao.decididoEm)} — Anexo J`}
                acao={
                  <Etiqueta
                    tom={processo.decisao.tipo === "PUNICAO" ? "perigo" : "sucesso"}
                  >
                    {processo.decisao.tipo === "PUNICAO"
                      ? "Punição aplicada"
                      : "Arquivamento"}
                  </Etiqueta>
                }
              />
              <div className="space-y-4 px-5 py-4">
                <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-800">
                  {processo.decisao.fundamentacao}
                </p>
                <dl className="grid gap-x-6 gap-y-3 border-t border-neutral-200 pt-4 sm:grid-cols-2">
                  <div>
                    <Rotulo>Manifestação sobre o relatório</Rotulo>
                    <Valor>
                      {processo.decisao.concordaComRelatorio
                        ? "Concorda com o relatório do apurador"
                        : "Diverge do relatório do apurador"}
                    </Valor>
                  </div>
                  {processo.decisao.punicao ? (
                    <div>
                      <Rotulo>Punição</Rotulo>
                      <Valor>
                        {PUNICOES[processo.decisao.punicao].rotulo}
                        {processo.decisao.dias ? ` — ${processo.decisao.dias} dias` : ""}
                      </Valor>
                    </div>
                  ) : null}
                  {processo.decisao.comportamentoResultante ? (
                    <div>
                      <Rotulo>Comportamento resultante</Rotulo>
                      <Valor>
                        {COMPORTAMENTOS[processo.decisao.comportamentoResultante]}
                      </Valor>
                    </div>
                  ) : null}
                  <div>
                    <Rotulo>Ciência do arrolado</Rotulo>
                    <Valor>
                      {processo.cienciaDecisaoEm
                        ? formatarData(processo.cienciaDecisaoEm)
                        : "Pendente"}
                    </Valor>
                  </div>
                </dl>
              </div>
            </Cartao>
          ) : null}

          {processo.reconsideracao ? (
            <Cartao>
              <CabecalhoCartao
                titulo="Pedido de reconsideração"
                descricao={`Interposto em ${formatarData(processo.reconsideracao.pedidoEm)} — Anexo M`}
                acao={
                  processo.reconsideracao.desfecho ? (
                    <Etiqueta
                      tom={
                        processo.reconsideracao.desfecho === "INDEFERIDO"
                          ? "neutro"
                          : "sucesso"
                      }
                    >
                      {DESFECHO_RECONSIDERACAO[processo.reconsideracao.desfecho]}
                    </Etiqueta>
                  ) : (
                    <Etiqueta tom="info">Em análise</Etiqueta>
                  )
                }
              />
              <div className="space-y-4 px-5 py-4">
                <div>
                  <Rotulo>Razões do militar arrolado</Rotulo>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-neutral-800">
                    {processo.reconsideracao.razoes}
                  </p>
                </div>
                {processo.reconsideracao.fundamentacao ? (
                  <div className="border-t border-neutral-200 pt-4">
                    <Rotulo>Julgamento da autoridade</Rotulo>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-neutral-800">
                      {processo.reconsideracao.fundamentacao}
                    </p>
                  </div>
                ) : null}
              </div>
            </Cartao>
          ) : null}
        </div>

        <div className="space-y-6">
          <Cartao>
            <CabecalhoCartao titulo="Trilha do processo" />
            <Trilha processo={processo} />
          </Cartao>

          <Cartao>
            <CabecalhoCartao titulo="Prazos" />
            {processo.prazos.length ? (
              <ul className="divide-y divide-neutral-200">
                {processo.prazos.map((pz) => {
                  const situacao = situacaoDoPrazo(pz, hoje);
                  const limite = pz.prorrogadoAte ?? pz.venceEm;
                  const restantes = diasUteisRestantes(limite, hoje);
                  return (
                    <li key={pz.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900">
                            {DIAS_POR_PRAZO[pz.tipo].rotulo}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-600">
                            {pz.quantidade}{" "}
                            {pz.contagem === "UTEIS" ? "dias úteis" : "dias corridos"} ·{" "}
                            {DIAS_POR_PRAZO[pz.tipo].base}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-600">
                            Início {formatarData(pz.inicioEm)} · limite{" "}
                            {formatarData(limite)}
                            {pz.prorrogadoAte ? " (prorrogado)" : ""}
                          </p>
                        </div>
                        <Etiqueta
                          tom={
                            situacao === "CUMPRIDO"
                              ? "sucesso"
                              : situacao === "VENCIDO"
                                ? "perigo"
                                : situacao === "EM_RISCO"
                                  ? "aviso"
                                  : "info"
                          }
                        >
                          {situacao === "CUMPRIDO"
                            ? "Cumprido"
                            : situacao === "VENCIDO"
                              ? "Vencido"
                              : restantes === 0
                                ? "Vence hoje"
                                : `${restantes} d. úteis`}
                        </Etiqueta>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-neutral-600">
                Nenhum prazo em curso — o primeiro começa com a ciência do arrolado.
              </p>
            )}
          </Cartao>

          <Cartao>
            <CabecalhoCartao
              titulo="Documentos dos autos"
              descricao="Cada peça é baixável em PDF."
            />
            <ListaDocumentos processo={processo} estado={estado} />
          </Cartao>

          <Cartao>
            <CabecalhoCartao
              titulo="Trilha de auditoria"
              descricao="Histórico imutável de todos os atos do processo."
            />
            <Auditoria processo={processo} estado={estado} />
          </Cartao>
        </div>
      </div>

      {acaoAberta ? (
        <ModalAcao
          processo={processo}
          acao={acaoAberta}
          aoFechar={() => setAcaoAberta(null)}
        />
      ) : null}
    </div>
  );
}
