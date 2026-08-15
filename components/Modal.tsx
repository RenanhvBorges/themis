"use client";

import type { ReactNode } from "react";
import { Icon } from "./icons";

export function Modal({ titulo, subtitulo, onClose, children }: { titulo: string; subtitulo?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-head hstack between">
          <div>
            <h2>{titulo}</h2>
            {subtitulo ? <p>{subtitulo}</p> : null}
          </div>
          <button type="button" className="btn btn-subtle btn-sm" onClick={onClose} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
