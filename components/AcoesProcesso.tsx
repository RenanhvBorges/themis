"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal } from "./Modal";
import { Icon } from "./icons";
import type { Acao, Perfil } from "@/lib/domain/rbac";
import { ROTULO_PERFIL } from "@/lib/domain/estados";
import {
  autuarAction,
  registrarCienciaAction,
  registrarRecusaAction,
  prorrogarDefesaAction,
  apresentarDefesaAction,
  declararPreclusaoAction,
  receberAutosAction,
  registrarInquiricaoAction,
  emitirRelatorioAction,
  receberRelatorioAction,
  decidirAction,
  registrarCienciaDecisaoAction,
  pedirReconsideracaoAction,
  julgarReconsideracaoAction,
  registrarCienciaNovaDecisaoAction,
  encerrarPorPrazoAction,
  type AcaoState,
} from "@/lib/actions/processos";

interface ItemCatalogo {
  id: string;
  numero?: number;
  letra?: string;
  resumo: string;
}
interface MilitarOpcao {
  id: string;
  nome: string;
  postoGrad: string;
  saram: string;
}

export interface AcoesProcessoProps {
  processoId: string;
  acoes: Acao[];
  itensArt10: ItemCatalogo[];
  atenuantes: ItemCatalogo[];
  agravantes: ItemCatalogo[];
  candidatosApurador: MilitarOpcao[];
}

function BotaoConfirmar({ texto = "Confirmar" }: { texto?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Enviando…" : texto}
    </button>
  );
}

function CampoOcultos({ processoId, perfil }: { processoId: string; perfil: Perfil }) {
  return (
    <>
      <input type="hidden" name="processoId" value={processoId} />
      <input type="hidden" name="perfil" value={perfil} />
    </>
  );
}

function SeletorPerfil({ acao, perfil, setPerfil }: { acao: Acao; perfil: Perfil; setPerfil: (p: Perfil) => void }) {
  if (acao.comoPerfil.length <= 1) return null;
  return (
    <div className="field">
      <label>Praticar como</label>
      <select className="ctrl" value={perfil} onChange={(e) => setPerfil(e.target.value as Perfil)}>
        {acao.comoPerfil.map((p) => (
          <option key={p} value={p}>
            {ROTULO_PERFIL[p]}
          </option>
        ))}
      </select>
      <span className="hint">Conta com acesso a mais de um perfil sobre este processo — escolha sob qual perfil o ato será praticado.</span>
    </div>
  );
}

function SigNotice({ papel }: { papel: string }) {
  return (
    <div className="sig-box">
      <div className="sig-title">
        <Icon name="assinatura" /> Assinatura eletrônica
      </div>
      <p>
        Ao confirmar, o ato é assinado como <b>{papel}</b> no nível avançado da Lei nº 14.063/2020, com registro de
        identidade, data-hora e hash do documento na trilha de auditoria.
      </p>
    </div>
  );
}

function CheckList({ name, itens, coluna }: { name: string; itens: ItemCatalogo[]; coluna?: boolean }) {
  return (
    <div className="check-list">
      {itens.map((it) => (
        <label key={it.id} className="check-opt">
          <input type="checkbox" name={name} value={it.id} />
          <span>{it.numero ? `Item ${it.numero} — ` : it.letra ? `Letra "${it.letra}" — ` : ""}{it.resumo}</span>
        </label>
      ))}
      {coluna ? null : null}
    </div>
  );
}

