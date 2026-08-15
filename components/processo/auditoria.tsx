import { militarPorId, nomeCurto } from "@/lib/dados/seed";
import { formatarDataHora } from "@/lib/dominio/prazos";
import type { EstadoSistema, Processo } from "@/lib/dominio/tipos";
import { ROTULO_PERFIL } from "@/lib/dominio/visibilidade";

/** Trilha de auditoria append-only (RNF-02) — é ela que substitui a testemunha física. */
export function Auditoria({
  processo,
  estado,
}: {
  processo: Processo;
  estado: EstadoSistema;
}) {
  const eventos = [...processo.eventos].reverse();

  return (
    <ol className="divide-y divide-neutral-200">
      {eventos.map((e) => {
        const autor = militarPorId(estado, e.autorId);
        return (
          <li key={e.id} className="px-5 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium text-neutral-900">{e.acao}</p>
              <time
                dateTime={e.em}
                className="text-xs tabular-nums text-neutral-500"
              >
                {formatarDataHora(e.em)}
              </time>
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-neutral-700">
              {e.detalhe}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {nomeCurto(autor)} · {ROTULO_PERFIL[e.autorPerfil]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
