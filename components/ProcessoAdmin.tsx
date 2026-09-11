"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "./Modal";
import { Icon } from "./icons";
import { arquivarProcessoAction, excluirProcessoAction, type AcaoState } from "@/lib/actions/processos";

function ErroAcao({ erro }: { erro?: string }) {
  if (!erro) return null;
  return (
    <div className="alert tone-perigo">
      <Icon name="alerta" /> {erro}
    </div>
  );
}

function BotaoConfirmar({ texto, perigo }: { texto: string; perigo?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn ${perigo ? "btn-danger" : "btn-primary"}`} disabled={pending}>
      {pending ? "Enviando…" : texto}
    </button>
  );
}

export function ProcessoAdmin({
  processoId,
  podeArquivar,
  podeExcluir,
}: {
  processoId: string;
  podeArquivar: boolean;
  podeExcluir: boolean;
}) {
  const [modal, setModal] = useState<"arquivar" | "excluir" | null>(null);
  if (!podeArquivar && !podeExcluir) return null;

  return (
    <div className="card">
      <div className="card-head">
        <h2>Administração</h2>
      </div>
      <div className="card-body hstack" style={{ gap: 10, flexWrap: "wrap" }}>
        {podeArquivar ? (
          <button type="button" className="btn btn-secondary" onClick={() => setModal("arquivar")}>
            Arquivar processo
          </button>
        ) : null}
        {podeExcluir ? (
          <button type="button" className="btn btn-danger" onClick={() => setModal("excluir")}>
            Excluir processo
          </button>
        ) : null}
      </div>

      {modal === "arquivar" ? (
        <Modal
          titulo="Arquivar processo"
          subtitulo="Uso quando já se identifica que a justificativa é simples e não requer a instrução completa do PATD. O processo é encerrado sem mais tramitação."
          onClose={() => setModal(null)}
        >
          <FormArquivar processoId={processoId} onDone={() => setModal(null)} />
        </Modal>
      ) : null}

      {modal === "excluir" ? (
        <Modal
          titulo="Excluir processo"
          subtitulo="Uso apenas para processos abertos por engano ou em teste. O registro é removido das listagens e nunca mais conta na numeração — esta ação não pode ser desfeita pela interface."
          onClose={() => setModal(null)}
        >
          <FormExcluir processoId={processoId} onDone={() => setModal(null)} />
        </Modal>
      ) : null}
    </div>
  );
}

function useAdminForm(action: (prev: AcaoState, fd: FormData) => Promise<AcaoState>, onDone: () => void) {
  return useActionState<AcaoState, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) onDone();
    return res;
  }, {});
}

function FormArquivar({ processoId, onDone }: { processoId: string; onDone: () => void }) {
  const [state, formAction] = useAdminForm(arquivarProcessoAction, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <input type="hidden" name="processoId" value={processoId} />
        <div className="field">
          <label htmlFor="justificativa">Justificativa do arquivamento</label>
          <textarea id="justificativa" name="justificativa" className="ctrl" rows={5} required />
        </div>
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Arquivar processo" />
      </div>
    </form>
  );
}

function FormExcluir({ processoId, onDone }: { processoId: string; onDone: () => void }) {
  const [state, formAction] = useAdminForm(excluirProcessoAction, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <input type="hidden" name="processoId" value={processoId} />
        <div className="field">
          <label htmlFor="motivo">Motivo da exclusão</label>
          <textarea id="motivo" name="motivo" className="ctrl" rows={5} required placeholder="Ex.: aberto por engano; processo de teste." />
        </div>
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Excluir processo" perigo />
      </div>
    </form>
  );
}
