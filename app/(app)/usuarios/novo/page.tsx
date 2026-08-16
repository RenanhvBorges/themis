import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { podeGerenciarUsuarios } from "@/lib/domain/rbac";
import { NovoUsuarioForm } from "@/components/NovoUsuarioForm";

export default async function NovoUsuarioPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeGerenciarUsuarios(conta)) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>O cadastro de usuários é atribuição exclusiva do perfil Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow">
      <div className="page-head">
        <h1>Novo usuário</h1>
        <p>Cadastro de militar e conta de acesso ao sistema.</p>
      </div>
      <div className="card">
        <div className="card-body">
          <NovoUsuarioForm />
        </div>
      </div>
    </div>
  );
}
