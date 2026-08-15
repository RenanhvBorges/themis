import {
  BlocoAssinatura,
  Fecho,
  Folha,
  Paragrafo,
  Quadro,
  Tarja,
  Timbre,
  TituloDocumento,
} from "./folha";
import { militarPorId, nomeCompleto } from "@/lib/dados/seed";
import { dataPorExtenso, formatarData } from "@/lib/dominio/prazos";
import {
  AGRAVANTES,
  ATENUANTES,
  CLASSIFICACOES,
  COMPORTAMENTOS,
  PUNICOES,
  itemPorId,
} from "@/lib/dominio/rdaer";
import type {
  Assinatura,
  Documento,
  EstadoSistema,
  Militar,
  Processo,
} from "@/lib/dominio/tipos";

interface Ctx {
  processo: Processo;
  documento: Documento;
  estado: EstadoSistema;
  arrolado?: Militar;
  apurador?: Militar;
  comandante?: Militar;
  local: string;
  data: string;
  rodape: string;
  /** False quando o documento vem depois de outro no dossiê — força quebra de página. */
  primeira: boolean;
  assinaturaDe: (papel: string) => Assinatura | undefined;
}

function identificacao(m?: Militar): string {
  if (!m) return "—";
  return [m.nome, [m.postoGrad, m.quadro].filter(Boolean).join(" ")].join(", ");
}

function listarItens(itens: string[]): string {
  const numeros = itens
    .map((i) => itemPorId(i)?.numero)
    .filter((n): n is number => typeof n === "number");
  if (!numeros.length) return "—";
  if (numeros.length === 1) return String(numeros[0]);
  return `${numeros.slice(0, -1).join(", ")} e ${numeros[numeros.length - 1]}`;
}

function letras(ids: string[], fonte: { id: string; letra: string }[]): string {
  const ls = ids
    .map((id) => fonte.find((x) => x.id === id)?.letra)
    .filter(Boolean) as string[];
  if (!ls.length) return "";
  return ls.map((l) => `“${l}”`).join(", ");
}

function frasePunicao(punicao?: string, dias?: number): string {
  if (!punicao) return "—";
  const rotulo = PUNICOES[punicao as keyof typeof PUNICOES]?.rotulo ?? punicao;
  return dias ? `${rotulo} de ${dias} (${porExtenso(dias)}) dias` : rotulo;
}

const NUMEROS = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito",
  "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
  "dezessete", "dezoito", "dezenove", "vinte",
];
function porExtenso(n: number): string {
  return NUMEROS[n] ?? String(n);
}

// ---------------------------------------------------------------------------

function Cabecalho({ c }: { c: Ctx }) {
  return (
    <>
      <Tarja />
      <Timbre om={c.estado.om} />
    </>
  );
}

function Origem({ c }: { c: Ctx }) {
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento
        subtitulo={`${c.processo.origem.tipo === "OFICIO" ? "Ofício" : c.processo.origem.tipo} nº ${c.processo.origem.numero}`}
      >
        Documento de origem
      </TituloDocumento>
      <Quadro titulo="Identificação do documento">
        <p>
          Protocolo COMAER: {c.processo.origem.protocoloComaer ?? "—"} · Data:{" "}
          {formatarData(c.processo.origem.data)}
        </p>
      </Quadro>
      <Paragrafo>{c.processo.relatoFato}</Paragrafo>
      <p className="mt-8 text-[9.5pt] italic">
        Peça digitalizada e anexada aos autos eletrônicos. O documento original permanece
        arquivado na Seção de Inquéritos e Justiça da Organização Militar.
      </p>
    </Folha>
  );
}

function Capa({ c }: { c: Ctx }) {
  return (
    <Folha primeira={c.primeira}>
      <Tarja />
      <Timbre om={c.estado.om} />
      <div className="mt-16 text-center">
        <h1 className="text-[13pt] font-bold uppercase">
          Processo de Apuração de Transgressão Disciplinar
        </h1>
        <p className="mt-4 text-[13pt] font-bold">Nº {c.processo.numero}</p>
      </div>
      <div className="mt-24 text-center">
        <p className="text-[11pt] font-bold uppercase">Militar arrolado</p>
        <p className="mx-auto mt-6 w-[13cm] border-t border-black pt-1">
          {nomeCompleto(c.arrolado)} — SARAM {c.arrolado?.saram}
        </p>
      </div>
      <div className="mt-16 text-center">
        <p className="text-[11pt] font-bold uppercase">Oficial apurador</p>
        <p className="mx-auto mt-6 w-[13cm] border-t border-black pt-1">
          {c.apurador ? `${nomeCompleto(c.apurador)} — SARAM ${c.apurador.saram}` : "—"}
        </p>
      </div>
    </Folha>
  );
}

