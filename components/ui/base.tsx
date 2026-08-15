import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tom } from "@/lib/dominio/estados";
import { cn, TOM_CLASSES, TOM_PONTO } from "@/lib/ui";

// ---------------------------------------------------------------- Cartão

export function Cartao({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(41,52,69,0.06)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CabecalhoCartao({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-neutral-900 uppercase">
          {titulo}
        </h2>
        {descricao ? (
          <p className="mt-1 text-sm text-neutral-600">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </header>
  );
}

// ---------------------------------------------------------------- Etiqueta

export function Etiqueta({
  children,
  tom = "neutro",
  ponto = false,
}: {
  children: ReactNode;
  tom?: Tom;
  ponto?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TOM_CLASSES[tom],
      )}
    >
      {ponto ? (
        <span className={cn("size-1.5 rounded-full", TOM_PONTO[tom])} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Botão

type Variante = "primaria" | "secundaria" | "sutil" | "perigo";

const VARIANTES: Record<Variante, string> = {
  primaria:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border-transparent",
  secundaria:
    "bg-white text-primary-700 border-neutral-300 hover:bg-primary-50 hover:border-primary-300",
  sutil:
    "bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100",
  perigo:
    "bg-white text-danger-text border-danger-border hover:bg-danger-bg",
};

const BASE_BOTAO =
  "inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Botao({
  variante = "secundaria",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return (
    <button
      {...props}
      className={cn(BASE_BOTAO, VARIANTES[variante], className)}
    />
  );
}

export function BotaoLink({
  variante = "secundaria",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link {...props} className={cn(BASE_BOTAO, VARIANTES[variante], className)} />;
}

// ---------------------------------------------------------------- Diversos

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="px-5 py-10 text-center text-sm text-neutral-500">{children}</p>
  );
}

export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <dt className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
      {children}
    </dt>
  );
}

export function Valor({ children }: { children: ReactNode }) {
  return <dd className="mt-1 text-sm text-neutral-900">{children}</dd>;
}

export function Aviso({
  children,
  tom = "aviso",
}: {
  children: ReactNode;
  tom?: Tom;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3.5 py-2.5 text-sm leading-relaxed",
        TOM_CLASSES[tom],
      )}
    >
      {children}
    </div>
  );
}
