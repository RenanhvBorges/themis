"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Icon } from "./icons";

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="vstack" style={{ gap: 16 }}>
      <div className="field">
        <label htmlFor="saram">SARAM</label>
        <input
          id="saram"
          name="saram"
          className="ctrl"
          inputMode="numeric"
          autoComplete="username"
          placeholder="Somente números"
          maxLength={8}
          required
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" className="ctrl" autoComplete="current-password" required />
        <span className="hint">No primeiro acesso, a senha é igual ao seu SARAM.</span>
      </div>
      {state.erro ? (
        <div className="alert tone-perigo">
          <Icon name="alerta" /> {state.erro}
        </div>
      ) : null}
      <BotaoEntrar />
    </form>
  );
}
