import Link from "next/link";
import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { podeGerenciarUsuarios } from "@/lib/domain/rbac";
import { listarUsuarios } from "@/lib/queries/usuarios";
import { UsuariosList } from "@/components/UsuariosList";
import { Icon } from "@/components/icons";

export default async function UsuariosPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeGerenciarUsuarios(conta)) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>A administração de usuários é de acesso exclusivo do perfil Admin.</p>
        </div>
      </div>
    );
  }

  const militares = await listarUsuarios(conta.omId);

  return (
    <>
      <div className="page-head hstack between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1>Usuários</h1>
          <p>Militares cadastrados e contas de acesso ao sistema.</p>
        </div>
        <Link href="/usuarios/novo" className="btn btn-primary">
          <Icon name="mais" /> Novo usuário
        </Link>
      </div>

      <UsuariosList militares={militares} contaIdAtual={conta.contaId} />
    </>
  );
}