function Despacho({ c }: { c: Ctx }) {
  const p = c.processo;
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento>Despacho de Abertura e Designação de Apurador</TituloDocumento>
      <Paragrafo>
        Considerando o disposto na Portaria nº {c.documento.dados.portaria ?? "___"},
        publicada no Boletim Interno Ostensivo nº {c.documento.dados.boletim ?? "___"},
        que designa oficiais para apurar transgressão disciplinar e autoridades para
        aplicar punição disciplinar no âmbito desta Organização Militar, c/c o item 3.1
        da ICA 111-6, aprovada pela Portaria GABAER nº 120/GC3, de 9 de julho de 2021,
        determino a abertura de Processo de Apuração de Transgressão Disciplinar (PATD),
        com a finalidade de apurar os fatos relatados no{" "}
        {p.origem.tipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origem.numero}
        {p.origem.protocoloComaer ? ` (Prot. COMAER nº ${p.origem.protocoloComaer})` : ""}
        , de {formatarData(p.origem.data)}.
      </Paragrafo>
      <Paragrafo>
        Designo o {nomeCompleto(c.apurador)} para, na condição de Oficial Apurador,
        efetuar a apuração da suposta transgressão disciplinar e propor solução à
        autoridade competente, com estrita observância dos procedimentos previstos na ICA
        111-6 e no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER); sem prejuízo das
        demais funções.
      </Paragrafo>
      <Paragrafo>Após apurados os fatos, voltem-me os autos para decisão.</Paragrafo>
      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.comandante)}
        papel={`Comandante da ${c.estado.om.nome}`}
        assinatura={c.assinaturaDe("Autoridade competente")}
      />
    </Folha>
  );
}

