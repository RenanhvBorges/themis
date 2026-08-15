import type { ProcessoCompleto, DocumentoCompleto } from "@/lib/queries/processo-detalhe";
import { CLASSIFICACOES, COMPORTAMENTOS } from "@/lib/domain/catalogo";
import {
  Tarja,
  Timbre,
  TituloDoc,
  Quadro,
  SigBloco,
  Folha,
  Fecho,
  ItalNote,
  PersonName,
  H2Center,
  nomeCompleto,
  identificacaoDoc,
  listarItensNumeros,
  frasePunicao,
  letrasAtenuantes,
  letrasAgravantes,
  formatarData,
  dataPorExtenso,
} from "./helpers";

function assinaturaDe(documento: DocumentoCompleto, papel: string) {
  const a = documento.assinaturas.find((x) => x.papel === papel);
  return a ?? null;
}

interface Ctx {
  p: ProcessoCompleto;
  documento: DocumentoCompleto;
  local: string;
  data: string;
  rodape: string;
  dados: Record<string, unknown>;
}

function montarContexto(processo: ProcessoCompleto, documento: DocumentoCompleto): Ctx {
  const local = `${processo.om.cidade}-${processo.om.uf}`;
  return {
    p: processo,
    documento,
    local,
    data: dataPorExtenso(documento.criadoEm.toISOString().slice(0, 10), local),
    rodape: `PATD nº ${processo.numero}`,
    dados: (documento.dados as Record<string, unknown>) ?? {},
  };
}

function AnexoOrigem({ c }: { c: Ctx }) {
  const p = c.p;
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Documento de origem" subtitulo={`${p.origemTipo === "OFICIO" ? "Ofício" : p.origemTipo.replaceAll("_", " ")} nº ${p.origemNumero}`} />
      <Quadro titulo="Identificação do documento">
        <p>Data: {formatarData(p.origemData.toISOString().slice(0, 10))}</p>
      </Quadro>
      <p className="par">{p.relatoFato}</p>
      <ItalNote>Peça digitalizada e anexada aos autos eletrônicos. O documento original permanece arquivado na Seção de Inquéritos e Justiça da Organização Militar.</ItalNote>
    </Folha>
  );
}

function AnexoCapa({ c }: { c: Ctx }) {
  const p = c.p;
  return (
    <Folha>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <div style={{ marginTop: 64, textAlign: "center" }}>
        <h1 style={{ fontSize: "13pt", fontWeight: 700, textTransform: "uppercase" }}>Processo de Apuração de Transgressão Disciplinar</h1>
        <p style={{ marginTop: 16, fontSize: "13pt", fontWeight: 700 }}>Nº {p.numero}</p>
      </div>
      <div style={{ marginTop: 96, textAlign: "center" }}>
        <p style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase" }}>Militar arrolado</p>
        <PersonName>
          {nomeCompleto(p.arrolado)} — SARAM {p.arrolado.saram}
        </PersonName>
      </div>
      <div style={{ marginTop: 64, textAlign: "center" }}>
        <p style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase" }}>Oficial apurador</p>
        <PersonName>{p.apurador ? `${nomeCompleto(p.apurador)} — SARAM ${p.apurador.saram}` : "—"}</PersonName>
      </div>
    </Folha>
  );
}

function AnexoDespacho({ c }: { c: Ctx }) {
  const p = c.p;
  const portaria = String(c.dados.portaria ?? "___");
  const boletim = String(c.dados.boletim ?? "___");
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Despacho de Abertura e Designação de Apurador" />
      <p className="par">
        Considerando o disposto na Portaria nº {portaria}, publicada no Boletim Interno Ostensivo nº {boletim}, que designa oficiais para apurar
        transgressão disciplinar e autoridades para aplicar punição disciplinar no âmbito desta Organização Militar, c/c o item 3.1 da ICA 111-6,
        aprovada pela Portaria GABAER nº 120/GC3, de 9 de julho de 2021, determino a abertura de Processo de Apuração de Transgressão Disciplinar
        (PATD), com a finalidade de apurar os fatos relatados no {p.origemTipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origemNumero}, de{" "}
        {formatarData(p.origemData.toISOString().slice(0, 10))}.
      </p>
      <p className="par">
        Designo o {nomeCompleto(p.apurador)} para, na condição de Oficial Apurador, efetuar a apuração da suposta transgressão disciplinar e propor
        solução à autoridade competente, com estrita observância dos procedimentos previstos na ICA 111-6 e no Decreto nº 76.322, de 22 de setembro
        de 1975 (RDAER); sem prejuízo das demais funções.
      </p>
      <p className="par">Após apurados os fatos, voltem-me os autos para decisão.</p>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.comandante)} papel={`Comandante da ${p.om.nome}`} assinatura={assinaturaDe(c.documento, "Autoridade competente")} />
    </Folha>
  );
}

