"use client";

import { Icon } from "./icons";

export function BotaoImprimir() {
  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
      <Icon name="baixar" /> Imprimir / salvar em PDF
    </button>
  );
}
