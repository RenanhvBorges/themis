"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Botao, BotaoLink } from "@/components/ui/base";
import { IconeBaixar, IconeVoltar } from "@/components/ui/icones";

/** Moldura de leitura/impressão. A barra some no PDF pela regra `data-nao-imprimir`. */
export function Visualizador({
  titulo,
  subtitulo,
  voltarPara,
  children,
}: {
  titulo: string;
  subtitulo: string;
  voltarPara: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-200/70">
      <header
        data-nao-imprimir
        className="sticky top-0 z-10 border-b border-neutral-300 bg-white"
      >
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href={voltarPara}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-600 transition-colors hover:text-primary-700"
            >
              <IconeVoltar className="size-3.5" />
              Voltar ao processo
            </Link>
            <h1 className="truncate text-sm font-semibold text-neutral-900">{titulo}</h1>
            <p className="truncate text-xs text-neutral-600">{subtitulo}</p>
          </div>
          <Botao variante="primaria" onClick={() => window.print()}>
            <IconeBaixar className="size-4" />
            Baixar PDF
          </Botao>
        </div>
      </header>

      <div className="px-4 py-6">{children}</div>

      <footer
        data-nao-imprimir
        className="mx-auto max-w-[210mm] px-4 pb-10 text-center text-xs leading-relaxed text-neutral-600"
      >
        <p>
          O botão “Baixar PDF” abre o diálogo de impressão do navegador — escolha
          <span className="font-medium"> “Salvar como PDF”</span>. No produto, a mesma
          marcação HTML é renderizada no servidor por Playwright headless, gerando o
          arquivo direto, sem passar pelo navegador do usuário.
        </p>
        <p className="mt-3">
          <BotaoLink href={voltarPara} variante="secundaria">
            <IconeVoltar className="size-4" />
            Voltar ao processo
          </BotaoLink>
        </p>
      </footer>
    </div>
  );
}
