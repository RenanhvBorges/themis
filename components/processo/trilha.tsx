import { ESTADOS, ORDEM_ESTADOS, TRILHA_PADRAO } from "@/lib/dominio/estados";
import { formatarData } from "@/lib/dominio/prazos";
import type { Processo, StatusProcesso } from "@/lib/dominio/tipos";
import { ROTULO_PERFIL } from "@/lib/dominio/visibilidade";
import { cn } from "@/lib/ui";
import { IconeCheck } from "@/components/ui/icones";

/** Data em que o processo entrou em cada estado, lida da trilha de auditoria. */
function entradaEm(p: Processo, status: StatusProcesso): string | undefined {
  const porAcao = (acao: string) =>
    p.eventos.find((e) => e.acao === acao)?.em.slice(0, 10);

  switch (status) {
    case "PARA_ABERTURA":
      return p.abertoEm;
    case "A_CIENTIFICAR":
      return p.autuadoEm;
    case "AGUARDANDO_DEFESA":
      return p.cienciaEm;
    case "EM_APURACAO":
      return p.defesa?.apresentadaEm ?? porAcao("Preclusão certificada");
    case "AGUARDANDO_DESPACHO":
      return p.relatorio?.emitidoEm;
    case "AGUARDANDO_DECISAO":
      return p.recebidoComandanteEm;
    case "CIENCIA_DA_DECISAO":
      return p.decisao?.decididoEm;
    case "RECONSIDERACAO_EM_ANALISE":
      return p.reconsideracao?.pedidoEm;
    case "CIENCIA_NOVA_DECISAO":
      return p.reconsideracao?.decididoEm;
    case "FINALIZADO":
      return p.finalizadoEm;
  }
}

export function Trilha({ processo }: { processo: Processo }) {
  // As etapas 7a e 7b só entram na trilha se o processo realmente passou por elas.
  const passos: StatusProcesso[] = processo.reconsideracao
    ? ORDEM_ESTADOS
    : TRILHA_PADRAO;
  const atualIdx = ORDEM_ESTADOS.indexOf(processo.status);

  return (
    <ol className="px-5 py-4">
      {passos.map((status, i) => {
        const def = ESTADOS[status];
        const idx = ORDEM_ESTADOS.indexOf(status);
        const concluido = idx < atualIdx;
        const atual = idx === atualIdx;
        const data = entradaEm(processo, status);
        const ultimo = i === passos.length - 1;

        return (
          <li key={status} className="relative flex gap-3.5 pb-4 last:pb-0">
            {!ultimo ? (
              <span
                className={cn(
                  "absolute top-7 bottom-1 left-[13px] w-px",
                  concluido ? "bg-primary-300" : "bg-neutral-200",
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold",
                concluido && "border-primary-600 bg-primary-600 text-white",
                atual && "border-primary-600 bg-white text-primary-700",
                !concluido && !atual && "border-neutral-300 bg-white text-neutral-400",
              )}
            >
              {concluido ? <IconeCheck className="size-4" /> : def.etapa}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm",
                  atual ? "font-semibold text-neutral-900" : "text-neutral-800",
                  !concluido && !atual && "text-neutral-500",
                )}
              >
                {def.titulo}
                {atual ? (
                  <span className="ml-2 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary-700 uppercase">
                    Etapa atual
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {atual ? def.aguardando : def.responsavel ? ROTULO_PERFIL[def.responsavel] : "—"}
                {data ? ` · ${formatarData(data)}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