function AnexoFatd({ c }: { c: Ctx }) {
  const p = c.p;
  const ciencia = assinaturaDe(c.documento, "Militar Arrolado");
  const listaDocs = p.documentos.filter((d) => ["ORIGEM", "C", "B", "D"].includes(d.anexo));
  return (
    <>
      <Folha rodape={`${c.rodape} — fls. 1/2`}>
        <Tarja />
        <Timbre omNome={p.om.nome} />
        <TituloDoc titulo="Formulário de Apuração de Transgressão Disciplinar" subtitulo={`FATD nº ${p.numero}`} />
        <Quadro titulo="Identificação do militar arrolado">
          <p>{identificacaoDoc(p.arrolado)}</p>
          <p>
            SARAM: {p.arrolado.saram} &nbsp;·&nbsp; Seção/OM: {p.arrolado.secao} / {p.om.sigla}
          </p>
        </Quadro>
        <Quadro titulo="Identificação do oficial apurador">
          <p>{identificacaoDoc(p.apurador)}</p>
          <p>
            SARAM: {p.apurador?.saram} &nbsp;·&nbsp; Seção/OM: {p.apurador?.secao} / {p.om.sigla}
          </p>
        </Quadro>
        <H2Center>Relato do fato</H2Center>
        <p className="par">
          Tendo chegado ao meu conhecimento, por intermédio do {p.origemTipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origemNumero}, de{" "}
          {formatarData(p.origemData.toISOString().slice(0, 10))}, a ocorrência a seguir descrita:
        </p>
        <p className="par">{p.relatoFato}</p>
        <p className="par">
          Em face de o fato narrado, em tese, constituir transgressão disciplinar, podendo ser enquadrada no(s) item(ns) {listarItensNumeros(p.itensArt10)},
          do art. 10, do RDAER, encaminho ao senhor cópia da referida ocorrência para, querendo, manifestar-se no prazo de 05 (cinco) dias úteis, podendo
          constituir advogado e produzir quaisquer provas admitidas em direito para a defesa de seus interesses, em cumprimento ao art. 5º, inciso LV, da
          Constituição Federal, combinado com o caput do art. 34 do RDAER e com o item 4 da ICA 111-6.
        </p>
        <Fecho data={c.data} />
        <SigBloco nome={nomeCompleto(p.apurador)} papel="Oficial Apurador" assinatura={assinaturaDe(c.documento, "Oficial Apurador")} />
      </Folha>
      <Folha rodape={`${c.rodape} — fls. 2/2`}>
        <Tarja />
        <H2Center>Ciente do militar arrolado</H2Center>
        <p className="par">
          Eu, {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, declaro que tenho conhecimento de que me está sendo imputada a autoria dos atos
          acima e me foi concedido o prazo de 05 (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para apresentar, por
          escrito, as minhas alegações de defesa, nos termos do item 5.1.2, &quot;b&quot;, da ICA 111-6.
        </p>
        <p className="par">Fui informado ainda que, caso não formule minhas alegações de defesa no prazo assinalado, o PATD seguirá o trâmite previsto na supracitada ICA 111-6.</p>
        <p className="par">Outrossim, declaro que, neste ato, recebi cópia dos seguintes documentos que dizem respeito ao fato objeto da apuração:</p>
        <ul className="doc-list">
          {listaDocs.map((d) => (
            <li key={d.id}>{d.titulo}</li>
          ))}
        </ul>
        {ciencia ? (
          <>
            <Fecho data={dataPorExtenso(ciencia.assinadoEm.toISOString().slice(0, 10), c.local)} />
            <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={ciencia} />
          </>
        ) : (
          <>
            <Fecho data={`${c.local}, ______ de ____________ de ______.`} />
            <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={null} />
            <ItalNote>Ciência ainda não registrada no sistema.</ItalNote>
          </>
        )}
      </Folha>
    </>
  );
}

function AnexoCertidaoRecusa({ c }: { c: Ctx }) {
  const p = c.p;
  const justificativa = c.dados.justificativa ? String(c.dados.justificativa) : "";
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Certidão de Recusa de Ciência" />
      <p className="par">
        Certifico que, na presente data, foi dado conhecimento ao {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, de que lhe está sendo
        imputada a autoria dos atos descritos no FATD nº {p.numero}, cujo conteúdo lhe foi lido, e informado ao militar arrolado que possui prazo de
        05 (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para apresentar, por escrito, as suas alegações de defesa, nos
        termos do item 5.1.2, &quot;b&quot;, da ICA 111-6.
      </p>
      <p className="par">Todavia, apesar de ciente dos fatos, o militar arrolado recusou-se a assinar o termo de ciência do FATD nº {p.numero}.</p>
      {justificativa ? <p className="par">{justificativa}</p> : null}
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.apurador)} papel="Oficial Apurador" assinatura={assinaturaDe(c.documento, "Oficial Apurador")} />
    </Folha>
  );
}

function AnexoDefesa({ c }: { c: Ctx }) {
  const p = c.p;
  const texto = c.dados.texto ? String(c.dados.texto) : p.defesa?.texto ?? "";
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <TituloDoc titulo="Alegações de Defesa" subtitulo={`PATD nº ${p.numero}`} />
      <div style={{ marginTop: 24, textAlign: "justify", whiteSpace: "pre-wrap" }}>{texto}</div>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={assinaturaDe(c.documento, "Militar Arrolado")} />
    </Folha>
  );
}

