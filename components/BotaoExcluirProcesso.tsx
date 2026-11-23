"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "./Modal";
import { Icon } from "./icons";
import { excluirProcessoAction, type AcaoState } from "@/lib/actions/processos";

function BotaoConfirmarExclusao() {
  const { pending } = useFormStatus();
  return (
    <button
        type="submit"
        className="btn btn-danger"
        style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }}
        disabled={pending}
      >
      {pending ? "Excluindo…" : "Excluir permanentemente"}
    </button>
  );
}

export function BotaoExcluirProcesso({ processoId, numeroProcesso }: { processoId: string; numeroProcesso: string }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");

  const [state, formAction] = useActionState<AcaoState, FormData>(async (prev, fd) => {
    const res = await excluirProcessoAction(prev, fd);
    // Se houver erro, mantém o modal aberto para exibir a mensagem
    if (res.erro) return res;
    // Se ok, o servidor fará redirect — o modal pode ficar aberto sem problema
    return res;
  }, {});

  return (
    <>
      <button
        type="button"
        className="btn btn-danger btn-sm"
        onClick={() => {
          setConfirmacao("");
          setModalAberto(true);
        }}
        title="Excluir processo"
      >
        <Icon name="lixeira" /> Excluir processo
      </button>

      {modalAberto ? (
        <Modal
          titulo="Excluir processo"
          subtitulo="Esta ação é irreversível e remove todos os dados do processo."
          onClose={() => setModalAberto(false)}
        >
          <form action={formAction}>
            <input type="hidden" name="processoId" value={processoId} />
            <div className="modal-body">
              <div className="alert tone-perigo">
                <Icon name="alerta" />
                <span>
                  Todos os documentos, eventos, prazos e registros vinculados ao processo{" "}
                  <b>{numeroProcesso}</b> serão <b>excluídos permanentemente</b> do banco de dados.
                  Esta ação não pode ser desfeita.
                </span>
              </div>
              <div className="field">
                <label htmlFor="confirmacao">
                  Para confirmar, digite o número do processo: <b>{numeroProcesso}</b>
                </label>
                <input
                  id="confirmacao"
                  name="confirmacao"
                  className="ctrl"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  placeholder={numeroProcesso}
                  autoComplete="off"
                  required
                />
              </div>
              {state.erro ? (
                <div className="alert tone-perigo">
                  <Icon name="alerta" /> {state.erro}
                </div>
              ) : null}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-secondary" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
              <BotaoConfirmarExclusao />
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