function Fatd({ c }: { c: Ctx }) {
  const p = c.processo;
  const ciencia = c.assinaturaDe("Militar Arrolado");

  return (
    <>
      <Folha primeira={c.primeira} rodape={`${c.rodape} — fls. 1/2`}>
        <Cabecalho c={c} />
        <TituloDocumento subtitulo={`FATD nº ${p.numero}`}>
          Formulário de Apuração de Transgressão Disciplinar
        </TituloDocumento>

        <Quadro titulo="Identificação do militar arrolado">
          <p>{identificacao(c.arrolado)}</p>
          <p>
            SARAM: {c.arrolado?.saram} &nbsp;·&nbsp; Seção/OM: {c.arrolado?.secao} /{" "}
            {c.estado.om.sigla}
          </p>
        </Quadro>

        <Quadro titulo="Identificação do oficial apurador">
          <p>{identificacao(c.apurador)}</p>
          <p>
            SARAM: {c.apurador?.saram} &nbsp;·&nbsp; Seção/OM: {c.apurador?.secao} /{" "}
            {c.estado.om.sigla}
          </p>
        </Quadro>

        <h2 className="mt-6 text-center text-[11pt] font-bold uppercase">
          Relato do fato
        </h2>

        <Paragrafo>
          Tendo chegado ao meu conhecimento, por intermédio do{" "}
          {p.origem.tipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origem.numero}
          {p.origem.protocoloComaer
            ? ` (Protocolo COMAER nº ${p.origem.protocoloComaer})`
            : ""}
          , de {formatarData(p.origem.data)}, a ocorrência a seguir descrita:
        </Paragrafo>

        <Paragrafo>{p.relatoFato}</Paragrafo>

        <Paragrafo>
          Em face de o fato narrado, em tese, constituir transgressão disciplinar, podendo
          ser enquadrada no(s) item(ns) {listarItens(p.itensArt10)}, do art. 10, do RDAER,
          encaminho ao senhor cópia da referida ocorrência para, querendo, manifestar-se no
          prazo de 05 (cinco) dias úteis, podendo constituir advogado e produzir quaisquer
          provas admitidas em direito para a defesa de seus interesses, em cumprimento ao
          art. 5º, inciso LV, da Constituição Federal, combinado com o caput do art. 34 do
          RDAER e com o item 4 da ICA 111-6.
        </Paragrafo>

        <Fecho texto={c.data} />
        <BlocoAssinatura
          nome={nomeCompleto(c.apurador)}
          papel="Oficial Apurador"
          assinatura={c.assinaturaDe("Oficial Apurador")}
        />
      </Folha>

      <Folha rodape={`${c.rodape} — fls. 2/2`}>
        <Tarja />
        <h2 className="mt-2 text-center text-[11pt] font-bold uppercase">
          Ciente do militar arrolado
        </h2>

        <Paragrafo>
          Eu, {nomeCompleto(c.arrolado)}, SARAM {c.arrolado?.saram}, declaro que tenho
          conhecimento de que me está sendo imputada a autoria dos atos acima e me foi
          concedido o prazo de 05 (cinco) dias úteis, a contar do primeiro dia útil
          subsequente a esta data, para apresentar, por escrito, as minhas alegações de
          defesa, nos termos do item 5.1.2, “b”, da ICA 111-6.
        </Paragrafo>

        <Paragrafo>
          Fui informado ainda que, caso não formule minhas alegações de defesa no prazo
          assinalado, o PATD seguirá o trâmite previsto na supracitada ICA 111-6.
        </Paragrafo>

        <Paragrafo>
          Outrossim, declaro que, neste ato, recebi cópia dos seguintes documentos que
          dizem respeito ao fato objeto da apuração:
        </Paragrafo>

        <ul className="mt-3 ml-[2.5cm] list-disc space-y-0.5">
          {c.processo.documentos
            .filter((d) => ["ORIGEM", "C", "B", "D"].includes(d.anexo))
            .map((d) => (
              <li key={d.id}>{d.titulo}</li>
            ))}
        </ul>

        {ciencia ? (
          <>
            <Fecho texto={dataPorExtenso(ciencia.assinadoEm.slice(0, 10), c.local)} />
            <BlocoAssinatura
              nome={nomeCompleto(c.arrolado)}
              papel="Militar Arrolado"
              assinatura={ciencia}
            />
          </>
        ) : (
          <>
            <Fecho texto={`${c.local}, ______ de ____________ de ______.`} />
            <BlocoAssinatura
              nome={nomeCompleto(c.arrolado)}
              papel="Militar Arrolado"
            />
            <p className="mt-6 text-center text-[9.5pt] italic">
              Ciência ainda não registrada no sistema.
            </p>
          </>
        )}
      </Folha>
    </>
  );
}

function CertidaoRecusa({ c }: { c: Ctx }) {
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento>Certidão de Recusa de Ciência</TituloDocumento>
      <Paragrafo>
        Certifico que, na presente data, foi dado conhecimento ao{" "}
        {nomeCompleto(c.arrolado)}, SARAM {c.arrolado?.saram}, de que lhe está sendo
        imputada a autoria dos atos descritos no FATD nº {c.processo.numero}, cujo
        conteúdo lhe foi lido, e informado ao militar arrolado que possui prazo de 05
        (cinco) dias úteis, a contar do primeiro dia útil subsequente a esta data, para
        apresentar, por escrito, as suas alegações de defesa, nos termos do item 5.1.2,
        “b”, da ICA 111-6.
      </Paragrafo>
      <Paragrafo>
        Todavia, apesar de ciente dos fatos, o militar arrolado recusou-se a assinar o
        termo de ciência do FATD nº {c.processo.numero}.
      </Paragrafo>
      {c.documento.dados.justificativa ? (
        <Paragrafo>{c.documento.dados.justificativa}</Paragrafo>
      ) : null}
      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.apurador)}
        papel="Oficial Apurador"
        assinatura={c.assinaturaDe("Oficial Apurador")}
      />
    </Folha>
  );
}

function Defesa({ c }: { c: Ctx }) {
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Tarja />
      <TituloDocumento subtitulo={`PATD nº ${c.processo.numero}`}>
        Alegações de Defesa
      </TituloDocumento>
      <div className="mt-6 text-justify whitespace-pre-line">
        {String(c.documento.dados.texto ?? c.processo.defesa?.texto ?? "")}
      </div>
      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.arrolado)}
        papel="Militar Arrolado"
        assinatura={c.assinaturaDe("Militar Arrolado")}
      />
    </Folha>
  );
}

