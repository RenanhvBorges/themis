import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { TrocarSenhaForm } from "@/components/TrocarSenhaForm";
import { Icon } from "@/components/icons";

export default async function TrocarSenhaPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="mark">
            <Icon name="cadeado" />
          </div>
          <b>THEMIS</b>
          <span>
            {conta.postoGrad} {conta.nome}
            <br />
            SARAM {conta.saram}
          </span>
        </div>
        <TrocarSenhaForm obrigatoria={conta.deveTrocarSenha} />
      </div>
    </div>
  );
}