function AnexoCertidaoPreclusao({ c }: { c: Ctx }) {
  const p = c.p;
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Certidão de Preclusão" />
      <p className="par">
        Certifico que transcorreu o prazo de 05 (cinco) dias úteis para defesa do {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, sem que o
        militar tenha apresentado suas alegações de defesa.
      </p>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.apurador)} papel="Oficial Apurador" assinatura={assinaturaDe(c.documento, "Oficial Apurador")} />
      <ItalNote>
        Nos autos eletrônicos, a fé pública do ato é assegurada pela assinatura eletrônica do oficial apurador e pelo registro imutável na trilha de
        auditoria do processo, que dispensa a subscrição por testemunhas.
      </ItalNote>
    </Folha>
  );
}

function AnexoTermoInquiricao({ c }: { c: Ctx }) {
  const p = c.p;
  const inq = p.inquiricoes.find((i) => i.id === c.dados.inquiricaoId);
  const testemunha = c.documento.anexo === "Q";
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo={testemunha ? "Termo de Inquirição de Testemunha" : "Termo de Inquirição do Militar Arrolado"} subtitulo={`PATD nº ${p.numero}`} />
      <PersonName>{inq ? `${inq.postoInquirido} ${inq.nomeInquirido}` : "—"}</PersonName>
      <p className="par">
        Aos {inq ? formatarData(inq.registradoEm.toISOString().slice(0, 10)) : "___"}, nesta cidade de {p.om.cidade}, Estado de {p.om.uf}, na{" "}
        {p.om.nome}, compareceu o(a) militar acima identificado(a), o(a) qual foi inquirido(a) na qualidade de {testemunha ? "testemunha" : "militar arrolado"}{" "}
        do PATD nº {p.numero},{" "}
        {testemunha
          ? "prestando o compromisso legal de dizer a verdade sobre o fato-objeto do presente processo"
          : "portanto dispensado do compromisso de dizer a verdade sobre o fato-objeto do presente processo e resguardado o direito ao silêncio"}
        , que, depois de tudo que lhe foi lido, DISSE QUE:
      </p>
      <div style={{ marginTop: 10, textAlign: "justify", whiteSpace: "pre-wrap" }}>{inq ? inq.texto : "—"}</div>
      <p className="par">
        E como nada mais disse, nem lhe foi perguntado, dei por findo o presente Termo, que depois de lido e achado conforme, vai assinado
        eletronicamente pelo inquirido e por mim, Oficial Apurador, que o lavrei.
      </p>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.apurador)} papel="Oficial Apurador" assinatura={assinaturaDe(c.documento, "Oficial Apurador")} />
      <div className="sig-manual">
        <div className="line">{inq ? `${inq.postoInquirido} ${inq.nomeInquirido}` : "—"}</div>
        <div>{testemunha ? "Testemunha" : "Militar Arrolado"}</div>
      </div>
    </Folha>
  );
}

