"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Marca } from "@/components/layout/marca";
import { TrocaPerfil } from "@/components/layout/troca-perfil";
import {
  IconeCadeado,
  IconeMais,
  IconePainel,
  IconeProcessos,
  IconeReiniciar,
} from "@/components/ui/icones";
import { useStore } from "@/lib/dados/store";
import { TARJA_SIGILO } from "@/lib/dominio/anexos";
import { podeAbrirProcesso, podeVerPainel } from "@/lib/dominio/visibilidade";
import { cn } from "@/lib/ui";

interface ItemMenu {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
}

export default function LayoutSistema({
  children,
}: {
  children: React.ReactNode;
}) {
  const { conta, estado, pronto, reiniciar } = useStore();
  const caminho = usePathname();

  const itens: ItemMenu[] = [];
  if (podeVerPainel(conta.perfil)) {
    itens.push({ href: "/painel", rotulo: "Painel", Icone: IconePainel });
  }
  itens.push({ href: "/processos", rotulo: "Processos", Icone: IconeProcessos });
  if (podeAbrirProcesso(conta.perfil)) {
    itens.push({ href: "/processos/novo", rotulo: "Abrir processo", Icone: IconeMais });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-primary-950 lg:flex">
        <div className="px-5 py-5">
          <Link href="/" aria-label="Themis — início">
            <Marca />
          </Link>
        </div>

        <nav className="flex-1 px-3" aria-label="Navegação principal">
          <ul className="space-y-1">
            {itens.map(({ href, rotulo, Icone }) => {
              const ativo =
                href === "/processos"
                  ? caminho === "/processos" || caminho.startsWith("/processos/")
                  : caminho === href;
              const exato = caminho === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={exato ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      ativo && href !== "/processos/novo"
                        ? "bg-primary-800 text-white"
                        : "text-primary-200 hover:bg-primary-900 hover:text-white",
                      exato && href === "/processos/novo" && "bg-primary-800 text-white",
                    )}
                  >
                    <Icone className="size-4 shrink-0" />
                    {rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-primary-900 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-primary-300">
            {estado.om.sigla} — {estado.om.nome}
            <br />
            {estado.om.cidade}/{estado.om.uf}
          </p>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar os dados de demonstração? As alterações feitas nesta sessão serão perdidas.",
                )
              ) {
                reiniciar();
              }
            }}
            className="mt-3 flex items-center gap-2 text-[11px] font-medium text-primary-300 transition-colors hover:text-white"
          >
            <IconeReiniciar className="size-3.5" />
            Restaurar dados de demonstração
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 bg-primary-950">
          <div className="flex items-center justify-between gap-4 px-5 py-3 lg:px-8">
            <Link href="/" className="lg:hidden" aria-label="Themis — início">
              <Marca compacta />
            </Link>
            <p className="hidden text-sm font-medium text-primary-100 lg:block">
              Processo de Apuração de Transgressão Disciplinar
            </p>
            <TrocaPerfil />
          </div>
          <p className="flex items-center justify-center gap-2 bg-primary-900 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-primary-100 uppercase">
            <IconeCadeado className="size-3.5" />
            {TARJA_SIGILO}
          </p>
        </header>

        <nav
          className="flex gap-1 border-b border-neutral-200 bg-white px-2 py-2 lg:hidden"
          aria-label="Navegação principal"
        >
          {itens.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                caminho === href
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600",
              )}
            >
              <Icone className="size-4 shrink-0" />
              {rotulo}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          {pronto ? (
            children
          ) : (
            <div className="mx-auto max-w-6xl space-y-4" aria-busy>
              <div className="h-8 w-64 animate-pulse rounded bg-neutral-200" />
              <div className="h-40 animate-pulse rounded-lg bg-neutral-200" />
              <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
