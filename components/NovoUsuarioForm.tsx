"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { criarUsuarioAction, type UsuarioAcaoState } from "@/lib/actions/usuarios";
import { PERFIS_ATRIBUIVEIS } from "@/lib/domain/rbac";
import { ROTULO_PERFIL } from "@/lib/domain/estados";
import { Icon } from "./icons";

function BotaoCadastrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Cadastrando…" : "Cadastrar usuário"}
    </button>
  );
}

export function NovoUsuarioForm() {
  const [state, formAction] = useActionState<UsuarioAcaoState, FormData>(criarUsuarioAction, {});

  return (
    <form action={formAction} className="vstack" style={{ gap: 16 }}>
      <div className="form-grid-2">
        <div className="field">
          <label htmlFor="saram">
            SARAM<span className="req">*</span>
          </label>
          <input id="saram" name="saram" className="ctrl" required inputMode="numeric" placeholder="6 a 8 dígitos" />
          <span className="hint">Senha inicial = o próprio SARAM. Troca obrigatória no primeiro acesso.</span>
        </div>
        <div className="field">
          <label htmlFor="postoGrad">
            Posto/Graduação<span className="req">*</span>
          </label>
          <input id="postoGrad" name="postoGrad" className="ctrl" required placeholder="Ex.: 1T QOINF" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="nome">
          Nome completo<span className="req">*</span>
        </label>
        <input id="nome" name="nome" className="ctrl" required />
      </div>

      <div className="form-grid-2">
        <div className="field">
          <label htmlFor="secao">
            Seção<span className="req">*</span>
          </label>
          <input id="secao" name="secao" className="ctrl" required placeholder="Ex.: Adjunto da SAP-01" />
        </div>
        <div className="field">
          <label htmlFor="quadro">Quadro</label>
          <input id="quadro" name="quadro" className="ctrl" placeholder="Opcional" />
        </div>
      </div>

      <div className="field">
        <label>Perfis funcionais</label>
        <div className="check-list">
          {PERFIS_ATRIBUIVEIS.map((p) => (
            <label key={p} className="check-opt">
              <input type="checkbox" name="perfisFuncionais" value={p} />
              <span>{ROTULO_PERFIL[p]}</span>
            </label>
          ))}
        </div>
        <span className="hint">
          Apurador marca elegibilidade — só quem tiver esse perfil aparece para ser escolhido como &ldquo;Oficial
          apurador designado&rdquo; ao autuar um processo. Sem nenhum perfil marcado, o militar ainda poderá figurar
          como arrolado em processos específicos.
        </span>
      </div>

      {state.erro ? (
        <div className="alert tone-perigo">
          <Icon name="alerta" /> {state.erro}
        </div>
      ) : null}

      <div className="hstack" style={{ justifyContent: "flex-end" }}>
        <BotaoCadastrar />
      </div>
    </form>
  );
}
