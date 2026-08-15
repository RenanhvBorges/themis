import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const conta = await contaAtual();
  if (!conta) redirect("/login");

  const om = await prisma.organizacaoMilitar.findUnique({ where: { id: conta.omId }, select: { sigla: true } });

  return (
    <div id="app">
      <Sidebar conta={conta} omSigla={om?.sigla ?? ""} />
      <div className="main-col">
        <Topbar conta={conta} />
        <main className="view">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
