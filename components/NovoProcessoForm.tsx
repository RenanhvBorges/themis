"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { criarProcessoAction, type AcaoState } from "@/lib/actions/processos";
import { Icon } from "./icons";

interface MilitarOpcao {
  id: string;
  nome: string;
  postoGrad: string;
  saram: string;
}

function BotaoAbrir() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Abrindo…" : "Lançar processo"}
    </button>
  );
}

export function NovoProcessoForm({ militares }: { militares: MilitarOpcao[] }) {
  const [state, formAction] = useActionState<AcaoState, FormData>(criarProcessoAction, {});

  return (
    <form action={formAction} className="vstack" style={{ gap: 16 }}>
      <div className="field">
        <label htmlFor="arroladoId">
          Militar arrolado<span className="req">*</span>
        </label>
        <select id="arroladoId" name="arroladoId" className="ctrl" required defaultValue="">
          <option value="" disabled>
            Selecione…
          </option>
          {militares.map((m) => (
            <option key={m.id} value={m.id}>
              {m.postoGrad} {m.nome} — SARAM {m.saram}
            </option>
          ))}
        </select>
        <span className="hint">No piloto o cadastro é manual — a integração com SARAM/SIGPES está fora do MVP.</span>
      </div>

      <fieldset className="vstack" style={{ gap: 10 }}>
        <legend>Documento de origem</legend>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="origemTipo">Tipo</label>
            <select id="origemTipo" name="origemTipo" className="ctrl" required defaultValue="OFICIO">
              <option value="OFICIO">Ofício</option>
              <option value="MEMORANDO">Memorando</option>
              <option value="PARTE_DISCIPLINAR">Parte disciplinar</option>
              <option value="RELATO_REDUZIDO_A_TERMO">Relato reduzido a termo</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="origemNumero">Número</label>
            <input id="origemNumero" name="origemNumero" className="ctrl" required placeholder="Ex.: 123/2026" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="origemData">Data do documento de origem</label>
          <input id="origemData" name="origemData" type="date" className="ctrl" required />
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="relatoFato">
          Relato do fato<span className="req">*</span>
        </label>
        <textarea id="relatoFato" name="relatoFato" className="ctrl" required rows={5} placeholder="Descreva o fato conforme narrado no documento de origem." />
      </div>

      {state.erro ? (
        <div className="alert tone-perigo">
          <Icon name="alerta" /> {state.erro}
        </div>
      ) : null}

      <div className="hstack" style={{ justifyContent: "flex-end" }}>
        <BotaoAbrir />
      </div>
    </form>
  );
}