export function AcoesProcesso(props: AcoesProcessoProps) {
  const { processoId, acoes, itensArt10, atenuantes, agravantes, candidatosApurador } = props;
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const acaoAtual = acoes.find((a) => a.id === modalAberto) ?? null;
  const [perfil, setPerfil] = useState<Perfil>(acaoAtual?.comoPerfil[0] ?? "ADMIN");

  function abrir(a: Acao) {
    setPerfil(a.comoPerfil[0]!);
    setModalAberto(a.id);
  }

  if (acoes.length === 0) return null;
  const principal = acoes.find((a) => a.principal) ?? acoes[0]!;

  return (
    <>
      <div className="card action-bar">
        <div className="inner">
          <div>
            <h3>Ação pendente</h3>
            <p>{principal.ajuda}</p>
          </div>
          <div className="btns">
            {acoes.map((a) => (
              <button key={a.id} type="button" className={`btn ${a.principal ? "btn-primary" : "btn-secondary"}`} onClick={() => abrir(a)}>
                {a.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {acaoAtual ? (
        <Modal titulo={acaoAtual.rotulo} subtitulo={acaoAtual.ajuda} onClose={() => setModalAberto(null)}>
          <FormularioAcao
            acao={acaoAtual}
            processoId={processoId}
            perfil={perfil}
            setPerfil={setPerfil}
            itensArt10={itensArt10}
            atenuantes={atenuantes}
            agravantes={agravantes}
            candidatosApurador={candidatosApurador}
            onDone={() => setModalAberto(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}

interface FormularioAcaoProps extends Omit<AcoesProcessoProps, "acoes"> {
  acao: Acao;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  onDone: () => void;
}

function useAcaoForm(action: (prev: AcaoState, fd: FormData) => Promise<AcaoState>, onDone: () => void) {
  return useActionState<AcaoState, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) onDone();
    return res;
  }, {});
}

function ErroAcao({ erro }: { erro?: string }) {
  if (!erro) return null;
  return (
    <div className="alert tone-perigo">
      <Icon name="alerta" /> {erro}
    </div>
  );
}

function FormularioAcao(props: FormularioAcaoProps) {
  const { acao, processoId, perfil, setPerfil, itensArt10, atenuantes, agravantes, candidatosApurador, onDone } = props;

  switch (acao.id) {
    case "AUTUAR":
      return <FormAutuar {...{ processoId, perfil, setPerfil, acao, itensArt10, candidatosApurador, onDone }} />;
    case "REGISTRAR_CIENCIA":
      return <FormConfirmar action={registrarCienciaAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Militar Arrolado" texto="Registrar ciência" />;
    case "REGISTRAR_RECUSA":
      return <FormTexto action={registrarRecusaAction} campo="justificativa" rotulo="Justificativa da recusa" {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "PRORROGAR_DEFESA":
      return <FormTexto action={prorrogarDefesaAction} campo="justificativa" rotulo="Justificativa da prorrogação" {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "DECLARAR_PRECLUSAO":
      return <FormConfirmar action={declararPreclusaoAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Oficial Apurador" texto="Certificar preclusão" />;
    case "APRESENTAR_DEFESA":
      return <FormTexto action={apresentarDefesaAction} campo="texto" rotulo="Alegações de defesa" linhas={8} papel="Militar Arrolado" {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "RECEBER_AUTOS":
      return <FormConfirmar action={receberAutosAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Oficial Apurador" texto="Assinar recebimento" />;
    case "REGISTRAR_INQUIRICAO":
      return <FormInquiricao {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "EMITIR_RELATORIO":
      return <FormRelatorio {...{ processoId, perfil, setPerfil, acao, itensArt10, atenuantes, agravantes, onDone }} />;
    case "RECEBER_RELATORIO":
      return <FormConfirmar action={receberRelatorioAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Autoridade competente" texto="Receber relatório" />;
    case "DECIDIR":
      return <FormDecisao {...{ processoId, perfil, setPerfil, acao, atenuantes, agravantes, onDone }} />;
    case "REGISTRAR_CIENCIA_DECISAO":
      return <FormConfirmar action={registrarCienciaDecisaoAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Militar Arrolado" texto="Registrar ciência" />;
    case "PEDIR_RECONSIDERACAO":
      return <FormTexto action={pedirReconsideracaoAction} campo="razoes" rotulo="Razões do pedido" linhas={6} papel="Militar Arrolado" {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "JULGAR_RECONSIDERACAO":
      return <FormJulgamentoReconsideracao {...{ processoId, perfil, setPerfil, acao, onDone }} />;
    case "REGISTRAR_CIENCIA_NOVA_DECISAO":
      return <FormConfirmar action={registrarCienciaNovaDecisaoAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Militar Arrolado" texto="Registrar ciência" />;
    case "ENCERRAR_POR_PRAZO":
      return <FormConfirmar action={encerrarPorPrazoAction} {...{ processoId, perfil, setPerfil, acao, onDone }} papel="Admin" texto="Encerrar processo" />;
    default:
      return null;
  }
}

// -------------------------------------------------------------------------

function FormConfirmar({
  action,
  processoId,
  perfil,
  setPerfil,
  acao,
  onDone,
  papel,
  texto,
}: {
  action: (prev: AcaoState, fd: FormData) => Promise<AcaoState>;
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  onDone: () => void;
  papel: string;
  texto: string;
}) {
  const [state, formAction] = useAcaoForm(action, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <SigNotice papel={papel} />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto={texto} />
      </div>
    </form>
  );
}

function FormTexto({
  action,
  campo,
  rotulo,
  linhas = 5,
  papel,
  processoId,
  perfil,
  setPerfil,
  acao,
  onDone,
}: {
  action: (prev: AcaoState, fd: FormData) => Promise<AcaoState>;
  campo: string;
  rotulo: string;
  linhas?: number;
  papel?: string;
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(action, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <div className="field">
          <label htmlFor={campo}>{rotulo}</label>
          <textarea id={campo} name={campo} className="ctrl" rows={linhas} required />
        </div>
        {papel ? <SigNotice papel={papel} /> : null}
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar />
      </div>
    </form>
  );
}

function FormAutuar({
  processoId,
  perfil,
  setPerfil,
  acao,
  itensArt10,
  candidatosApurador,
  onDone,
}: {
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  itensArt10: ItemCatalogo[];
  candidatosApurador: MilitarOpcao[];
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(autuarAction, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <div className="field">
          <label htmlFor="apuradorId">Oficial apurador designado</label>
          <select id="apuradorId" name="apuradorId" className="ctrl" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {candidatosApurador.map((m) => (
              <option key={m.id} value={m.id}>
                {m.postoGrad} {m.nome} — SARAM {m.saram}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Enquadramento no art. 10 do RDAER</label>
          <CheckList name="itensArt10" itens={itensArt10} />
        </div>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="portaria">Portaria</label>
            <input id="portaria" name="portaria" className="ctrl" placeholder="Opcional" />
          </div>
          <div className="field">
            <label htmlFor="boletim">Boletim</label>
            <input id="boletim" name="boletim" className="ctrl" placeholder="Opcional" />
          </div>
        </div>
        <SigNotice papel="Oficial Apurador / Autoridade competente" />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Autuar processo" />
      </div>
    </form>
  );
}

function FormInquiricao({
  processoId,
  perfil,
  setPerfil,
  acao,
  onDone,
}: {
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(registrarInquiricaoAction, onDone);
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <div className="field">
          <label htmlFor="tipo">Inquirido</label>
          <select id="tipo" name="tipo" className="ctrl" defaultValue="ARROLADO">
            <option value="ARROLADO">Militar arrolado (Anexo H)</option>
            <option value="TESTEMUNHA">Testemunha (Anexo Q)</option>
          </select>
        </div>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="postoInquirido">Posto/Graduação</label>
            <input id="postoInquirido" name="postoInquirido" className="ctrl" required />
          </div>
          <div className="field">
            <label htmlFor="nomeInquirido">Nome</label>
            <input id="nomeInquirido" name="nomeInquirido" className="ctrl" required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="texto">Termo de inquirição</label>
          <textarea id="texto" name="texto" className="ctrl" rows={8} required />
        </div>
        <SigNotice papel="Oficial Apurador" />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Lavrar termo" />
      </div>
    </form>
  );
}

function FormRelatorio({
  processoId,
  perfil,
  setPerfil,
  acao,
  itensArt10,
  atenuantes,
  agravantes,
  onDone,
}: {
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  itensArt10: ItemCatalogo[];
  atenuantes: ItemCatalogo[];
  agravantes: ItemCatalogo[];
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(emitirRelatorioAction, onDone);
  const [conclusao, setConclusao] = useState("PROCEDENTE");
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <fieldset className="radio-grid">
          <legend>Conclusão</legend>
          <label className={`radio-opt${conclusao === "PROCEDENTE" ? " checked" : ""}`}>
            <input type="radio" name="conclusao" value="PROCEDENTE" checked={conclusao === "PROCEDENTE"} onChange={() => setConclusao("PROCEDENTE")} />
            <span>
              <b>Procedente</b>
              <span>Propõe punição disciplinar</span>
            </span>
          </label>
          <label className={`radio-opt${conclusao === "IMPROCEDENTE" ? " checked" : ""}`}>
            <input type="radio" name="conclusao" value="IMPROCEDENTE" checked={conclusao === "IMPROCEDENTE"} onChange={() => setConclusao("IMPROCEDENTE")} />
            <span>
              <b>Improcedente</b>
              <span>Propõe arquivamento</span>
            </span>
          </label>
        </fieldset>
        <div className="field">
          <label>Itens do art. 10 confirmados</label>
          <CheckList name="itensConfirmados" itens={itensArt10} />
        </div>
        {conclusao === "PROCEDENTE" ? (
          <>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="classificacao">Classificação proposta</label>
                <select id="classificacao" name="classificacao" className="ctrl" defaultValue="">
                  <option value="">—</option>
                  <option value="LEVE">Leve</option>
                  <option value="MEDIA">Média</option>
                  <option value="GRAVE">Grave</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="recomendacaoPunicao">Punição recomendada</label>
                <select id="recomendacaoPunicao" name="recomendacaoPunicao" className="ctrl" defaultValue="">
                  <option value="">—</option>
                  <option value="ADVERTENCIA">Advertência</option>
                  <option value="REPREENSAO">Repreensão</option>
                  <option value="DETENCAO">Detenção</option>
                  <option value="PRISAO">Prisão</option>
                  <option value="PRISAO_EM_SEPARADO">Prisão em separado</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="recomendacaoDias">Dias recomendados</label>
              <input id="recomendacaoDias" name="recomendacaoDias" type="number" min={0} className="ctrl" style={{ maxWidth: 140 }} />
            </div>
            <div className="form-grid-2">
              <div className="field">
                <label>Atenuantes</label>
                <CheckList name="atenuantes" itens={atenuantes} />
              </div>
              <div className="field">
                <label>Agravantes</label>
                <CheckList name="agravantes" itens={agravantes} />
              </div>
            </div>
          </>
        ) : null}
        <div className="field">
          <label htmlFor="fundamentacao">Fundamentação</label>
          <textarea id="fundamentacao" name="fundamentacao" className="ctrl" rows={6} required />
        </div>
        <SigNotice papel="Oficial Apurador" />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Emitir relatório" />
      </div>
    </form>
  );
}

function FormDecisao({
  processoId,
  perfil,
  setPerfil,
  acao,
  atenuantes,
  agravantes,
  onDone,
}: {
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  atenuantes: ItemCatalogo[];
  agravantes: ItemCatalogo[];
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(decidirAction, onDone);
  const [tipo, setTipo] = useState("PUNICAO");
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <fieldset className="radio-grid">
          <legend>Decisão</legend>
          <label className={`radio-opt${tipo === "PUNICAO" ? " checked" : ""}`}>
            <input type="radio" name="tipo" value="PUNICAO" checked={tipo === "PUNICAO"} onChange={() => setTipo("PUNICAO")} />
            <span>
              <b>Aplicar punição</b>
            </span>
          </label>
          <label className={`radio-opt${tipo === "ARQUIVAMENTO" ? " checked" : ""}`}>
            <input type="radio" name="tipo" value="ARQUIVAMENTO" checked={tipo === "ARQUIVAMENTO"} onChange={() => setTipo("ARQUIVAMENTO")} />
            <span>
              <b>Arquivar</b>
            </span>
          </label>
        </fieldset>
        {tipo === "PUNICAO" ? (
          <>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="classificacao">Classificação</label>
                <select id="classificacao" name="classificacao" className="ctrl" defaultValue="">
                  <option value="">—</option>
                  <option value="LEVE">Leve</option>
                  <option value="MEDIA">Média</option>
                  <option value="GRAVE">Grave</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="punicao">Punição</label>
                <select id="punicao" name="punicao" className="ctrl" defaultValue="">
                  <option value="">—</option>
                  <option value="ADVERTENCIA">Advertência</option>
                  <option value="REPREENSAO">Repreensão</option>
                  <option value="DETENCAO">Detenção</option>
                  <option value="PRISAO">Prisão</option>
                  <option value="PRISAO_EM_SEPARADO">Prisão em separado</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="dias">Dias</label>
              <input id="dias" name="dias" type="number" min={0} className="ctrl" style={{ maxWidth: 140 }} />
            </div>
            <div className="form-grid-2">
              <div className="field">
                <label>Atenuantes</label>
                <CheckList name="atenuantes" itens={atenuantes} />
              </div>
              <div className="field">
                <label>Agravantes</label>
                <CheckList name="agravantes" itens={agravantes} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="comportamentoResultante">Comportamento resultante (opcional)</label>
              <select id="comportamentoResultante" name="comportamentoResultante" className="ctrl" defaultValue="">
                <option value="">Não alterar</option>
                <option value="EXCEPCIONAL">Excepcional</option>
                <option value="OTIMO">Ótimo</option>
                <option value="BOM">Bom</option>
                <option value="INSUFICIENTE">Insuficiente</option>
                <option value="MAU">Mau</option>
              </select>
            </div>
          </>
        ) : null}
        <fieldset className="radio-grid">
          <legend>Em relação ao relatório do oficial apurador</legend>
          <label className="radio-opt">
            <input type="radio" name="concordaComRelatorio" value="sim" defaultChecked />
            <span>
              <b>Concorda</b>
            </span>
          </label>
          <label className="radio-opt">
            <input type="radio" name="concordaComRelatorio" value="nao" />
            <span>
              <b>Diverge</b>
            </span>
          </label>
        </fieldset>
        <div className="field">
          <label htmlFor="fundamentacao">Fundamentação</label>
          <textarea id="fundamentacao" name="fundamentacao" className="ctrl" rows={6} required />
        </div>
        <SigNotice papel="Autoridade competente" />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Registrar decisão" />
      </div>
    </form>
  );
}

function FormJulgamentoReconsideracao({
  processoId,
  perfil,
  setPerfil,
  acao,
  onDone,
}: {
  processoId: string;
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
  acao: Acao;
  onDone: () => void;
}) {
  const [state, formAction] = useAcaoForm(julgarReconsideracaoAction, onDone);
  const [desfecho, setDesfecho] = useState("INDEFERIDO");
  return (
    <form action={formAction}>
      <div className="modal-body">
        <CampoOcultos processoId={processoId} perfil={perfil} />
        <SeletorPerfil acao={acao} perfil={perfil} setPerfil={setPerfil} />
        <div className="field">
          <label htmlFor="desfecho">Desfecho</label>
          <select id="desfecho" name="desfecho" className="ctrl" value={desfecho} onChange={(e) => setDesfecho(e.target.value)}>
            <option value="DEFERIDO">Deferido (arquivamento)</option>
            <option value="PARCIALMENTE_DEFERIDO">Parcialmente deferido</option>
            <option value="INDEFERIDO">Indeferido</option>
          </select>
        </div>
        {desfecho !== "DEFERIDO" ? (
          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="punicao">Punição</label>
              <select id="punicao" name="punicao" className="ctrl" defaultValue="">
                <option value="">Mantém a original</option>
                <option value="ADVERTENCIA">Advertência</option>
                <option value="REPREENSAO">Repreensão</option>
                <option value="DETENCAO">Detenção</option>
                <option value="PRISAO">Prisão</option>
                <option value="PRISAO_EM_SEPARADO">Prisão em separado</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="dias">Dias</label>
              <input id="dias" name="dias" type="number" min={0} className="ctrl" />
            </div>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="fundamentacao">Fundamentação</label>
          <textarea id="fundamentacao" name="fundamentacao" className="ctrl" rows={6} required />
        </div>
        <SigNotice papel="Autoridade competente" />
        <ErroAcao erro={state.erro} />
      </div>
      <div className="modal-foot">
        <BotaoConfirmar texto="Julgar reconsideração" />
      </div>
    </form>
  );
}