function AnexoRelatorio({ c }: { c: Ctx }) {
  const p = c.p;
  const r = p.relatorio;
  if (!r) return null;
  const procedente = r.conclusao === "PROCEDENTE";
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Relatório do Oficial Apurador" subtitulo={`PATD nº ${p.numero}`} />
      <p className="par">
        O presente PATD foi instaurado com a finalidade de apurar suposta transgressão disciplinar cometida pelo(a) {nomeCompleto(p.arrolado)}, SARAM{" "}
        {p.arrolado.saram}, conforme a ocorrência relatada no {p.origemTipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origemNumero}, de{" "}
        {formatarData(p.origemData.toISOString().slice(0, 10))}: {p.relatoFato}
      </p>
      <p className="par">
        Cumprindo o preconizado no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER), e na ICA 111-6, bem como observados os princípios
        constitucionais do contraditório e da ampla defesa, da presunção de inocência e do devido processo legal, deu-se a ciência da referida
        apuração ao militar arrolado em {formatarData(p.cienciaEm?.toISOString().slice(0, 10))}, sendo-lhe concedidos 5 (cinco) dias úteis para
        apresentar suas alegações de defesa.
      </p>
      <p className="par">
        {p.defesa?.apresentada
          ? `Devidamente cientificado, o militar apresentou alegações de defesa em ${formatarData(p.defesa.apresentadaEm?.toISOString().slice(0, 10))}, aduzindo, em síntese, o que consta da folha própria destes autos.`
          : "Apesar de devidamente cientificado, o militar arrolado não apresentou alegações de defesa, conforme Certidão de Preclusão constante dos autos."}
      </p>
      <p className="par no-indent">
        <b>É o relatório.</b>
      </p>
      <p className="par">{r.fundamentacao}</p>
      {procedente ? (
        <>
          <p className="par">
            Portanto, conclui-se que a conduta do {nomeCompleto(p.arrolado)} configura transgressão disciplinar, notadamente a(s) prevista(s) no(s)
            item(ns) {listarItensNumeros(r.itensConfirmados)} do art. 10 do RDAER
            {r.atenuantes.length ? `, com atenuante das letras ${letrasAtenuantes(r.atenuantes)}, do número 2` : ""}
            {r.agravantes.length ? `, e agravante das letras ${letrasAgravantes(r.agravantes)}, do número 3` : ""}
            {r.atenuantes.length || r.agravantes.length ? ", do art. 13 do RDAER" : ""}, ficando caracterizado o cometimento de transgressão
            disciplinar de natureza {r.classificacao ? CLASSIFICACOES[r.classificacao].toLowerCase() : "—"}.
          </p>
          <p className="par">
            Ante o exposto, tendo em vista que o intuito fundamental da punição disciplinar é reeducar o militar para que possa refletir sobre sua
            conduta e readequá-la aos princípios e normas desta Organização Militar, este apurador <b>SUGERE</b> a aplicação da punição de{" "}
            {frasePunicao(r.recomendacaoPunicao, r.recomendacaoDias)}.
          </p>
        </>
      ) : (
        <p className="par">
          Dessa forma, entende-se que as alegações apresentadas pelo militar possuem efeito justificador, nos termos do art. 13, número 1, do RDAER.
          Portanto, nos termos do art. 14 do RDAER, este apurador <b>SUGERE</b> o arquivamento do presente processo, por entender que os fatos objeto
          de apuração se encontram justificados.
        </p>
      )}
      <p className="par">Remeto à autoridade competente para decisão.</p>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.apurador)} papel="Oficial Apurador" assinatura={assinaturaDe(c.documento, "Oficial Apurador")} />
    </Folha>
  );
}

