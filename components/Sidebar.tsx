"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import type { ContaAtual } from "@/lib/auth/current";
import { podeAbrirProcesso, podeGerenciarUsuarios, podeVerPainel } from "@/lib/domain/rbac";
import { logoutAction } from "@/lib/actions/auth";

interface ItemNav {
  href: string;
  rotulo: string;
  icone: "painel" | "processos" | "mais" | "usuario";
  visivel: (conta: ContaAtual) => boolean;
}

const ITENS_NAV: ItemNav[] = [
  { href: "/painel", rotulo: "Painel", icone: "painel", visivel: podeVerPainel },
  { href: "/processos", rotulo: "Processos", icone: "processos", visivel: () => true },
  { href: "/processos/novo", rotulo: "Novo processo", icone: "mais", visivel: podeAbrirProcesso },
  { href: "/usuarios", rotulo: "Usuários", icone: "usuario", visivel: podeGerenciarUsuarios },
];

export function Sidebar({ conta, omSigla }: { conta: ContaAtual; omSigla: string }) {
  const pathname = usePathname();
  const itens = ITENS_NAV.filter((it) => it.visivel(conta));
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">
          <Icon name="cadeado" />
        </div>
        <div className="wordmark">
          <b>THEMIS</b>
          <span>{omSigla}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {itens.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-link${
              pathname === it.href ||
              (it.href === "/processos" && pathname.startsWith("/processos/") && pathname !== "/processos/novo") ||
              (it.href === "/usuarios" && pathname.startsWith("/usuarios/"))
                ? " active"
                : ""
            }`}
          >
            <Icon name={it.icone} />
            {it.rotulo}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <p className="om">
          {conta.postoGrad} {conta.nome}
          <br />
          SARAM {conta.saram}
        </p>
        <form action={logoutAction}>
          <button type="submit">
            <Icon name="voltar" /> Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
