"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/dados/store";

export default function Inicio() {
  const { conta, pronto } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!pronto) return;
    router.replace(conta.perfil === "COMANDANTE" ? "/painel" : "/processos");
  }, [pronto, conta.perfil, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-950">
      <p className="text-sm text-primary-200">Carregando…</p>
    </div>
  );
}
