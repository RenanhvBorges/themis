import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { prisma } from "@/lib/prisma";
import { podeAbrirProcesso } from "@/lib/domain/rbac";
import { NovoProcessoForm } from "@/components/NovoProcessoForm";

export default async function NovoProcessoPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeAbrirProcesso(conta)) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>A abertura de PATD é atribuição do perfil Admin, que recebe o documento de origem e o lança no sistema.</p>
        </div>
      </div>
    );
  }

  const militares = await prisma.militar.findMany({
    where: { omId: conta.omId },
    select: { id: true, nome: true, postoGrad: true, saram: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="container-narrow">
      <div className="page-head">
        <h1>Novo processo</h1>
        <p>Lançamento do documento de origem que dá causa à abertura do PATD.</p>
      </div>
      <div className="card">
        <div className="card-body">
          <NovoProcessoForm militares={militares} />
        </div>
      </div>
    </div>
  );
}
