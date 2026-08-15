"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/ui";

function Envolucro({
  rotulo,
  ajuda,
  htmlFor,
  children,
  obrigatorio,
}: {
  rotulo: string;
  ajuda?: string;
  htmlFor?: string;
  children: ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-neutral-800"
      >
        {rotulo}
        {obrigatorio ? <span className="ml-0.5 text-danger-base">*</span> : null}
      </label>
      {ajuda ? <p className="mt-0.5 text-xs text-neutral-600">{ajuda}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const CONTROLE =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 disabled:bg-neutral-100";

export function CampoTexto({
  rotulo,
  ajuda,
  valor,
  aoMudar,
  placeholder,
  obrigatorio,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  obrigatorio?: boolean;
}) {
  const id = useId();
  return (
    <Envolucro rotulo={rotulo} ajuda={ajuda} htmlFor={id} obrigatorio={obrigatorio}>
      <input
        id={id}
        type="text"
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className={CONTROLE}
      />
    </Envolucro>
  );
}

export function CampoArea({
  rotulo,
  ajuda,
  valor,
  aoMudar,
  placeholder,
  linhas = 6,
  obrigatorio,
}: {
  rotulo: string;
  ajuda?: string;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder?: string;
  linhas?: number;
  obrigatorio?: boolean;
}) {
  const id = useId();
  return (
    <Envolucro rotulo={rotulo} ajuda={ajuda} htmlFor={id} obrigatorio={obrigatorio}>
      <textarea
        id={id}
        value={valor}
        rows={linhas}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className={cn(CONTROLE, "resize-y leading-relaxed")}
      />
    </Envolucro>
  );
}

export function CampoSelect<T extends string>({
  rotulo,
  ajuda,
  valor,
  aoMudar,
  opcoes,
  obrigatorio,
}: {
  rotulo: string;
  ajuda?: string;
  valor: T;
  aoMudar: (v: T) => void;
  opcoes: { valor: T; rotulo: string }[];
  obrigatorio?: boolean;
}) {
  const id = useId();
  return (
    <Envolucro rotulo={rotulo} ajuda={ajuda} htmlFor={id} obrigatorio={obrigatorio}>
      <select
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value as T)}
        className={CONTROLE}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </Envolucro>
  );
}

export function CampoOpcoes<T extends string>({
  rotulo,
  ajuda,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string;
  ajuda?: string;
  valor: T;
  aoMudar: (v: T) => void;
  opcoes: { valor: T; rotulo: string; descricao?: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-neutral-800">{rotulo}</legend>
      {ajuda ? <p className="mt-0.5 text-xs text-neutral-600">{ajuda}</p> : null}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={cn(
              "flex cursor-pointer gap-2.5 rounded-md border px-3 py-2.5 transition-colors",
              valor === o.valor
                ? "border-primary-400 bg-primary-50"
                : "border-neutral-300 bg-white hover:border-neutral-400",
            )}
          >
            <input
              type="radio"
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="mt-0.5 size-4 shrink-0 accent-primary-600"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">
                {o.rotulo}
              </span>
              {o.descricao ? (
                <span className="block text-xs text-neutral-600">{o.descricao}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CampoMarcadores({
  rotulo,
  ajuda,
  valores,
  aoMudar,
  opcoes,
  colunas = 1,
}: {
  rotulo: string;
  ajuda?: string;
  valores: string[];
  aoMudar: (v: string[]) => void;
  opcoes: { valor: string; rotulo: string }[];
  colunas?: 1 | 2;
}) {
  const alternar = (v: string) =>
    aoMudar(valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v]);

  return (
    <fieldset>
      <legend className="text-sm font-medium text-neutral-800">{rotulo}</legend>
      {ajuda ? <p className="mt-0.5 text-xs text-neutral-600">{ajuda}</p> : null}
      <div
        className={cn(
          "mt-2 max-h-60 overflow-y-auto rounded-md border border-neutral-300 bg-white p-1",
          colunas === 2 && "sm:columns-2",
        )}
      >
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className="flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 hover:bg-neutral-50"
          >
            <input
              type="checkbox"
              checked={valores.includes(o.valor)}
              onChange={() => alternar(o.valor)}
              className="mt-0.5 size-4 shrink-0 accent-primary-600"
            />
            <span className="text-sm text-neutral-800">{o.rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