function AnexoDecisao({ c }: { c: Ctx }) {
  const p = c.p;
  const d = p.decisao;
  if (!d) return null;
  const doReconsideracao = c.dados.reconsideracao === "sim";
  const rec = p.reconsideracao;
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo={doReconsideracao ? "Decisão em Pedido de Reconsideração" : "Decisão da Autoridade que Aplica a Punição Disciplinar"} subtitulo={`PATD nº ${p.numero}`} />
      {doReconsideracao && rec ? (
        <>
          <p className="par">
            Vistos os autos do PATD nº {p.numero} e o pedido de reconsideração interposto pelo(a) {nomeCompleto(p.arrolado)} em{" "}
            {formatarData(rec.pedidoEm.toISOString().slice(0, 10))}, decide-se por{" "}
            <b>{rec.desfecho === "DEFERIDO" ? "DEFERIR" : rec.desfecho === "PARCIALMENTE_DEFERIDO" ? "DEFERIR PARCIALMENTE" : "INDEFERIR"}</b> o
            pedido.
          </p>
          <p className="par">{rec.fundamentacao}</p>
          {d.tipo === "PUNICAO" ? (
            <p className="par">Em consequência, fica mantida em face do militar arrolado a punição de {frasePunicao(d.punicao, d.dias)}.</p>
          ) : (
            <p className="par">Em consequência, torna-se sem efeito a punição aplicada e decide-se pelo arquivamento do processo, nos termos do art. 14 do RDAER.</p>
          )}
        </>
      ) : d.tipo === "PUNICAO" ? (
        <>
          <p className="par">
            Diante da apuração feita e da análise das alegações apresentadas pelo militar sujeito à apuração disciplinar, em defesa da transgressão
            que lhe é imputada, bem como consideradas as circunstâncias em que os fatos ocorreram, {d.concordaComRelatorio ? "concorda-se" : "diverge-se"}{" "}
            com o relatório do oficial apurador e decide-se aplicar ao {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, a punição de{" "}
            {frasePunicao(d.punicao, d.dias)}, enquadrando-se no(s) item(ns) {listarItensNumeros(p.itensArt10)}, do art. 10 do RDAER, transgressão{" "}
            {p.relatorio?.classificacao ? CLASSIFICACOES[p.relatorio.classificacao].toLowerCase() : "—"}
            {d.comportamentoResultante ? `; permanece no comportamento ${COMPORTAMENTOS[d.comportamentoResultante]}` : ""}.
          </p>
          <p className="par">{d.fundamentacao}</p>
        </>
      ) : (
        <>
          <p className="par">
            Diante da apuração feita e da análise das alegações de defesa e documentos apresentados pelo militar sujeito à apuração disciplinar,
            restou demonstrado que os fatos estão justificados. Desse modo, nos termos do art. 14 do RDAER, não há que se falar em cometimento de
            transgressão disciplinar, pelo que se {d.concordaComRelatorio ? "concorda" : "diverge"} com o relatório do oficial apurador e decide-se
            pelo arquivamento do processo.
          </p>
          <p className="par">{d.fundamentacao}</p>
        </>
      )}
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.comandante)} papel={`Comandante da ${p.om.nome}`} assinatura={assinaturaDe(c.documento, "Autoridade competente")} />
      <div style={{ marginTop: 30, borderTop: "1px solid #000", paddingTop: 12 }}>
        <H2Center>Ciência do militar arrolado</H2Center>
        <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={assinaturaDe(c.documento, "Militar Arrolado")} />
      </div>
    </Folha>
  );
}

