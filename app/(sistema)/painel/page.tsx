"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cartao, CabecalhoCartao, Etiqueta, Vazio } from "@/components/ui/base";
import { Barras, Kpi, Rosca } from "@/components/painel/graficos";
import {
  IconeAlerta,
  IconeCheck,
  IconeProcessos,
  IconeRelogio,
} from "@/components/ui/icones";
import { militarPorId, nomeCurto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import { voltarDiasCorridos } from "@/lib/dados/util";
import { ESTADOS } from "@/lib/dominio/estados";
import { calcularIndicadores } from "@/lib/dominio/indicadores";
import {
  DIAS_POR_PRAZO,
  diasUteisRestantes,
  formatarData,
} from "@/lib/dominio/prazos";
import { AVISO_CATALOGO } from "@/lib/dominio/rdaer";
import { podeVerPainel, processosVisiveis } from "@/lib/dominio/visibilidade";
import { cn } from "@/lib/ui";

const PERIODOS = [
  { id: "30", rotulo: "30 dias", dias: 30 },
  { id: "90", rotulo: "90 dias", dias: 90 },
  { id: "365", rotulo: "12 meses", dias: 365 },
  { id: "tudo", rotulo: "Todo o período", dias: null },
] as const;

export default function Painel() {
  const { estado, conta, hoje } = useStore();
  const [periodo, setPeriodo] = useState<string>("90");

  const visiveis = useMemo(
    () => processosVisiveis(estado, conta),
    [estado, conta],
  );

  const filtrados = useMemo(() => {
    const def = PERIODOS.find((p) => p.id === periodo);
    if (!def?.dias) return visiveis;
    const corte = voltarDiasCorridos(hoje, def.dias);
    return visiveis.filter((p) => p.abertoEm >= corte);
  }, [visiveis, periodo, hoje]);

  const ind = useMemo(
    () => calcularIndicadores(filtrados, hoje),
    [filtrados, hoje],
  );

  if (!podeVerPainel(conta.perfil)) {
    return (
      <div className="mx-auto max-w-2xl">
        <Cartao>
          <CabecalhoCartao titulo="Acesso restrito" />
          <p className="px-5 py-6 text-sm leading-relaxed text-neutral-700">
            O painel de indicadores é de acesso exclusivo do Comandante. Os dados
            agregados podem permitir identificar militares em processos aos quais este
            perfil não tem acesso (Lei nº 12.527/2011, art. 31).
          </p>
        </Cartao>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Painel do Comandante
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {estado.om.sigla} — {estado.om.nome}. Indicadores derivados diretamente
            dos processos em tramitação.
          </p>
        </div>
        <div
          className="flex rounded-md border border-neutral-300 bg-white p-0.5"
          role="group"
          aria-label="Período"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriodo(p.id)}
              aria-pressed={periodo === p.id}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                periodo === p.id
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Em andamento"
          valor={ind.emAndamento}
          detalhe={`${ind.total} processos no período`}
          Icone={IconeProcessos}
        />
        <Kpi
          rotulo="Prazos vencidos"
          valor={ind.vencidos}
          tom={ind.vencidos > 0 ? "perigo" : "sucesso"}
          detalhe={ind.vencidos > 0 ? "Exigem providência imediata" : "Nenhum prazo estourado"}
          Icone={IconeAlerta}
        />
        <Kpi
          rotulo="Prazos em risco"
          valor={ind.emRisco}
          tom={ind.emRisco > 0 ? "aviso" : "sucesso"}
          detalhe="Vencem em até 2 dias úteis"
          Icone={IconeRelogio}
        />
        <Kpi
          rotulo="Tempo médio"
          valor={ind.tempoMedioDias ?? "—"}
          unidade={ind.tempoMedioDias === null ? undefined : "dias"}
          detalhe={`Da abertura ao encerramento · ${ind.finalizados} finalizados`}
          Icone={IconeCheck}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Cartao className="lg:col-span-3">
          <CabecalhoCartao
            titulo="Prazos que exigem atenção"
            descricao="Ordenados por criticidade e data de vencimento."
          />
          {ind.prazosCriticos.length ? (
            <ul className="divide-y divide-neutral-200">
              {ind.prazosCriticos.map(({ processo, prazo, situacao, responsavel }) => {
                const limite = prazo.prorrogadoAte ?? prazo.venceEm;
                const restantes = diasUteisRestantes(limite, hoje);
                return (
                  <li key={prazo.id}>
                    <Link
                      href={`/processos/${processo.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-primary-50"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                          PATD nº {processo.numero}
                          <Etiqueta tom={situacao === "VENCIDO" ? "perigo" : "aviso"} ponto>
                            {situacao === "VENCIDO" ? "Vencido" : "Em risco"}
                          </Etiqueta>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-neutral-600">
                          {DIAS_POR_PRAZO[prazo.tipo].rotulo} · vence em{" "}
                          {formatarData(limite)} ·{" "}
                          {nomeCurto(militarPorId(estado, processo.arroladoId))}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            situacao === "VENCIDO"
                              ? "text-danger-text"
                              : "text-warning-text",
                          )}
                        >
                          {restantes < 0
                            ? `${Math.abs(restantes)} d. úteis atrás`
                            : restantes === 0
                              ? "vence hoje"
                              : `em ${restantes} d. úteis`}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {responsavel ? ESTADOS[processo.status].titulo : "—"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vazio>Nenhum prazo vencido ou próximo do vencimento.</Vazio>
          )}
        </Cartao>

        <Cartao className="lg:col-span-2">
          <CabecalhoCartao
            titulo="Processos por etapa"
            descricao="Onde está cada PATD neste momento."
          />
          <Barras
            dados={ind.porStatus}
            vazio="Nenhum processo no período selecionado."
          />
        </Cartao>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao>
          <CabecalhoCartao
            titulo="Desfecho das decisões"
            descricao="Proporção entre punição e arquivamento."
          />
          <Rosca
            segmentos={[
              {
                rotulo: "Punição",
                valor: ind.desfechos.punicao,
                cor: "var(--color-primary-600)",
              },
              {
                rotulo: "Arquivamento",
                valor: ind.desfechos.arquivamento,
                cor: "var(--color-success-base)",
              },
            ]}
            centroValor={String(ind.desfechos.punicao + ind.desfechos.arquivamento)}
            centroRotulo="decisões"
          />
          {ind.porPunicao.length ? (
            <div className="border-t border-neutral-200">
              <p className="px-5 pt-4 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Punições aplicadas
              </p>
              <Barras dados={ind.porPunicao} cor="bg-primary-500" />
            </div>
          ) : null}
        </Cartao>

        <Cartao>
          <CabecalhoCartao
            titulo="Transgressões mais recorrentes"
            descricao="Distribuição pelo item do art. 10 do RDAER."
          />
          <Barras dados={ind.porItemArt10} cor="bg-primary-600" />
          <p className="border-t border-neutral-200 px-5 py-3 text-xs leading-relaxed text-neutral-500">
            {AVISO_CATALOGO}
          </p>
        </Cartao>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Cartao>
          <CabecalhoCartao
            titulo="Tempo médio por etapa"
            descricao="Em dias corridos, entre um marco e o seguinte."
          />
          <Barras
            dados={ind.tempoMedioPorEtapa.map((e) => ({
              chave: e.etapa,
              rotulo: e.rotulo,
              valor: e.dias,
            }))}
            cor="bg-info-base"
            sufixo=" d"
          />
        </Cartao>

        <Cartao>
          <CabecalhoCartao
            titulo="Reincidência"
            descricao="Militares com mais de um PATD no período."
          />
          {ind.reincidentes.length ? (
            <ul className="divide-y divide-neutral-200">
              {ind.reincidentes.map((r) => {
                const m = militarPorId(estado, r.militarId);
                return (
                  <li
                    key={r.militarId}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-neutral-900">{nomeCurto(m)}</p>
                      <p className="text-xs text-neutral-600">{m?.secao}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-neutral-900">
                        {r.total} PATD
                      </p>
                      <p className="text-xs text-neutral-600">
                        {r.comPunicao} com punição
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vazio>Nenhum militar com mais de um processo no período.</Vazio>
          )}
        </Cartao>

        <Cartao>
          <CabecalhoCartao
            titulo="Pedidos de reconsideração"
            descricao="Sobre as punições com ciência colhida."
          />
          <dl className="divide-y divide-neutral-200">
            {[
              {
                r: "Punições passíveis de pedido",
                v: ind.reconsideracao.elegiveis,
              },
              { r: "Pedidos apresentados", v: ind.reconsideracao.pedidos },
              { r: "Em análise", v: ind.reconsideracao.emAnalise },
              { r: "Deferidos", v: ind.reconsideracao.deferidos },
              { r: "Parcialmente deferidos", v: ind.reconsideracao.parciais },
              { r: "Indeferidos", v: ind.reconsideracao.indeferidos },
            ].map((linha) => (
              <div
                key={linha.r}
                className="flex items-center justify-between gap-3 px-5 py-2.5"
              >
                <dt className="text-sm text-neutral-700">{linha.r}</dt>
                <dd className="text-sm font-semibold tabular-nums text-neutral-900">
                  {linha.v}
                </dd>
              </div>
            ))}
          </dl>
        </Cartao>
      </div>
    </div>
  );
}
