import { cn } from "@/lib/ui";

/**
 * Marca do produto.
 *
 * Deliberadamente NÃO reproduz o emblema oficial da FAB: o Manual de Identidade
 * Visual restringe o uso da marca institucional, e o ativo oficial deve ser inserido
 * pela própria OM. O que carrega a identidade aqui é o azul institucional
 * (Pantone 286 / #0033A0), aplicado sem tint conforme o manual.
 */
export function Marca({
  className,
  compacta = false,
}: {
  className?: string;
  compacta?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded bg-white">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-600" aria-hidden>
          <path
            d="M12 4.5v15M7.5 19.5h9M4 8.5h16M8 8.5l-2.8 5.4h5.6L8 8.5Zm8 0-2.8 5.4h5.6L16 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compacta ? (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-[0.14em] text-white">
            THEMIS
          </span>
          <span className="block text-[10px] font-medium tracking-[0.08em] text-primary-200 uppercase">
            Comando da Aeronáutica
          </span>
        </span>
      ) : null}
    </span>
  );
}
