import type { ReactNode } from "react";
import type { Fatia } from "@/lib/dominio/indicadores";
import { cn } from "@/lib/ui";

/** Barras horizontais — legíveis com rótulos longos, sem dependência de gráfico. */
export function Barras({
  dados,
  cor = "bg-primary-600",
  sufixo,
  vazio = "Sem dados no período.",
}: {
  dados: Fatia[];
  cor?: string;
  sufixo?: string;
  vazio?: string;
}) {
  if (!dados.length) {
    return <p className="px-5 py-8 text-center text-sm text-neutral-500">{vazio}</p>;
  }
  const maximo = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <ul className="space-y-3 px-5 py-4">
      {dados.map((d) => (
        <li key={d.chave}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-neutral-700">{d.rotulo}</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">
              {d.valor}
              {sufixo ? (
                <span className="ml-0.5 text-xs font-normal text-neutral-500">
                  {sufixo}
                </span>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={cn("h-full rounded-full", cor)}
              style={{ width: `${Math.max((d.valor / maximo) * 100, 3)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface Segmento {
  rotulo: string;
  valor: number;
  cor: string;
}

/** Rosca em SVG puro — usada para proporções de duas ou três categorias. */
export function Rosca({
  segmentos,
  centroValor,
  centroRotulo,
}: {
  segmentos: Segmento[];
  centroValor: string;
  centroRotulo: string;
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  let acumulado = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 px-5 py-5">
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={raio}
            fill="none"
            stroke="var(--color-neutral-100)"
            strokeWidth="18"
          />
          {total > 0
            ? segmentos.map((s) => {
                const fracao = s.valor / total;
                const traco = fracao * circunferencia;
                const deslocamento = -acumulado * circunferencia;
                acumulado += fracao;
                if (s.valor === 0) return null;
                return (
                  <circle
                    key={s.rotulo}
                    cx="70"
                    cy="70"
                    r={raio}
                    fill="none"
                    stroke={s.cor}
                    strokeWidth="18"
                    strokeDasharray={`${traco} ${circunferencia - traco}`}
                    strokeDashoffset={deslocamento}
                  />
                );
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-neutral-900">
            {centroValor}
          </span>
          <span className="text-[11px] tracking-wide text-neutral-500 uppercase">
            {centroRotulo}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {segmentos.map((s) => (
          <li key={s.rotulo} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.cor }}
              aria-hidden
            />
            <span className="text-neutral-700">{s.rotulo}</span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {s.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Kpi({
  rotulo,
  valor,
  unidade,
  detalhe,
  tom = "neutro",
  Icone,
}: {
  rotulo: string;
  valor: string | number;
  unidade?: string;
  detalhe?: string;
  tom?: "neutro" | "aviso" | "perigo" | "sucesso";
  Icone?: (p: { className?: string }) => ReactNode;
}) {
  const cores = {
    neutro: "text-neutral-900",
    aviso: "text-warning-text",
    perigo: "text-danger-text",
    sucesso: "text-success-text",
  } as const;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(41,52,69,0.06)]">
      <div className="flex items-center gap-2">
        {Icone ? <Icone className="size-4 shrink-0 text-neutral-400" /> : null}
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {rotulo}
        </p>
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", cores[tom])}>
        {valor}
        {unidade ? (
          <span className="ml-1 text-base font-normal text-neutral-500">{unidade}</span>
        ) : null}
      </p>
      {detalhe ? <p className="mt-1 text-xs text-neutral-600">{detalhe}</p> : null}
    </div>
  );
}
