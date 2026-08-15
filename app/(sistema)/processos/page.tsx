"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cartao, Etiqueta, Vazio } from "@/components/ui/base";
import { ChipPrazo, EtiquetaStatus } from "@/components/processo/indicadores-linha";
import { IconeSeta } from "@/components/ui/icones";
import { militarPorId, nomeCurto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import { acoesDisponiveis } from "@/lib/dominio/acoes";
import { ESTADOS, ORDEM_ESTADOS } from "@/lib/dominio/estados";
import { formatarData } from "@/lib/dominio/prazos";
import { rotularItemCurto } from "@/lib/dominio/rdaer";
import { processosVisiveis } from "@/lib/dominio/visibilidade";
import { cn } from "@/lib/ui";

const TITULOS = {
  COMANDANTE: {
    titulo: "Processos da Organização Militar",
    ajuda: "Todos os PATD em tramitação e encerrados na OM.",
  },
  ADMIN: {
    titulo: "Processos da Organização Militar",
    ajuda: "Todos os PATD da OM, incluindo os que aguardam autuação.",
  },
  APURADOR: {
    titulo: "Processos sob minha apuração",
    ajuda: "Somente os PATD em que você foi designado oficial apurador.",
  },
  ARROLADO: {
    titulo: "Meus processos",
    ajuda: "Somente os PATD em que você figura como militar arrolado.",
  },
} as const;

export default function ListaProcessos() {
  const { estado, conta, militar, hoje } = useStore();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "andamento" | "acao" | "finalizados">(
    "andamento",
  );

  const visiveis = useMemo(
    () => processosVisiveis(estado, conta),
    [estado, conta],
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return visiveis
      .filter((p) => {
        if (filtro === "andamento") return p.status !== "FINALIZADO";
        if (filtro === "finalizados") return p.status === "FINALIZADO";
        if (filtro === "acao") {
          return (
            acoesDisponiveis(p, conta.perfil, militar.id, hoje).length > 0
          );
        }
        return true;
      })
      .filter((p) => {
        if (!termo) return true;
        const arrolado = militarPorId(estado, p.arroladoId);
        return (
          p.numero.toLowerCase().includes(termo) ||
          (arrolado?.nome.toLowerCase().includes(termo) ?? false) ||
          p.relatoFato.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => {
        const ordem =
          ORDEM_ESTADOS.indexOf(a.status) - ORDEM_ESTADOS.indexOf(b.status);
        if (ordem !== 0) return ordem;
        return b.abertoEm.localeCompare(a.abertoEm);
      });
  }, [visiveis, busca, filtro, conta.perfil, militar.id, hoje, estado]);

  const contagemAcao = useMemo(
    () =>
      visiveis.filter(
        (p) => acoesDisponiveis(p, conta.perfil, militar.id, hoje).length > 0,
      ).length,
    [visiveis, conta.perfil, militar.id, hoje],
  );

  const cabecalho = TITULOS[conta.perfil];

  const abas = [
    { id: "acao" as const, rotulo: `Aguardando você (${contagemAcao})` },
    { id: "andamento" as const, rotulo: "Em andamento" },
    { id: "finalizados" as const, rotulo: "Finalizados" },
    { id: "todos" as const, rotulo: "Todos" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          {cabecalho.titulo}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">{cabecalho.ajuda}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap rounded-md border border-neutral-300 bg-white p-0.5"
          role="group"
          aria-label="Filtrar processos"
        >
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setFiltro(aba.id)}
              aria-pressed={filtro === aba.id}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === aba.id
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        <label className="flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar processo</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, militar ou fato…"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
          />
        </label>
      </div>

      <Cartao>
        {lista.length ? (
          <ul className="divide-y divide-neutral-200">
            {lista.map((p) => {
              const arrolado = militarPorId(estado, p.arroladoId);
              const apurador = militarPorId(estado, p.apuradorId);
              const acoes = acoesDisponiveis(p, conta.perfil, militar.id, hoje);
              return (
                <li key={p.id}>
                  <Link
                    href={`/processos/${p.id}`}
                    className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-primary-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">
                          PATD nº {p.numero}
                        </span>
                        <EtiquetaStatus processo={p} />
                        <ChipPrazo processo={p} hoje={hoje} />
                        {acoes.length ? (
                          <Etiqueta tom="info">Ação sua pendente</Etiqueta>
                        ) : null}
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-sm text-neutral-700">
                        {p.relatoFato}
                      </p>

                      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-600">
                        <div className="flex gap-1">
                          <dt className="text-neutral-500">Arrolado:</dt>
                          <dd>{nomeCurto(arrolado)}</dd>
                        </div>
                        {apurador ? (
                          <div className="flex gap-1">
                            <dt className="text-neutral-500">Apurador:</dt>
                            <dd>{nomeCurto(apurador)}</dd>
                          </div>
                        ) : null}
                        <div className="flex gap-1">
                          <dt className="text-neutral-500">Aberto em:</dt>
                          <dd>{formatarData(p.abertoEm)}</dd>
                        </div>
                        {p.itensArt10.length ? (
                          <div className="flex gap-1">
                            <dt className="text-neutral-500">Enquadramento:</dt>
                            <dd>
                              {p.itensArt10.map(rotularItemCurto).join(", ")} do art. 10
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>

                    <div className="hidden shrink-0 items-center gap-3 self-center sm:flex">
                      <span className="text-right text-xs text-neutral-500">
                        {ESTADOS[p.status].aguardando}
                      </span>
                      <IconeSeta className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Vazio>
            {busca
              ? "Nenhum processo corresponde à busca."
              : "Nenhum processo nesta situação."}
          </Vazio>
        )}
      </Cartao>
    </div>
  );
}
