"use client";

import { useState } from "react";
import { Aviso, Botao } from "@/components/ui/base";
import {
  CampoArea,
  CampoMarcadores,
  CampoOpcoes,
  CampoSelect,
  CampoTexto,
} from "@/components/ui/formulario";
import { IconeAssinatura } from "@/components/ui/icones";
import { Modal } from "@/components/ui/modal";
import { militarPorId, nomeCompleto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import {
  apresentarDefesa,
  autuar,
  decidir,
  declararPreclusao,
  emitirRelatorio,
  encerrarPorDecursoDePrazo,
  julgarReconsideracao,
  pedirReconsideracao,
  prorrogarPrazoDefesa,
  receberAutos,
  receberRelatorio,
  registrarCiencia,
  registrarCienciaDecisao,
  registrarCienciaNovaDecisao,
  registrarInquiricao,
  registrarRecusaDeCiencia,
  type AcaoDisponivel,
} from "@/lib/dominio/acoes";
import {
  AGRAVANTES,
  ATENUANTES,
  AVISO_CATALOGO,
  CLASSIFICACOES,
  COMPORTAMENTOS,
  ITENS_ART10,
  PUNICOES,
  alertasDeEnquadramento,
} from "@/lib/dominio/rdaer";
import type {
  Classificacao,
  Comportamento,
  Processo,
  TipoPunicao,
} from "@/lib/dominio/tipos";
import { ROTULO_PERFIL } from "@/lib/dominio/visibilidade";

/** Bloco de assinatura — torna visível o requisito RNF-03 em cada ato do processo. */
function BlocoAssinatura({ papel }: { papel: string }) {
  const { militar, conta } = useStore();
  return (
    <div className="rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium text-primary-800">
        <IconeAssinatura className="size-4" />
        Assinatura eletrônica
      </p>
      <p className="mt-1.5 text-sm text-neutral-800">
        {nomeCompleto(militar)} — {papel}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
        Perfil {ROTULO_PERFIL[conta.perfil]}. Ao confirmar, o ato é assinado no nível
        avançado da Lei nº 14.063/2020, com registro de identidade, data-hora e hash do
        documento na trilha de auditoria.
      </p>
    </div>
  );
}

export function ModalAcao({
  processo,
  acao,
  aoFechar,
}: {
  processo: Processo;
  acao: AcaoDisponivel;
  aoFechar: () => void;
}) {
  const { estado, aplicar, militar } = useStore();

  const apuradores = estado.contas
    .filter((c) => c.perfil === "APURADOR")
    .map((c) => c.militarId);
  // No piloto qualquer oficial pode ser designado; a lista traz os oficiais da OM.
  const oficiais = estado.militares.filter(
    (m) => m.id !== processo.arroladoId && /^(Cel|Ten Cel|Maj|Cap|1T|2T)/.test(m.postoGrad),
  );

  const [apuradorId, setApuradorId] = useState(
    processo.apuradorId ?? apuradores[0] ?? oficiais[0]?.id ?? "",
  );
  const [itens, setItens] = useState<string[]>(processo.itensArt10);
  const [relato, setRelato] = useState(processo.relatoFato);
  const [portaria, setPortaria] = useState("018/GC3/2026");
  const [boletim, setBoletim] = useState("142");
  const [texto, setTexto] = useState("");
  const [conclusao, setConclusao] = useState<"PROCEDENTE" | "IMPROCEDENTE">(
    "PROCEDENTE",
  );
  const [classificacao, setClassificacao] = useState<Classificacao>("MEDIA");
  const [atenuantes, setAtenuantes] = useState<string[]>([]);
  const [agravantes, setAgravantes] = useState<string[]>([]);
  const [punicao, setPunicao] = useState<TipoPunicao>(
    processo.relatorio?.propostaPunicao ?? "REPREENSAO",
  );
  const [dias, setDias] = useState(String(processo.relatorio?.propostaDias ?? 3));
  const [tipoDecisao, setTipoDecisao] = useState<"PUNICAO" | "ARQUIVAMENTO">(
    processo.relatorio?.conclusao === "IMPROCEDENTE" ? "ARQUIVAMENTO" : "PUNICAO",
  );
  const [concorda, setConcorda] = useState<"sim" | "nao">("sim");
  const [comportamento, setComportamento] = useState<Comportamento>(
    militarPorId(estado, processo.arroladoId)?.comportamento ?? "BOM",
  );
  const [desfecho, setDesfecho] = useState<
    "DEFERIDO" | "INDEFERIDO" | "PARCIALMENTE_DEFERIDO"
  >("INDEFERIDO");
  const [inqTipo, setInqTipo] = useState<"ARROLADO" | "TESTEMUNHA">("TESTEMUNHA");
  const [inqNome, setInqNome] = useState("");
  const [inqPosto, setInqPosto] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const arrolado = militarPorId(estado, processo.arroladoId);

  const exigir = (condicao: boolean, mensagem: string): boolean => {
    if (!condicao) {
      setErro(mensagem);
      return false;
    }
    return true;
  };

  function confirmar() {
    setErro(null);
    switch (acao.id) {
      case "AUTUAR":
        if (!exigir(itens.length > 0, "Selecione ao menos um item do art. 10 do RDAER."))
          return;
        if (!exigir(!!apuradorId, "Escolha o oficial apurador.")) return;
        if (!exigir(relato.trim().length > 20, "Descreva o fato com mais detalhe."))
          return;
        aplicar(processo.id, (p, ctx) =>
          autuar(p, ctx, {
            apuradorId,
            itensArt10: itens,
            relatoFato: relato.trim(),
            portaria,
            boletim,
          }),
        );
        break;

      case "REGISTRAR_CIENCIA":
        aplicar(processo.id, registrarCiencia);
        break;

      case "REGISTRAR_RECUSA":
        if (!exigir(texto.trim().length > 10, "Descreva as circunstâncias da recusa."))
          return;
        aplicar(processo.id, (p, ctx) =>
          registrarRecusaDeCiencia(p, ctx, texto.trim()),
        );
        break;

      case "APRESENTAR_DEFESA":
        if (!exigir(texto.trim().length > 20, "Escreva suas alegações de defesa."))
          return;
        aplicar(processo.id, (p, ctx) => apresentarDefesa(p, ctx, texto.trim()));
        break;

      case "PRORROGAR_DEFESA":
        if (!exigir(texto.trim().length > 10, "A prorrogação exige justificativa escrita."))
          return;
        aplicar(processo.id, (p, ctx) => prorrogarPrazoDefesa(p, ctx, texto.trim()));
        break;

      case "DECLARAR_PRECLUSAO":
        aplicar(processo.id, declararPreclusao);
        break;

      case "RECEBER_AUTOS":
        aplicar(processo.id, receberAutos);
        break;

      case "REGISTRAR_INQUIRICAO":
        if (!exigir(inqNome.trim().length > 3, "Informe o nome do inquirido.")) return;
        if (!exigir(texto.trim().length > 20, "Registre o teor do depoimento.")) return;
        aplicar(processo.id, (p, ctx) =>
          registrarInquiricao(p, ctx, {
            tipo: inqTipo,
            nomeInquirido: inqNome.trim(),
            postoInquirido: inqPosto.trim(),
            realizadaEm: ctx.data,
            depoimento: texto.trim(),
          }),
        );
        break;

      case "EMITIR_RELATORIO":
        if (!exigir(texto.trim().length > 40, "A análise do apurador é obrigatória."))
          return;
        aplicar(processo.id, (p, ctx) =>
          emitirRelatorio(p, ctx, {
            conclusao,
            classificacao: conclusao === "PROCEDENTE" ? classificacao : undefined,
            atenuantes,
            agravantes,
            analise: texto.trim(),
            propostaPunicao: conclusao === "PROCEDENTE" ? punicao : undefined,
            propostaDias:
              conclusao === "PROCEDENTE" && PUNICOES[punicao].privativaDeLiberdade
                ? Number(dias)
                : undefined,
          }),
        );
        break;

      case "RECEBER_RELATORIO":
        aplicar(processo.id, receberRelatorio);
        break;

      case "DECIDIR":
        if (!exigir(texto.trim().length > 30, "Fundamente a decisão.")) return;
        aplicar(processo.id, (p, ctx) =>
          decidir(p, ctx, {
            tipo: tipoDecisao,
            concordaComRelatorio: concorda === "sim",
            punicao: tipoDecisao === "PUNICAO" ? punicao : undefined,
            dias:
              tipoDecisao === "PUNICAO" && PUNICOES[punicao].privativaDeLiberdade
                ? Number(dias)
                : undefined,
            fundamentacao: texto.trim(),
            comportamentoResultante:
              tipoDecisao === "PUNICAO" ? comportamento : undefined,
          }),
        );
        break;

      case "REGISTRAR_CIENCIA_DECISAO":
        aplicar(processo.id, registrarCienciaDecisao);
        break;

      case "PEDIR_RECONSIDERACAO":
        if (!exigir(texto.trim().length > 20, "Informe as razões do pedido.")) return;
        aplicar(processo.id, (p, ctx) => pedirReconsideracao(p, ctx, texto.trim()));
        break;

      case "ENCERRAR_POR_PRAZO":
        aplicar(processo.id, encerrarPorDecursoDePrazo);
        break;

      case "JULGAR_RECONSIDERACAO":
        if (!exigir(texto.trim().length > 30, "Fundamente o julgamento.")) return;
        aplicar(processo.id, (p, ctx) =>
          julgarReconsideracao(p, ctx, {
            desfecho,
            fundamentacao: texto.trim(),
            punicao: desfecho === "DEFERIDO" ? undefined : punicao,
            dias:
              desfecho !== "DEFERIDO" && PUNICOES[punicao].privativaDeLiberdade
                ? Number(dias)
                : undefined,
          }),
        );
        break;

      case "REGISTRAR_CIENCIA_NOVA_DECISAO":
        aplicar(processo.id, registrarCienciaNovaDecisao);
        break;
    }
    aoFechar();
  }

  const alertas =
    acao.id === "EMITIR_RELATORIO"
      ? alertasDeEnquadramento(
          conclusao === "PROCEDENTE" ? classificacao : undefined,
          conclusao === "PROCEDENTE" ? punicao : undefined,
        )
      : acao.id === "DECIDIR"
        ? alertasDeEnquadramento(
            processo.relatorio?.classificacao,
            tipoDecisao === "PUNICAO" ? punicao : undefined,
          )
        : [];

  const papelAssinatura =
    acao.id === "DECIDIR" || acao.id === "JULGAR_RECONSIDERACAO"
      ? "Autoridade competente"
      : militar.id === processo.arroladoId
        ? "Militar Arrolado"
        : militar.id === processo.apuradorId
          ? "Oficial Apurador"
          : "Seção de Inquéritos e Justiça";

  return (
    <Modal
      titulo={acao.rotulo}
      descricao={acao.ajuda}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="sutil" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="primaria" onClick={confirmar}>
            <IconeAssinatura className="size-4" />
            Assinar e confirmar
          </Botao>
        </>
      }
    >
      {erro ? <Aviso tom="perigo">{erro}</Aviso> : null}

      {acao.id === "AUTUAR" ? (
        <>
          <CampoSelect
            rotulo="Oficial apurador"
            ajuda="Quem apura não pode ser a autoridade que aplica a punição no mesmo PATD (ICA 111-6, item 3.3)."
            valor={apuradorId}
            aoMudar={setApuradorId}
            obrigatorio
            opcoes={oficiais.map((m) => ({
              valor: m.id,
              rotulo: `${nomeCompleto(m)} — ${m.secao}`,
            }))}
          />
          <CampoArea
            rotulo="Relato do fato"
            ajuda="Descreva a conduta de forma clara e detalhada — este texto compõe o FATD."
            valor={relato}
            aoMudar={setRelato}
            obrigatorio
          />
          <CampoMarcadores
            rotulo="Enquadramento prévio — art. 10 do RDAER"
            ajuda={AVISO_CATALOGO}
            valores={itens}
            aoMudar={setItens}
            opcoes={ITENS_ART10.map((i) => ({
              valor: i.id,
              rotulo: `Item ${i.numero} — ${i.resumo}`,
            }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Portaria de designação"
              valor={portaria}
              aoMudar={setPortaria}
            />
            <CampoTexto
              rotulo="Boletim Interno Ostensivo nº"
              valor={boletim}
              aoMudar={setBoletim}
            />
          </div>
        </>
      ) : null}

      {acao.id === "REGISTRAR_CIENCIA" ? (
        <Aviso tom="info">
          Ao confirmar, você declara ter tomado conhecimento da imputação constante do
          FATD nº {processo.numero} e recebido cópia dos documentos que compõem os autos.
          Passa a correr o prazo de <strong>5 dias úteis</strong>, a contar do primeiro
          dia útil subsequente, para apresentar por escrito as alegações de defesa, sendo
          facultado constituir advogado e produzir provas.
        </Aviso>
      ) : null}

      {acao.id === "REGISTRAR_RECUSA" ? (
        <>
          <Aviso>
            A Certidão de Recusa (Anexo E) substitui a assinatura do arrolado. O prazo de
            defesa corre igualmente a partir desta data.
          </Aviso>
          <CampoArea
            rotulo="Circunstâncias da recusa"
            ajuda="Registre como a ciência foi dada e de que forma o militar se recusou a assinar."
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={5}
          />
        </>
      ) : null}

      {acao.id === "APRESENTAR_DEFESA" ? (
        <>
          <Aviso tom="info">
            Suas alegações compõem a folha de Alegações de Defesa (Anexo F) e serão
            juntadas aos autos.
          </Aviso>
          <CampoArea
            rotulo="Alegações de defesa"
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={10}
            placeholder="Descreva os fatos sob sua ótica, as justificativas e as provas que deseja produzir…"
          />
        </>
      ) : null}

      {acao.id === "PRORROGAR_DEFESA" ? (
        <CampoArea
          rotulo="Justificativa da prorrogação"
          ajuda="A prorrogação é de até 5 dias úteis e exige justificativa por escrito."
          valor={texto}
          aoMudar={setTexto}
          obrigatorio
          linhas={4}
        />
      ) : null}

      {acao.id === "DECLARAR_PRECLUSAO" ? (
        <Aviso>
          Certifica-se que transcorreu o prazo de 5 dias úteis sem que o militar arrolado
          apresentasse alegações de defesa. Será lavrada a Certidão de Preclusão
          (Anexo G) e o processo seguirá o rito previsto na ICA 111-6.
        </Aviso>
      ) : null}

      {acao.id === "RECEBER_AUTOS" ? (
        <Aviso tom="info">
          Ao assinar o recebimento dos autos você inicia o prazo de{" "}
          <strong>5 dias úteis</strong> para emitir o relatório (ICA 111-6, item 5.1.7).
        </Aviso>
      ) : null}

      {acao.id === "REGISTRAR_INQUIRICAO" ? (
        <>
          <CampoOpcoes
            rotulo="Quem será inquirido"
            valor={inqTipo}
            aoMudar={setInqTipo}
            opcoes={[
              {
                valor: "ARROLADO",
                rotulo: "Militar arrolado",
                descricao: "Anexo H — dispensado do compromisso de dizer a verdade",
              },
              {
                valor: "TESTEMUNHA",
                rotulo: "Testemunha",
                descricao: "Anexo Q — termo de inquirição de testemunha",
              },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Nome do inquirido"
              valor={
                inqTipo === "ARROLADO" ? (arrolado?.nome ?? inqNome) : inqNome
              }
              aoMudar={setInqNome}
              obrigatorio
            />
            <CampoTexto
              rotulo="Posto/graduação"
              valor={
                inqTipo === "ARROLADO"
                  ? `${arrolado?.postoGrad ?? ""} ${arrolado?.quadro ?? ""}`.trim()
                  : inqPosto
              }
              aoMudar={setInqPosto}
            />
          </div>
          <CampoArea
            rotulo="Teor do depoimento"
            ajuda="Registre na forma do termo: QUE …; QUE …"
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={8}
          />
        </>
      ) : null}

      {acao.id === "EMITIR_RELATORIO" ? (
        <>
          <CampoOpcoes
            rotulo="Conclusão da apuração"
            valor={conclusao}
            aoMudar={setConclusao}
            opcoes={[
              {
                valor: "PROCEDENTE",
                rotulo: "Transgressão caracterizada",
                descricao: "Propõe punição à autoridade competente",
              },
              {
                valor: "IMPROCEDENTE",
                rotulo: "Fatos justificados",
                descricao: "Propõe arquivamento (RDAER, art. 14)",
              },
            ]}
          />
          <CampoArea
            rotulo="Análise do apurador"
            ajuda="Fundamente a conclusão à luz dos documentos dos autos e das alegações de defesa."
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={8}
          />
          {conclusao === "PROCEDENTE" ? (
            <>
              <CampoSelect
                rotulo="Classificação da transgressão"
                ajuda="RDAER, arts. 11 e 12."
                valor={classificacao}
                aoMudar={setClassificacao}
                opcoes={(
                  Object.keys(CLASSIFICACOES) as Classificacao[]
                ).map((c) => ({ valor: c, rotulo: CLASSIFICACOES[c] }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoMarcadores
                  rotulo="Atenuantes (art. 13, nº 2)"
                  valores={atenuantes}
                  aoMudar={setAtenuantes}
                  opcoes={ATENUANTES.map((a) => ({
                    valor: a.id,
                    rotulo: `“${a.letra}” — ${a.resumo}`,
                  }))}
                />
                <CampoMarcadores
                  rotulo="Agravantes (art. 13, nº 3)"
                  valores={agravantes}
                  aoMudar={setAgravantes}
                  opcoes={AGRAVANTES.map((a) => ({
                    valor: a.id,
                    rotulo: `“${a.letra}” — ${a.resumo}`,
                  }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSelect
                  rotulo="Punição sugerida"
                  valor={punicao}
                  aoMudar={setPunicao}
                  opcoes={(Object.keys(PUNICOES) as TipoPunicao[]).map((p) => ({
                    valor: p,
                    rotulo: PUNICOES[p].rotulo,
                  }))}
                />
                {PUNICOES[punicao].privativaDeLiberdade ? (
                  <CampoTexto rotulo="Dias" valor={dias} aoMudar={setDias} />
                ) : null}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {acao.id === "RECEBER_RELATORIO" ? (
        <Aviso tom="info">
          Ao assinar o recebimento dos autos inicia-se o prazo de{" "}
          <strong>5 dias úteis</strong> para exarar a decisão (ICA 111-6, item 5.1.11).
        </Aviso>
      ) : null}

      {acao.id === "DECIDIR" ? (
        <>
          <CampoOpcoes
            rotulo="Manifestação sobre o relatório"
            valor={concorda}
            aoMudar={setConcorda}
            opcoes={[
              { valor: "sim", rotulo: "Concordo com o relatório" },
              { valor: "nao", rotulo: "Divirjo do relatório" },
            ]}
          />
          <CampoOpcoes
            rotulo="Decisão"
            valor={tipoDecisao}
            aoMudar={setTipoDecisao}
            opcoes={[
              {
                valor: "PUNICAO",
                rotulo: "Aplicar punição disciplinar",
                descricao: "Gera a Decisão (Anexo J) e a NPD (Anexo K)",
              },
              {
                valor: "ARQUIVAMENTO",
                rotulo: "Arquivar o processo",
                descricao: "Fatos justificados — RDAER, art. 14",
              },
            ]}
          />
          {tipoDecisao === "PUNICAO" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <CampoSelect
                    rotulo="Punição aplicada"
                    valor={punicao}
                    aoMudar={setPunicao}
                    opcoes={(Object.keys(PUNICOES) as TipoPunicao[]).map((p) => ({
                      valor: p,
                      rotulo: PUNICOES[p].rotulo,
                    }))}
                  />
                </div>
                {PUNICOES[punicao].privativaDeLiberdade ? (
                  <CampoTexto rotulo="Dias" valor={dias} aoMudar={setDias} />
                ) : null}
              </div>
              <CampoSelect
                rotulo="Comportamento resultante"
                valor={comportamento}
                aoMudar={setComportamento}
                opcoes={(Object.keys(COMPORTAMENTOS) as Comportamento[]).map((c) => ({
                  valor: c,
                  rotulo: COMPORTAMENTOS[c],
                }))}
              />
            </>
          ) : null}
          <CampoArea
            rotulo="Fundamentação da decisão"
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={6}
          />
        </>
      ) : null}

      {acao.id === "REGISTRAR_CIENCIA_DECISAO" ? (
        <Aviso tom="info">
          {processo.decisao?.tipo === "PUNICAO" ? (
            <>
              Ao confirmar, o militar arrolado assina a ciência da decisão e da Nota de
              Punição Disciplinar. Passa a correr o prazo de{" "}
              <strong>15 dias</strong> para eventual pedido de reconsideração
              (RDAER, art. 58).
            </>
          ) : (
            <>
              Ao confirmar, o militar arrolado assina a ciência da decisão de
              arquivamento e o processo é encerrado.
            </>
          )}
        </Aviso>
      ) : null}

      {acao.id === "PEDIR_RECONSIDERACAO" ? (
        <>
          <Aviso tom="info">
            O pedido é dirigido à autoridade que aplicou a punição (RDAER, arts. 58 e 59)
            e compõe o Anexo M dos autos.
          </Aviso>
          <CampoArea
            rotulo="Razões do pedido"
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={8}
          />
        </>
      ) : null}

      {acao.id === "ENCERRAR_POR_PRAZO" ? (
        <Aviso>
          Transcorridos 15 dias da ciência sem pedido de reconsideração. O processo será
          encerrado e o dossiê consolidado ficará disponível para arquivamento.
        </Aviso>
      ) : null}

      {acao.id === "JULGAR_RECONSIDERACAO" ? (
        <>
          <Aviso>
            A punição não pode ser agravada em sede de reconsideração sem fato novo
            devidamente apurado.
          </Aviso>
          <CampoOpcoes
            rotulo="Desfecho do pedido"
            valor={desfecho}
            aoMudar={setDesfecho}
            opcoes={[
              {
                valor: "INDEFERIDO",
                rotulo: "Indeferir",
                descricao: "Mantém a punição aplicada",
              },
              {
                valor: "PARCIALMENTE_DEFERIDO",
                rotulo: "Deferir em parte",
                descricao: "Abranda a punição",
              },
              {
                valor: "DEFERIDO",
                rotulo: "Deferir",
                descricao: "Torna sem efeito a punição e arquiva",
              },
            ]}
          />
          {desfecho !== "DEFERIDO" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <CampoSelect
                  rotulo="Punição após o julgamento"
                  valor={punicao}
                  aoMudar={setPunicao}
                  opcoes={(Object.keys(PUNICOES) as TipoPunicao[]).map((p) => ({
                    valor: p,
                    rotulo: PUNICOES[p].rotulo,
                  }))}
                />
              </div>
              {PUNICOES[punicao].privativaDeLiberdade ? (
                <CampoTexto rotulo="Dias" valor={dias} aoMudar={setDias} />
              ) : null}
            </div>
          ) : null}
          <CampoArea
            rotulo="Fundamentação"
            valor={texto}
            aoMudar={setTexto}
            obrigatorio
            linhas={6}
          />
        </>
      ) : null}

      {acao.id === "REGISTRAR_CIENCIA_NOVA_DECISAO" ? (
        <Aviso tom="info">
          Ao confirmar, o militar arrolado assina a ciência do julgamento do pedido de
          reconsideração e o processo é encerrado.
        </Aviso>
      ) : null}

      {alertas.length ? (
        <Aviso tom="aviso">
          <span className="font-medium">Atenção às travas do RDAER</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs">
            O sistema alerta, mas não bloqueia: a decisão permanece da autoridade.
          </p>
        </Aviso>
      ) : null}

      <BlocoAssinatura papel={papelAssinatura} />
    </Modal>
  );
}
