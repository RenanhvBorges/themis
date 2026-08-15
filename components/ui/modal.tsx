"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  titulo,
  descricao,
  aoFechar,
  children,
  rodape,
}: {
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  children: ReactNode;
  rodape: ReactNode;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", tecla);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = anterior;
    };
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-neutral-950/40 p-0 sm:items-start sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 -z-10 cursor-default"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-t-xl bg-white shadow-xl sm:my-6 sm:rounded-xl"
      >
        <header className="border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{titulo}</h2>
          {descricao ? (
            <p className="mt-1 text-sm text-neutral-600">{descricao}</p>
          ) : null}
        </header>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 py-5">
          {children}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3.5">
          {rodape}
        </footer>
      </div>
    </div>
  );
}