function CertidaoPreclusao({ c }: { c: Ctx }) {
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento>Certidão de Preclusão</TituloDocumento>
      <Paragrafo>
        Certifico que transcorreu o prazo de 05 (cinco) dias úteis para defesa do{" "}
        {nomeCompleto(c.arrolado)}, SARAM {c.arrolado?.saram}, sem que o militar tenha
        apresentado suas alegações de defesa.
      </Paragrafo>
      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.apurador)}
        papel="Oficial Apurador"
        assinatura={c.assinaturaDe("Oficial Apurador")}
      />
      <p className="mt-8 text-center text-[9pt] italic">
        Nos autos eletrônicos, a fé pública do ato é assegurada pela assinatura eletrônica
        do oficial apurador e pelo registro imutável na trilha de auditoria do processo,
        que dispensa a subscrição por testemunhas.
      </p>
    </Folha>
  );
}

function TermoInquiricao({ c }: { c: Ctx }) {
  const inq = c.processo.inquiricoes.find(
    (i) => i.id === c.documento.dados.inquiricaoId,
  );
  const testemunha = c.documento.anexo === "Q";

  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento subtitulo={`PATD nº ${c.processo.numero}`}>
        {testemunha
          ? "Termo de Inquirição de Testemunha"
          : "Termo de Inquirição do Militar Arrolado"}
      </TituloDocumento>

      <p className="mt-4 text-center font-bold uppercase">
        {inq ? `${inq.postoInquirido} ${inq.nomeInquirido}` : "—"}
      </p>

      <Paragrafo>
        Aos {inq ? formatarData(inq.realizadaEm) : "___"}, nesta cidade de{" "}
        {c.estado.om.cidade}, Estado de {c.estado.om.uf}, na{" "}
        {c.estado.om.nome}, compareceu o(a) militar acima identificado(a), o(a) qual foi
        inquirido(a) na qualidade de{" "}
        {testemunha ? "testemunha" : "militar arrolado"} do PATD nº {c.processo.numero},
        {testemunha
          ? " prestando o compromisso legal de dizer a verdade sobre o fato-objeto do presente processo"
          : " portanto dispensado do compromisso de dizer a verdade sobre o fato-objeto do presente processo e resguardado o direito ao silêncio"}
        , que, depois de tudo que lhe foi lido, DISSE QUE:
      </Paragrafo>

      <div className="mt-3 text-justify whitespace-pre-line">
        {inq?.depoimento ?? "—"}
      </div>

      <Paragrafo>
        E como nada mais disse, nem lhe foi perguntado, dei por findo o presente Termo,
        que depois de lido e achado conforme, vai assinado eletronicamente pelo inquirido
        e por mim, Oficial Apurador, que o lavrei.
      </Paragrafo>

      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.apurador)}
        papel="Oficial Apurador"
        assinatura={c.assinaturaDe("Oficial Apurador")}
      />
      <div className="mt-8 text-center">
        <p className="mx-auto w-[9cm] border-t border-black pt-1">
          {inq ? `${inq.postoInquirido} ${inq.nomeInquirido}` : "—"}
        </p>
        <p>{testemunha ? "Testemunha" : "Militar Arrolado"}</p>
      </div>
    </Folha>
  );
}