function AnexoNpd({ c }: { c: Ctx }) {
  const p = c.p;
  const d = p.decisao;
  if (!d) return null;
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <Timbre omNome={p.om.nome} />
      <TituloDoc titulo="Nota de Punição Disciplinar" subtitulo={`PATD nº ${p.numero}`} />
      <p className="par">
        O {nomeCompleto(p.comandante)}, Comandante da {p.om.nome}, faz saber ao {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, do efetivo
        desta Organização Militar, com lotação em {p.arrolado.secao}, que o mesmo foi punido com {frasePunicao(d.punicao, d.dias)}, em razão do
        seguinte fato: {p.relatoFato}
      </p>
      <p className="par">
        A conduta enquadra-se no(s) item(ns) {listarItensNumeros(p.itensArt10)}, do art. 10
        {p.relatorio?.atenuantes.length ? `, com atenuante das letras ${letrasAtenuantes(p.relatorio.atenuantes)}, do número 2` : ""}
        {p.relatorio?.agravantes.length ? `, e agravante das letras ${letrasAgravantes(p.relatorio.agravantes)}, do número 3` : ""}
        {p.relatorio && (p.relatorio.atenuantes.length || p.relatorio.agravantes.length) ? ", do art. 13, ambos do RDAER" : ", do RDAER"}, transgressão{" "}
        {p.relatorio?.classificacao ? CLASSIFICACOES[p.relatorio.classificacao].toLowerCase() : "—"}
        {d.comportamentoResultante ? `; permanece no comportamento ${COMPORTAMENTOS[d.comportamentoResultante]}` : ""}.
      </p>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.comandante)} papel={`Comandante da ${p.om.nome}`} assinatura={assinaturaDe(c.documento, "Autoridade competente")} />
      <div style={{ marginTop: 30, borderTop: "1px solid #000", paddingTop: 12 }}>
        <H2Center>Termo de ciência</H2Center>
        <p className="par">
          Eu, {nomeCompleto(p.arrolado)}, SARAM {p.arrolado.saram}, após ter sido ouvido pelo Oficial Apurador e ter apresentado as minhas razões de
          defesa, estou ciente da punição imposta, bem como da possibilidade de apresentar pedido de reconsideração, no prazo de 15 (quinze) dias, a
          contar da presente data, nos termos dos arts. 58 e 59 do RDAER.
        </p>
        <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={assinaturaDe(c.documento, "Militar Arrolado")} />
      </div>
    </Folha>
  );
}

function AnexoPedidoReconsideracao({ c }: { c: Ctx }) {
  const p = c.p;
  const rec = p.reconsideracao;
  const razoes = c.dados.razoes ? String(c.dados.razoes) : rec?.razoes ?? "";
  return (
    <Folha rodape={c.rodape}>
      <Tarja />
      <TituloDoc titulo="Pedido de Reconsideração" subtitulo={`PATD nº ${p.numero}`} />
      <Quadro titulo="Identificação do militar arrolado">
        <p>{identificacaoDoc(p.arrolado)}</p>
        <p>
          SARAM: {p.arrolado.saram} &nbsp;·&nbsp; Seção/OM: {p.arrolado.secao} / {p.om.sigla}
        </p>
      </Quadro>
      <Quadro titulo="Identificação da autoridade que aplicou a punição disciplinar">
        <p>{identificacaoDoc(p.comandante)}</p>
        <p>Seção/OM: Comando / {p.om.sigla}</p>
      </Quadro>
      <H2Center>Das razões do pedido de reconsideração</H2Center>
      <div style={{ marginTop: 10, textAlign: "justify", whiteSpace: "pre-wrap" }}>{razoes}</div>
      <Fecho data={c.data} />
      <SigBloco nome={nomeCompleto(p.arrolado)} papel="Militar Arrolado" assinatura={assinaturaDe(c.documento, "Militar Arrolado")} />
    </Folha>
  );
}

export function AnexoDocumento({ processo, documento }: { processo: ProcessoCompleto; documento: DocumentoCompleto }) {
  const c = montarContexto(processo, documento);
  switch (documento.anexo) {
    case "ORIGEM":
      return <AnexoOrigem c={c} />;
    case "C":
      return <AnexoCapa c={c} />;
    case "B":
      return <AnexoDespacho c={c} />;
    case "D":
      return <AnexoFatd c={c} />;
    case "E":
      return <AnexoCertidaoRecusa c={c} />;
    case "F":
      return <AnexoDefesa c={c} />;
    case "G":
      return <AnexoCertidaoPreclusao c={c} />;
    case "H":
    case "Q":
      return <AnexoTermoInquiricao c={c} />;
    case "I":
      return <AnexoRelatorio c={c} />;
    case "J":
      return <AnexoDecisao c={c} />;
    case "K":
      return <AnexoNpd c={c} />;
    case "M":
      return <AnexoPedidoReconsideracao c={c} />;
    default:
      return null;
  }
}
