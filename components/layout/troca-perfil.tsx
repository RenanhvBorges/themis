"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nomeCurto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import { ROTULO_PERFIL } from "@/lib/dominio/visibilidade";
import { cn } from "@/lib/ui";
import { IconeChevron, IconeUsuario } from "@/components/ui/icones";

/**
 * Troca de perfil da demonstração.
 *
 * No produto a identidade vem do Login gov.br (PRD, seção 8) e ninguém troca de
 * perfil sozinho. Aqui o seletor existe para permitir percorrer o fluxo inteiro —
 * Admin, Arrolado, Apurador e Comandante — sem quatro logins diferentes.
 */
export function TrocaPerfil() {
  const { estado, conta, militar, trocarConta } = useStore();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  return (
    <div className="relative" ref={caixa}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-md border border-primary-800 bg-primary-900/60 px-3 py-1.5 text-left transition-colors hover:bg-primary-800"
      >
        <IconeUsuario className="size-4 shrink-0 text-primary-200" />
        <span className="leading-tight">
          <span className="block text-xs font-semibold text-white">
            {ROTULO_PERFIL[conta.perfil]}
          </span>
          <span className="block text-[11px] text-primary-200">
            {nomeCurto(militar)}
          </span>
        </span>
        <IconeChevron
          className={cn(
            "size-4 text-primary-300 transition-transform",
            aberto && "rotate-180",
          )}
        />
      </button>

      {aberto ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
        >
          <p className="border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs text-neutral-600">
            Modo demonstração — troque de perfil para percorrer o fluxo completo.
          </p>
          <ul className="py-1">
            {estado.contas.map((c) => {
              const m = estado.militares.find((x) => x.id === c.militarId);
              const ativa = c.id === conta.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={ativa}
                    onClick={() => {
                      trocarConta(c.id);
                      setAberto(false);
                      router.push(c.perfil === "COMANDANTE" ? "/painel" : "/processos");
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary-50",
                      ativa && "bg-primary-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        ativa ? "bg-primary-600" : "bg-neutral-300",
                      )}
                      aria-hidden
                    />
                    <span>
                      <span className="block text-sm font-medium text-neutral-900">
                        {ROTULO_PERFIL[c.perfil]}
                      </span>
                      <span className="block text-xs text-neutral-600">
                        {nomeCurto(m)} — {c.funcao}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