function Relatorio({ c }: { c: Ctx }) {
  const p = c.processo;
  const r = p.relatorio;
  if (!r) return null;
  const procedente = r.conclusao === "PROCEDENTE";

  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento subtitulo={`PATD nº ${p.numero}`}>
        Relatório do Oficial Apurador
      </TituloDocumento>

      <Paragrafo>
        O presente PATD foi instaurado com a finalidade de apurar suposta transgressão
        disciplinar cometida pelo(a) {nomeCompleto(c.arrolado)}, SARAM{" "}
        {c.arrolado?.saram}, conforme a ocorrência relatada no{" "}
        {p.origem.tipo === "OFICIO" ? "Ofício" : "documento"} nº {p.origem.numero}, de{" "}
        {formatarData(p.origem.data)}, nos seguintes termos: {p.relatoFato}
      </Paragrafo>

      <Paragrafo>
        Cumprindo o preconizado no Decreto nº 76.322, de 22 de setembro de 1975 (RDAER),
        e na ICA 111-6, bem como observados os princípios constitucionais do contraditório
        e da ampla defesa, da presunção de inocência e do devido processo legal, deu-se a
        ciência da referida apuração ao militar arrolado em{" "}
        {formatarData(p.cienciaEm)}, sendo-lhe concedidos 5 (cinco) dias úteis para
        apresentar suas alegações de defesa.
      </Paragrafo>

      <Paragrafo>
        {p.defesa?.apresentada
          ? `Devidamente cientificado, o militar apresentou alegações de defesa em ${formatarData(
              p.defesa.apresentadaEm,
            )}, aduzindo, em síntese, o que consta da folha própria destes autos.`
          : "Apesar de devidamente cientificado, o militar arrolado não apresentou alegações de defesa, conforme Certidão de Preclusão constante dos autos."}
      </Paragrafo>

      <Paragrafo semRecuo>
        <span className="font-bold">É o relatório.</span>
      </Paragrafo>

      <Paragrafo>{r.analise}</Paragrafo>

      {procedente ? (
        <>
          <Paragrafo>
            Portanto, conclui-se que a conduta do {nomeCompleto(c.arrolado)} configura
            transgressão disciplinar, notadamente a(s) prevista(s) no(s) item(ns){" "}
            {listarItens(p.itensArt10)} do art. 10 do RDAER
            {r.atenuantes.length
              ? `, com atenuante das letras ${letras(r.atenuantes, ATENUANTES)}, do número 2`
              : ""}
            {r.agravantes.length
              ? `, e agravante das letras ${letras(r.agravantes, AGRAVANTES)}, do número 3`
              : ""}
            {r.atenuantes.length || r.agravantes.length ? ", do art. 13 do RDAER" : ""},
            ficando caracterizado o cometimento de transgressão disciplinar de natureza{" "}
            {r.classificacao ? CLASSIFICACOES[r.classificacao].toLowerCase() : "—"}.
          </Paragrafo>

          <Paragrafo>
            Ante o exposto, tendo em vista que o intuito fundamental da punição disciplinar
            é reeducar o militar para que possa refletir sobre sua conduta e readequá-la
            aos princípios e normas desta Organização Militar, este apurador{" "}
            <span className="font-bold">SUGERE</span> a aplicação da punição de{" "}
            {frasePunicao(r.propostaPunicao, r.propostaDias)}.
          </Paragrafo>
        </>
      ) : (
        <Paragrafo>
          Dessa forma, entende-se que as alegações apresentadas pelo militar possuem
          efeito justificador, nos termos do art. 13, número 1, do RDAER. Portanto, nos
          termos do art. 14 do RDAER, este apurador{" "}
          <span className="font-bold">SUGERE</span> o arquivamento do presente processo,
          por entender que os fatos objeto de apuração se encontram justificados.
        </Paragrafo>
      )}

      <Paragrafo>Remeto à autoridade competente para decisão.</Paragrafo>

      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.apurador)}
        papel="Oficial Apurador"
        assinatura={c.assinaturaDe("Oficial Apurador")}
      />
    </Folha>
  );
}

