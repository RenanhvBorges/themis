import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { podeVerPainel } from "@/lib/domain/rbac";

export default async function IndexPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  redirect(podeVerPainel(conta) ? "/painel" : "/processos");
}
