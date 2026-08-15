import { Icon } from "./icons";
import type { ContaAtual } from "@/lib/auth/current";
import { ROTULO_PERFIL } from "@/lib/domain/estados";

export function Topbar({ conta }: { conta: ContaAtual }) {
  return (
    <div className="topbar">
      <div className="topbar-row">
        <span className="topbar-title">
          {conta.postoGrad} {conta.nome}
        </span>
        <div className="hstack" style={{ gap: 8 }}>
          {conta.perfisFuncionais.map((p) => (
            <span key={p} className="chip tone-info">
              {ROTULO_PERFIL[p]}
            </span>
          ))}
          {conta.acessoTotalTeste ? <span className="chip tone-aviso">Acesso total (homologação)</span> : null}
        </div>
        <div className="profile-btn" style={{ cursor: "default" }}>
          <Icon name="usuario" className="user" />
          <span className="lines">
            <span className="role">{conta.postoGrad}</span>
            <span className="name">{conta.nome}</span>
          </span>
        </div>
      </div>
      <div className="sigilo-strip">
        <Icon name="cadeado" />
        Informação pessoal — acesso restrito (Lei nº 12.527/2011, art. 31)
      </div>
    </div>
  );
}
