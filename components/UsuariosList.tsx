"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "./Modal";
import { Icon } from "./icons";
import { Chip } from "./chips";
import { PERFIS_ATRIBUIVEIS } from "@/lib/domain/rbac";
import { ROTULO_PERFIL } from "@/lib/domain/estados";
import { atualizarAcessoAction, redefinirSenhaAction, type UsuarioAcaoState } from "@/lib/actions/usuarios";
import type { UsuarioLinha } from "@/lib/queries/usuarios";

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Salvando…" : "Salvar acesso"}
    </button>
  );
}

function BotaoRedefinirSenha() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}>
      {pending ? "Redefinindo…" : "Redefinir senha para o SARAM"}
    </button>
  );
}

export function UsuariosList({ militares, contaIdAtual }: { militares: UsuarioLinha[]; contaIdAtual: string }) {
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<UsuarioLinha | null>(null);

  const q = busca.trim().toLowerCase();
  const filtrados = militares.filter((m) => {
    if (!q) return true;
    return m.nome.toLowerCase().includes(q) || m.saram.includes(q) || m.secao.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="card">
        <div className="card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <input
            className="ctrl grow"
            style={{ maxWidth: 280 }}
            type="search"
            placeholder="Buscar por nome, SARAM ou seção…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="divide">
          {filtrados.length === 0 ? (
            <div className="empty">Nenhum usuário encontrado.</div>
          ) : (
            filtrados.map((m) => (
              <div key={m.id} className="user-row">
                <div className="who grow">
                  <b>
                    {m.postoGrad} {m.nome}
                  </b>
                  <div className="sub">
                    SARAM {m.saram} — {m.secao}
                  </div>
                </div>
                <div className="perfis">
                  {m.conta && m.conta.perfisFuncionais.length > 0 ? (
                    m.conta.perfisFuncionais.map((p) => <Chip key={p} tom="info" texto={ROTULO_PERFIL[p]} />)
                  ) : (
                    <Chip tom="neutro" texto="Sem perfil funcional" />
                  )}
                  {m.conta && !m.conta.ativa ? <Chip tom="perigo" texto="Inativa" /> : null}
                </div>
                <div className="actions">
                  {!m.conta ? (
                    <Chip tom="neutro" texto="Sem conta" />
                  ) : m.conta.id === contaIdAtual ? (
                    <Chip tom="neutro" texto="Sua conta" />
                  ) : (
                    <button type="button" className="btn btn-subtle btn-sm" onClick={() => setEditando(m)}>
                      Editar acesso
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editando && editando.conta ? (
        <EditarAcessoModal usuario={editando} conta={editando.conta} onClose={() => setEditando(null)} />
      ) : null}
    </>
  );
}

function EditarAcessoModal({
  usuario,
  conta,
  onClose,
}: {
  usuario: UsuarioLinha;
  conta: NonNullable<UsuarioLinha["conta"]>;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState<UsuarioAcaoState, FormData>(async (prev, fd) => {
    const res = await atualizarAcessoAction(prev, fd);
    if (res.ok) onClose();
    return res;
  }, {});
  const [stateSenha, formActionSenha] = useActionState<UsuarioAcaoState, FormData>(redefinirSenhaAction, {});

  return (
    <Modal titulo="Editar acesso" subtitulo={`${usuario.postoGrad} ${usuario.nome} — SARAM ${usuario.saram}`} onClose={onClose}>
      <form action={formAction}>
        <div className="modal-body">
          <input type="hidden" name="contaId" value={conta.id} />
          <div className="field">
            <label>Perfis funcionais</label>
            <div className="check-list">
              {PERFIS_ATRIBUIVEIS.map((p) => (
                <label key={p} className="check-opt">
                  <input type="checkbox" name="perfisFuncionais" value={p} defaultChecked={conta.perfisFuncionais.includes(p)} />
                  <span>{ROTULO_PERFIL[p]}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="check-opt">
            <input type="checkbox" name="ativa" defaultChecked={conta.ativa} />
            <span>Conta ativa</span>
          </label>
          {state.erro ? (
            <div className="alert tone-perigo">
              <Icon name="alerta" /> {state.erro}
            </div>
          ) : null}
        </div>
        <div className="modal-foot">
          <BotaoSalvar />
        </div>
      </form>

      <form action={formActionSenha} className="modal-body" style={{ paddingTop: 0, borderTop: "1px solid var(--border)" }}>
        <input type="hidden" name="contaId" value={conta.id} />
        <div className="hstack between" style={{ gap: 10, flexWrap: "wrap", paddingTop: 14 }}>
          <span className="hint" style={{ margin: 0 }}>
            Redefine a senha para o SARAM e força a troca no próximo acesso.
          </span>
          <BotaoRedefinirSenha />
        </div>
        {stateSenha.erro ? (
          <div className="alert tone-perigo" style={{ marginTop: 10 }}>
            <Icon name="alerta" /> {stateSenha.erro}
          </div>
        ) : null}
        {stateSenha.ok ? (
          <div className="alert tone-sucesso" style={{ marginTop: 10 }}>
            <Icon name="check" /> Senha redefinida.
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
