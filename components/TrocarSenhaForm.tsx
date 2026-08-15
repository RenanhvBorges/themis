"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { trocarSenhaAction, type TrocarSenhaState } from "@/lib/actions/auth";
import { Icon } from "./icons";

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? "Salvando…" : "Definir nova senha"}
    </button>
  );
}

export function TrocarSenhaForm({ obrigatoria }: { obrigatoria: boolean }) {
  const [state, formAction] = useActionState<TrocarSenhaState, FormData>(trocarSenhaAction, {});

  return (
    <form action={formAction} className="vstack" style={{ gap: 16 }}>
      {obrigatoria ? (
        <div className="alert tone-aviso">
          <Icon name="alerta" /> Por segurança, defina uma nova senha antes de continuar. A senha inicial (igual ao
          SARAM) não pode ser mantida.
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="senhaAtual">Senha atual</label>
        <input id="senhaAtual" name="senhaAtual" type="password" className="ctrl" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="novaSenha">Nova senha</label>
        <input id="novaSenha" name="novaSenha" type="password" className="ctrl" autoComplete="new-password" required minLength={8} />
        <span className="hint">Mínimo de 8 caracteres, combinando letras e números.</span>
      </div>
      <div className="field">
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <input id="confirmacao" name="confirmacao" type="password" className="ctrl" autoComplete="new-password" required minLength={8} />
      </div>
      {state.erro ? (
        <div className="alert tone-perigo">
          <Icon name="alerta" /> {state.erro}
        </div>
      ) : null}
      <BotaoSalvar />
    </form>
  );
}