function Decisao({ c }: { c: Ctx }) {
  const p = c.processo;
  const d = p.decisao;
  if (!d) return null;
  const doReconsideracao = c.documento.dados.reconsideracao === "sim";
  const rec = p.reconsideracao;

  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento subtitulo={`PATD nº ${p.numero}`}>
        {doReconsideracao
          ? "Decisão em Pedido de Reconsideração"
          : "Decisão da Autoridade que Aplica a Punição Disciplinar"}
      </TituloDocumento>

      {doReconsideracao && rec ? (
        <>
          <Paragrafo>
            Vistos os autos do PATD nº {p.numero} e o pedido de reconsideração interposto
            pelo(a) {nomeCompleto(c.arrolado)} em {formatarData(rec.pedidoEm)}, decide-se
            por{" "}
            <span className="font-bold">
              {rec.desfecho === "DEFERIDO"
                ? "DEFERIR"
                : rec.desfecho === "PARCIALMENTE_DEFERIDO"
                  ? "DEFERIR PARCIALMENTE"
                  : "INDEFERIR"}
            </span>{" "}
            o pedido.
          </Paragrafo>
          <Paragrafo>{rec.fundamentacao}</Paragrafo>
          {d.tipo === "PUNICAO" ? (
            <Paragrafo>
              Em consequência, fica mantida em face do militar arrolado a punição de{" "}
              {frasePunicao(d.punicao, d.dias)}.
            </Paragrafo>
          ) : (
            <Paragrafo>
              Em consequência, torna-se sem efeito a punição aplicada e decide-se pelo
              arquivamento do processo, nos termos do art. 14 do RDAER.
            </Paragrafo>
          )}
        </>
      ) : d.tipo === "PUNICAO" ? (
        <>
          <Paragrafo>
            Diante da apuração feita e da análise das alegações apresentadas pelo militar
            sujeito à apuração disciplinar, em defesa da transgressão que lhe é imputada,
            bem como consideradas as circunstâncias em que os fatos ocorreram,{" "}
            {d.concordaComRelatorio ? "concorda-se" : "diverge-se"} com o relatório do
            oficial apurador e decide-se aplicar ao {nomeCompleto(c.arrolado)}, SARAM{" "}
            {c.arrolado?.saram}, a punição de {frasePunicao(d.punicao, d.dias)},
            enquadrando-se no(s) item(ns) {listarItens(p.itensArt10)}, do art. 10 do
            RDAER, transgressão{" "}
            {p.relatorio?.classificacao
              ? CLASSIFICACOES[p.relatorio.classificacao].toLowerCase()
              : "—"}
            {d.comportamentoResultante
              ? `; permanece no comportamento ${COMPORTAMENTOS[d.comportamentoResultante]}`
              : ""}
            .
          </Paragrafo>
          <Paragrafo>{d.fundamentacao}</Paragrafo>
        </>
      ) : (
        <>
          <Paragrafo>
            Diante da apuração feita e da análise das alegações de defesa e documentos
            apresentados pelo militar sujeito à apuração disciplinar, restou demonstrado
            que os fatos estão justificados. Desse modo, nos termos do art. 14 do RDAER,
            não há que se falar em cometimento de transgressão disciplinar, pelo que se{" "}
            {d.concordaComRelatorio ? "concorda" : "diverge"} com o relatório do oficial
            apurador e decide-se pelo arquivamento do processo.
          </Paragrafo>
          <Paragrafo>{d.fundamentacao}</Paragrafo>
        </>
      )}

      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.comandante)}
        papel={`Comandante da ${c.estado.om.nome}`}
        assinatura={c.assinaturaDe("Autoridade competente")}
      />

      <div className="mt-10 border-t border-black pt-4">
        <h2 className="text-center text-[10.5pt] font-bold uppercase">
          Ciência do militar arrolado
        </h2>
        <BlocoAssinatura
          nome={nomeCompleto(c.arrolado)}
          papel="Militar Arrolado"
          assinatura={c.assinaturaDe("Militar Arrolado")}
        />
      </div>
    </Folha>
  );
}

function Npd({ c }: { c: Ctx }) {
  const p = c.processo;
  const d = p.decisao;
  if (!d) return null;

  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Cabecalho c={c} />
      <TituloDocumento subtitulo={`PATD nº ${p.numero}`}>
        Nota de Punição Disciplinar
      </TituloDocumento>

      <Paragrafo>
        O {nomeCompleto(c.comandante)}, Comandante da {c.estado.om.nome}, faz saber ao{" "}
        {nomeCompleto(c.arrolado)}, SARAM {c.arrolado?.saram}, do efetivo desta
        Organização Militar, com lotação em {c.arrolado?.secao}, que o mesmo foi punido
        com{" "}
        {frasePunicao(d.punicao, d.dias)}, em razão do seguinte fato: {p.relatoFato}
      </Paragrafo>

      <Paragrafo>
        A conduta enquadra-se no(s) item(ns) {listarItens(p.itensArt10)}, do art. 10
        {p.relatorio?.atenuantes.length
          ? `, com atenuante das letras ${letras(p.relatorio.atenuantes, ATENUANTES)}, do número 2`
          : ""}
        {p.relatorio?.agravantes.length
          ? `, e agravante das letras ${letras(p.relatorio.agravantes, AGRAVANTES)}, do número 3`
          : ""}
        {p.relatorio?.atenuantes.length || p.relatorio?.agravantes.length
          ? ", do art. 13, ambos do RDAER"
          : ", do RDAER"}
        , transgressão{" "}
        {p.relatorio?.classificacao
          ? CLASSIFICACOES[p.relatorio.classificacao].toLowerCase()
          : "—"}
        {d.comportamentoResultante
          ? `; permanece no comportamento ${COMPORTAMENTOS[d.comportamentoResultante]}`
          : ""}
        .
      </Paragrafo>

      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.comandante)}
        papel={`Comandante da ${c.estado.om.nome}`}
        assinatura={c.assinaturaDe("Autoridade competente")}
      />

      <div className="mt-10 border-t border-black pt-4">
        <h2 className="text-center text-[10.5pt] font-bold uppercase">Termo de ciência</h2>
        <Paragrafo>
          Eu, {nomeCompleto(c.arrolado)}, SARAM {c.arrolado?.saram}, após ter sido ouvido
          pelo Oficial Apurador e ter apresentado as minhas razões de defesa, estou ciente
          da punição imposta, bem como da possibilidade de apresentar pedido de
          reconsideração, no prazo de 15 (quinze) dias, a contar da presente data, nos
          termos dos arts. 58 e 59 do RDAER.
        </Paragrafo>
        <BlocoAssinatura
          nome={nomeCompleto(c.arrolado)}
          papel="Militar Arrolado"
          assinatura={c.assinaturaDe("Militar Arrolado")}
        />
      </div>
    </Folha>
  );
}

function PedidoReconsideracao({ c }: { c: Ctx }) {
  const rec = c.processo.reconsideracao;
  return (
    <Folha primeira={c.primeira} rodape={c.rodape}>
      <Tarja />
      <TituloDocumento subtitulo={`PATD nº ${c.processo.numero}`}>
        Pedido de Reconsideração
      </TituloDocumento>

      <Quadro titulo="Identificação do militar arrolado">
        <p>{identificacao(c.arrolado)}</p>
        <p>
          SARAM: {c.arrolado?.saram} &nbsp;·&nbsp; Seção/OM: {c.arrolado?.secao} /{" "}
          {c.estado.om.sigla}
        </p>
      </Quadro>

      <Quadro titulo="Identificação da autoridade que aplicou a punição disciplinar">
        <p>{identificacao(c.comandante)}</p>
        <p>Seção/OM: Comando / {c.estado.om.sigla}</p>
      </Quadro>

      <h2 className="mt-6 text-center text-[11pt] font-bold uppercase">
        Das razões do pedido de reconsideração
      </h2>

      <div className="mt-3 text-justify whitespace-pre-line">
        {String(c.documento.dados.razoes ?? rec?.razoes ?? "")}
      </div>

      <Fecho texto={c.data} />
      <BlocoAssinatura
        nome={nomeCompleto(c.arrolado)}
        papel="Militar Arrolado"
        assinatura={c.assinaturaDe("Militar Arrolado")}
      />
    </Folha>
  );
}

// ---------------------------------------------------------------------------

export function RenderizarAnexo({
  processo,
  documento,
  estado,
  primeira = true,
}: {
  processo: Processo;
  documento: Documento;
  estado: EstadoSistema;
  primeira?: boolean;
}) {
  const local = `${estado.om.cidade}-${estado.om.uf}`;
  const c: Ctx = {
    processo,
    documento,
    estado,
    arrolado: militarPorId(estado, processo.arroladoId),
    apurador: militarPorId(estado, processo.apuradorId),
    comandante: militarPorId(estado, processo.comandanteId),
    local,
    data: dataPorExtenso(documento.criadoEm.slice(0, 10), local),
    rodape: `PATD nº ${processo.numero}`,
    primeira,
    assinaturaDe: (papel) => documento.assinaturas.find((a) => a.papel === papel),
  };

  switch (documento.anexo) {
    case "ORIGEM":
      return <Origem c={c} />;
    case "C":
      return <Capa c={c} />;
    case "B":
      return <Despacho c={c} />;
    case "D":
      return <Fatd c={c} />;
    case "E":
      return <CertidaoRecusa c={c} />;
    case "F":
      return <Defesa c={c} />;
    case "G":
      return <CertidaoPreclusao c={c} />;
    case "H":
    case "Q":
      return <TermoInquiricao c={c} />;
    case "I":
      return <Relatorio c={c} />;
    case "J":
      return <Decisao c={c} />;
    case "K":
      return <Npd c={c} />;
    case "M":
      return <PedidoReconsideracao c={c} />;
  }
}
