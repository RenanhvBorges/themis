/**
 * Massa de demonstração.
 *
 * TODOS OS DADOS SÃO FICTÍCIOS — nomes, SARAM, fatos e decisões foram inventados para
 * a demonstração. Nenhum processo real da FAB está representado aqui.
 *
 * Os processos não são escritos "prontos": partem do estado inicial e são avançados
 * pelas mesmas transições de `lib/dominio/acoes.ts` que a interface usa. Assim a linha
 * do tempo, os documentos, as assinaturas e os prazos da massa de teste são coerentes
 * com as regras — e um bug nas regras aparece já na tela inicial.
 */

import {
  apresentarDefesa,
  autuar,
  decidir,
  declararPreclusao,
  emitirRelatorio,
  julgarReconsideracao,
  pedirReconsideracao,
  receberAutos,
  receberRelatorio,
  registrarCiencia,
  registrarCienciaDecisao,
  registrarCienciaNovaDecisao,
  registrarInquiricao,
  type Contexto,
  type DadosDecisao,
  type DadosRelatorio,
} from "@/lib/dominio/acoes";
import { calcularVencimento } from "@/lib/dominio/prazos";
import type {
  Conta,
  EstadoSistema,
  Militar,
  OrganizacaoMilitar,
  Origem,
  Perfil,
  Processo,
  StatusProcesso,
} from "@/lib/dominio/tipos";
import { comHora, voltarDiasUteis } from "./util";

export const OM: OrganizacaoMilitar = {
  id: "om-baan",
  sigla: "BAAN",
  nome: "Base Aérea de Anápolis",
  cidade: "Anápolis",
  uf: "GO",
};

export const CMT = "mil-cmt";
export const ADM = "mil-adm";

export const MILITARES: Militar[] = [
  { id: CMT, nome: "Ricardo Amaral Fontes", postoGrad: "Cel Av", quadro: "", saram: "1902447", secao: "Comando", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: ADM, nome: "Vanessa Prado Lisboa", postoGrad: "1S", quadro: "SAD", saram: "3114682", secao: "Seção de Inquéritos e Justiça", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: "mil-ap1", nome: "Bruno Sarmento Vilela", postoGrad: "Cap Int", quadro: "", saram: "2408173", secao: "Esquadrão de Intendência", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: "mil-ap2", nome: "Carla Menezes Duarte", postoGrad: "1T Com", quadro: "", saram: "2611904", secao: "Esquadrão de Apoio", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: "mil-ap3", nome: "Diego Rocha Pimentel", postoGrad: "Maj Av", quadro: "", saram: "2203518", secao: "Esquadrão de Operações", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: "mil-01", nome: "Anderson Muniz Reis", postoGrad: "3S", quadro: "BCT", saram: "4207715", secao: "Destacamento de Controle do Espaço Aéreo", omId: OM.id, comportamento: "BOM" },
  { id: "mil-02", nome: "Felipe Toledo Barros", postoGrad: "Cb", quadro: "SAD", saram: "4419230", secao: "Esquadrão de Intendência", omId: OM.id, comportamento: "INSUFICIENTE" },
  { id: "mil-03", nome: "Marina Coelho Antunes", postoGrad: "S1", quadro: "SGS", saram: "4502866", secao: "Esquadrão de Segurança e Defesa", omId: OM.id, comportamento: "BOM" },
  { id: "mil-04", nome: "Rafael Nogueira Pires", postoGrad: "2S", quadro: "BMA", saram: "3908144", secao: "Esquadrão de Manutenção de Aeronaves", omId: OM.id, comportamento: "OTIMO" },
  { id: "mil-05", nome: "Juliana Castro Lemos", postoGrad: "3S", quadro: "BEP", saram: "4301659", secao: "Esquadrão de Manutenção de Aeronaves", omId: OM.id, comportamento: "BOM" },
  { id: "mil-06", nome: "Thiago Alencar Mota", postoGrad: "Cb", quadro: "SGS", saram: "4610372", secao: "Esquadrão de Segurança e Defesa", omId: OM.id, comportamento: "BOM" },
  { id: "mil-07", nome: "Bruna Vasconcelos Lira", postoGrad: "S2", quadro: "SAD", saram: "4723508", secao: "Seção de Pessoal", omId: OM.id, comportamento: "BOM" },
  { id: "mil-08", nome: "Marcelo Queiroz Damasceno", postoGrad: "1S", quadro: "BCO", saram: "3705291", secao: "Esquadrão de Telemática", omId: OM.id, comportamento: "OTIMO" },
  { id: "mil-09", nome: "Patrícia Sales Moreira", postoGrad: "2T Eng", quadro: "", saram: "2809437", secao: "Seção de Engenharia", omId: OM.id, comportamento: "EXCEPCIONAL" },
  { id: "mil-10", nome: "Gustavo Ferraz Bittencourt", postoGrad: "Cb", quadro: "BEP", saram: "4515780", secao: "Esquadrão de Manutenção de Aeronaves", omId: OM.id, comportamento: "BOM" },
  { id: "mil-11", nome: "Larissa Fontoura Nunes", postoGrad: "S1", quadro: "BMA", saram: "4408923", secao: "Esquadrão de Manutenção de Aeronaves", omId: OM.id, comportamento: "BOM" },
];

/** Contas do protótipo — uma por perfil, para a troca rápida na demonstração. */
export const CONTAS: Conta[] = [
  { id: "cta-cmt", militarId: CMT, perfil: "COMANDANTE", funcao: "Comandante da Base Aérea de Anápolis" },
  { id: "cta-adm", militarId: ADM, perfil: "ADMIN", funcao: "Auxiliar da Seção de Inquéritos e Justiça" },
  { id: "cta-ap", militarId: "mil-ap1", perfil: "APURADOR", funcao: "Oficial Apurador designado" },
  { id: "cta-arr", militarId: "mil-01", perfil: "ARROLADO", funcao: "Militar sujeito a apuração" },
];

export function militarPorId(estado: EstadoSistema, id?: string): Militar | undefined {
  return id ? estado.militares.find((m) => m.id === id) : undefined;
}

export function nomeCompleto(m?: Militar): string {
  // Nos oficiais a especialidade já vem no posto ("Cel Av"); nas praças ela é o
  // quadro ("3S BCT"). Juntar só as partes preenchidas evita a duplicação.
  return m ? [m.postoGrad, m.quadro, m.nome].filter(Boolean).join(" ") : "—";
}

export function nomeCurto(m?: Militar): string {
  return m ? `${m.postoGrad} ${m.nome}` : "—";
}

// ---------------------------------------------------------------------------
// Roteiros dos processos de demonstração
// ---------------------------------------------------------------------------

interface Roteiro {
  numero: string;
  arroladoId: string;
  apuradorId: string;
  alvo: StatusProcesso;
  /** Dias úteis atrás em que o ofício foi protocolado. */
  aberturaHa: number;
  origem: Origem;
  relato: string;
  itens: string[];
  /** Intervalos, em dias úteis, entre uma etapa e a seguinte. */
  ritmo?: number[];
  defesa?: string | null;
  inquiricoes?: { tipo: "ARROLADO" | "TESTEMUNHA"; nome: string; posto: string; depoimento: string }[];
  relatorio?: DadosRelatorio;
  decisao?: DadosDecisao;
  reconsideracao?: { razoes: string; desfecho: "DEFERIDO" | "INDEFERIDO" | "PARCIALMENTE_DEFERIDO"; fundamentacao: string; dias?: number };
  /** Ciência da decisão já colhida (etapa 7 parcialmente cumprida). */
  cienciaDecisaoColhida?: boolean;
  /** Para na etapa 4 antes de o apurador assinar o recebimento dos autos. */
  aguardandoRecebimento?: boolean;
}

const RELATORIO_PADRAO: DadosRelatorio = {
  conclusao: "PROCEDENTE",
  classificacao: "MEDIA",
  atenuantes: ["at-a"],
  agravantes: [],
  analise:
    "Os documentos que compõem os autos confirmam a ocorrência narrada no documento de origem. " +
    "As alegações apresentadas não afastam a responsabilidade do militar, embora demonstrem " +
    "arrependimento e colaboração com a apuração.",
  propostaPunicao: "REPREENSAO",
};

const ROTEIROS: Roteiro[] = [
  {
    numero: "071/SIJ/2026",
    // Processo usado no roteiro de demonstração: é o único que pode ser percorrido
    // do início ao fim pelas quatro contas do seletor de perfil.
    arroladoId: "mil-01",
    apuradorId: "mil-ap1",
    alvo: "PARA_ABERTURA",
    aberturaHa: 1,
    origem: { tipo: "OFICIO", numero: "184/SP/2026", data: "", protocoloComaer: "67210.004182/2026-11" },
    relato:
      "Ausência ao expediente nos dias úteis subsequentes ao término das férias, sem " +
      "participação da impossibilidade de apresentação à chefia imediata.",
    itens: [],
  },
  {
    numero: "070/SIJ/2026",
    arroladoId: "mil-10",
    apuradorId: "mil-ap1",
    alvo: "PARA_ABERTURA",
    aberturaHa: 2,
    origem: { tipo: "PARTE", numero: "032/EMA/2026", data: "", protocoloComaer: "67210.004150/2026-38" },
    relato:
      "Uso de ferramenta de dotação do hangar fora das atividades de serviço, sem " +
      "autorização do chefe de setor.",
    itens: [],
  },
  {
    numero: "069/SIJ/2026",
    arroladoId: "mil-06",
    apuradorId: "mil-ap3",
    alvo: "A_CIENTIFICAR",
    aberturaHa: 4,
    ritmo: [2],
    origem: { tipo: "OFICIO", numero: "177/ESD/2026", data: "", protocoloComaer: "67210.004097/2026-52" },
    relato:
      "Saída, sem autorização, do Posto 3 de sentinela para o qual o militar estava " +
      "escalado, por aproximadamente quarenta minutos durante o turno.",
    itens: ["art10-46"],
  },
  {
    numero: "068/SIJ/2026",
    arroladoId: "mil-11",
    apuradorId: "mil-ap1",
    alvo: "A_CIENTIFICAR",
    aberturaHa: 5,
    ritmo: [3],
    origem: { tipo: "OFICIO", numero: "173/EMA/2026", data: "", protocoloComaer: "67210.004055/2026-19" },
    relato:
      "Apresentação ao serviço com uniforme em desacordo com o previsto no " +
      "regulamento de uniformes, após advertência verbal anterior sobre o mesmo fato.",
    itens: ["art10-42"],
  },
  {
    numero: "064/SIJ/2026",
    arroladoId: "mil-01",
    apuradorId: "mil-ap1",
    alvo: "AGUARDANDO_DEFESA",
    aberturaHa: 8,
    ritmo: [2, 2],
    origem: { tipo: "OFICIO", numero: "165/DTCEA/2026", data: "", protocoloComaer: "67210.003988/2026-70" },
    relato:
      "Não comparecimento ao turno de serviço operacional para o qual o militar estava " +
      "escalado conforme boletim interno, sem participação da impossibilidade de " +
      "comparecimento.",
    itens: ["art10-19", "art10-14"],
  },
  {
    numero: "063/SIJ/2026",
    arroladoId: "mil-03",
    apuradorId: "mil-ap3",
    alvo: "AGUARDANDO_DEFESA",
    aberturaHa: 12,
    ritmo: [2, 2],
    origem: { tipo: "OFICIO", numero: "158/ESD/2026", data: "", protocoloComaer: "67210.003902/2026-44" },
    relato:
      "Publicação em rede social, com identificação de uniforme e de " +
      "instalações da Organização Militar, em contexto capaz de comprometer a imagem " +
      "institucional.",
    itens: ["art10-94", "art10-33"],
  },
  {
    numero: "062/SIJ/2026",
    arroladoId: "mil-05",
    apuradorId: "mil-ap2",
    alvo: "AGUARDANDO_DEFESA",
    aberturaHa: 6,
    ritmo: [1, 1],
    origem: { tipo: "OFICIO", numero: "168/EMA/2026", data: "", protocoloComaer: "67210.004012/2026-06" },
    relato:
      "Atraso de duas horas na apresentação ao serviço de manutenção, sem " +
      "comunicação prévia ao chefe imediato.",
    itens: ["art10-19"],
  },
  {
    numero: "059/SIJ/2026",
    arroladoId: "mil-04",
    apuradorId: "mil-ap1",
    alvo: "EM_APURACAO",
    aberturaHa: 16,
    ritmo: [2, 2, 4],
    origem: { tipo: "OFICIO", numero: "149/EMA/2026", data: "", protocoloComaer: "67210.003811/2026-27" },
    relato:
      "Execução incorreta de procedimento de inspeção previsto em cartão de " +
      "trabalho, com registro de conformidade sem a realização integral da tarefa.",
    itens: ["art10-27", "art10-9"],
    aguardandoRecebimento: true,
    defesa:
      "Reconheço a divergência apontada no cartão de trabalho. Esclareço que a inspeção foi " +
      "iniciada no turno anterior por outra equipe e que assinei o registro com base na " +
      "informação verbal repassada na passagem de serviço, sem conferência documental. " +
      "Não houve intenção de omitir a execução da tarefa.",
  },
  {
    numero: "057/SIJ/2026",
    arroladoId: "mil-02",
    apuradorId: "mil-ap2",
    alvo: "EM_APURACAO",
    aberturaHa: 19,
    ritmo: [2, 3, 6],
    origem: { tipo: "OFICIO", numero: "142/EIN/2026", data: "", protocoloComaer: "67210.003744/2026-95" },
    relato:
      "Ausência ao serviço interno para o qual o militar estava escalado, " +
      "sem justificativa apresentada ao chefe imediato até o encerramento do expediente.",
    itens: ["art10-19"],
    defesa: null,
  },
  {
    numero: "054/SIJ/2026",
    arroladoId: "mil-08",
    apuradorId: "mil-ap3",
    alvo: "AGUARDANDO_DESPACHO",
    aberturaHa: 24,
    ritmo: [2, 2, 5, 1, 4],
    origem: { tipo: "OFICIO", numero: "133/ETEL/2026", data: "", protocoloComaer: "67210.003650/2026-13" },
    relato:
      "Não comunicação, ao escalão superior, de indisponibilidade de enlace " +
      "de comunicações identificada durante o turno, com registro apenas no livro de ocorrências.",
    itens: ["art10-14"],
    defesa:
      "Informo que a indisponibilidade foi registrada no livro de ocorrências e comunicada " +
      "verbalmente ao supervisor de turno. Reconheço, contudo, que não formalizei a " +
      "comunicação pelos meios previstos na norma.",
    inquiricoes: [
      {
        tipo: "TESTEMUNHA",
        nome: "Eduardo Prates Sampaio",
        posto: "2S BCO",
        depoimento:
          "QUE estava de serviço no mesmo turno; QUE tomou conhecimento da indisponibilidade " +
          "do enlace por volta das 22h; QUE o registro foi feito no livro de ocorrências; QUE não " +
          "presenciou comunicação formal ao escalão superior.",
      },
    ],
    relatorio: {
      conclusao: "PROCEDENTE",
      classificacao: "LEVE",
      atenuantes: ["at-a", "at-b"],
      agravantes: [],
      analise:
        "A prova documental e o depoimento colhido confirmam que houve registro da ocorrência " +
        "no livro próprio, mas não a comunicação formal exigida pela norma. A conduta caracteriza " +
        "descumprimento de dever funcional de menor potencial ofensivo, mitigado pelo histórico " +
        "funcional do militar e pela ausência de prejuízo operacional efetivo.",
      propostaPunicao: "ADVERTENCIA",
    },
  },
  {
    numero: "051/SIJ/2026",
    arroladoId: "mil-09",
    apuradorId: "mil-ap1",
    alvo: "AGUARDANDO_DECISAO",
    aberturaHa: 27,
    ritmo: [2, 2, 4, 1, 5, 2],
    origem: { tipo: "OFICIO", numero: "127/SENG/2026", data: "", protocoloComaer: "67210.003588/2026-61" },
    relato:
      "Atraso na entrega de parecer técnico de obra, com impacto no " +
      "cronograma contratual, atribuído a falha de acompanhamento do processo.",
    itens: ["art10-27"],
    defesa:
      "O parecer dependia de informações do fiscal de contrato, solicitadas por três vezes e " +
      "não atendidas no prazo. Junto cópias das solicitações. Entendo que o atraso não decorreu " +
      "de desídia, mas de dependência externa documentada.",
    relatorio: {
      conclusao: "IMPROCEDENTE",
      atenuantes: [],
      agravantes: [],
      analise:
        "As cópias juntadas comprovam que as informações necessárias à elaboração do parecer " +
        "foram solicitadas tempestivamente e não foram atendidas. O atraso, portanto, não é " +
        "imputável ao militar arrolado, restando descaracterizada a transgressão.",
    },
  },
  {
    numero: "049/SIJ/2026",
    arroladoId: "mil-02",
    apuradorId: "mil-ap3",
    alvo: "AGUARDANDO_DECISAO",
    aberturaHa: 34,
    ritmo: [2, 2, 5, 1, 5, 9],
    origem: { tipo: "OFICIO", numero: "119/EIN/2026", data: "", protocoloComaer: "67210.003501/2026-88" },
    relato:
      "Desrespeito a superior hierárquico durante formatura, com uso de " +
      "expressões inadequadas na presença de outros militares.",
    itens: ["art10-38", "art10-33"],
    defesa:
      "Peço desculpas pela forma como me expressei. Estava sob forte abalo emocional por " +
      "questões familiares, o que não justifica a conduta, mas explica a reação desproporcional.",
    inquiricoes: [
      {
        tipo: "ARROLADO",
        nome: "Felipe Toledo Barros",
        posto: "Cb SAD",
        depoimento:
          "QUE reconhece ter se dirigido ao superior em tom inadequado; QUE não teve intenção " +
          "de desrespeitar; QUE já apresentou desculpas formais ao oficial; QUE passava por " +
          "dificuldade familiar no período.",
      },
    ],
    relatorio: {
      conclusao: "PROCEDENTE",
      classificacao: "GRAVE",
      atenuantes: [],
      agravantes: ["ag-a", "ag-e"],
      analise:
        "O depoimento do próprio militar e a prova testemunhal confirmam a conduta. A prática " +
        "em presença de outros militares e o comportamento militar classificado como " +
        "Insuficiente agravam a transgressão, que se enquadra entre as de natureza grave.",
      propostaPunicao: "DETENCAO",
      propostaDias: 5,
    },
  },
  {
    numero: "046/SIJ/2026",
    arroladoId: "mil-06",
    apuradorId: "mil-ap2",
    alvo: "CIENCIA_DA_DECISAO",
    aberturaHa: 30,
    ritmo: [2, 2, 4, 1, 4, 2, 3],
    origem: { tipo: "OFICIO", numero: "112/ESD/2026", data: "", protocoloComaer: "67210.003455/2026-24" },
    relato:
      "Permanência em área de acesso restrito fora do horário autorizado, " +
      "sem registro no controle de acesso.",
    itens: ["art10-9"],
    defesa:
      "Permaneci na área para concluir a conferência de material iniciada no turno. Reconheço " +
      "que deveria ter solicitado autorização formal para a permanência.",
    relatorio: RELATORIO_PADRAO,
    decisao: {
      tipo: "PUNICAO",
      concordaComRelatorio: true,
      punicao: "REPREENSAO",
      fundamentacao:
        "Concorda-se com o relatório do oficial apurador. A conduta, embora sem prejuízo " +
        "efetivo, descumpriu norma expressa de controle de acesso.",
      comportamentoResultante: "BOM",
    },
  },
  {
    numero: "042/SIJ/2026",
    arroladoId: "mil-04",
    apuradorId: "mil-ap1",
    alvo: "RECONSIDERACAO_EM_ANALISE",
    aberturaHa: 40,
    ritmo: [2, 2, 5, 1, 4, 2, 3, 4],
    origem: { tipo: "OFICIO", numero: "104/EMA/2026", data: "", protocoloComaer: "67210.003388/2026-50" },
    relato:
      "Emprego de viatura de dotação da Organização Militar em deslocamento " +
      "não previsto na ordem de serviço.",
    itens: ["art10-58"],
    defesa:
      "O deslocamento foi autorizado verbalmente pelo chefe de setor para busca de material " +
      "urgente. Não houve uso particular da viatura.",
    relatorio: {
      conclusao: "PROCEDENTE",
      classificacao: "MEDIA",
      atenuantes: ["at-b"],
      agravantes: [],
      analise:
        "A autorização verbal não substitui a ordem de serviço exigida pela norma interna. " +
        "Reconhece-se, contudo, a finalidade estritamente funcional do deslocamento.",
      propostaPunicao: "DETENCAO",
      propostaDias: 3,
    },
    decisao: {
      tipo: "PUNICAO",
      concordaComRelatorio: true,
      punicao: "DETENCAO",
      dias: 3,
      fundamentacao:
        "Concorda-se com o relatório. Aplica-se a punição proposta, considerada a atenuante " +
        "de relevantes serviços prestados.",
      comportamentoResultante: "BOM",
    },
    cienciaDecisaoColhida: true,
    reconsideracao: {
      razoes:
        "Requeiro a reconsideração da punição aplicada. Junto declaração do chefe de setor " +
        "confirmando a autorização verbal e a urgência do material transportado, elementos que " +
        "não constavam dos autos quando da decisão.",
      desfecho: "PARCIALMENTE_DEFERIDO",
      fundamentacao:
        "A declaração juntada confirma a autorização verbal e a finalidade funcional, o que " +
        "atenua a conduta sem afastá-la. Converte-se a punição de detenção em repreensão.",
    },
  },
  {
    numero: "038/SIJ/2026",
    arroladoId: "mil-01",
    apuradorId: "mil-ap2",
    alvo: "FINALIZADO",
    aberturaHa: 48,
    ritmo: [2, 2, 4, 1, 4, 2, 3, 2],
    origem: { tipo: "OFICIO", numero: "096/DTCEA/2026", data: "", protocoloComaer: "67210.003290/2026-77" },
    relato:
      "Atraso na apresentação ao turno de serviço operacional, com " +
      "necessidade de prorrogação do turno anterior.",
    itens: ["art10-19"],
    defesa:
      "Houve pane no veículo particular no trajeto. Comuniquei o supervisor por telefone assim " +
      "que possível. Junto comprovante do serviço de guincho.",
    relatorio: RELATORIO_PADRAO,
    decisao: {
      tipo: "PUNICAO",
      concordaComRelatorio: true,
      punicao: "ADVERTENCIA",
      fundamentacao:
        "Concorda-se com o relatório. Considerada a comunicação tempestiva e o comprovante " +
        "juntado, aplica-se a punição em seu grau mínimo.",
      comportamentoResultante: "BOM",
    },
    cienciaDecisaoColhida: true,
  },
  {
    numero: "035/SIJ/2026",
    arroladoId: "mil-03",
    apuradorId: "mil-ap1",
    alvo: "FINALIZADO",
    aberturaHa: 55,
    ritmo: [2, 2, 5, 1, 5, 2, 2, 1],
    origem: { tipo: "OFICIO", numero: "088/ESD/2026", data: "", protocoloComaer: "67210.003201/2026-31" },
    relato:
      "Descumprimento de ordem de recolhimento de material ao paiol ao " +
      "término do exercício.",
    itens: ["art10-9"],
    defesa:
      "O material foi recolhido pela equipe seguinte por determinação do coordenador do " +
      "exercício, conforme registrado na ata de encerramento que ora junto.",
    relatorio: {
      conclusao: "IMPROCEDENTE",
      atenuantes: [],
      agravantes: [],
      analise:
        "A ata de encerramento do exercício confirma a redistribuição da tarefa por " +
        "determinação do coordenador. Não há conduta imputável ao militar arrolado.",
    },
    decisao: {
      tipo: "ARQUIVAMENTO",
      concordaComRelatorio: true,
      fundamentacao:
        "Diante da apuração feita e dos documentos apresentados, restou demonstrado que os " +
        "fatos estão justificados. Nos termos do art. 14 do RDAER, decide-se pelo arquivamento.",
    },
    cienciaDecisaoColhida: true,
  },
  {
    numero: "031/SIJ/2026",
    arroladoId: "mil-05",
    apuradorId: "mil-ap3",
    alvo: "FINALIZADO",
    aberturaHa: 62,
    ritmo: [2, 3, 5, 1, 4, 2, 3, 2],
    origem: { tipo: "OFICIO", numero: "079/EMA/2026", data: "", protocoloComaer: "67210.003118/2026-09" },
    relato:
      "Registro de frequência em desacordo com o horário efetivo de " +
      "apresentação ao serviço.",
    itens: ["art10-9", "art10-27"],
    defesa: null,
    relatorio: {
      conclusao: "PROCEDENTE",
      classificacao: "MEDIA",
      atenuantes: [],
      agravantes: [],
      analise:
        "Ausentes alegações de defesa, a prova documental é suficiente para demonstrar a " +
        "divergência entre o registro de frequência e o horário efetivo de apresentação.",
      propostaPunicao: "REPREENSAO",
    },
    decisao: {
      tipo: "PUNICAO",
      concordaComRelatorio: true,
      punicao: "REPREENSAO",
      fundamentacao: "Concorda-se integralmente com o relatório do oficial apurador.",
      comportamentoResultante: "BOM",
    },
    cienciaDecisaoColhida: true,
  },
  {
    numero: "028/SIJ/2026",
    arroladoId: "mil-11",
    apuradorId: "mil-ap2",
    alvo: "FINALIZADO",
    aberturaHa: 70,
    ritmo: [2, 2, 4, 1, 4, 2, 2, 2],
    origem: { tipo: "OFICIO", numero: "071/EMA/2026", data: "", protocoloComaer: "67210.003040/2026-55" },
    relato:
      "Extravio de ferramenta de dotação individual, identificado em " +
      "conferência de carga.",
    itens: ["art10-58"],
    defesa:
      "A ferramenta foi localizada no armário de outra equipe após a conferência. Junto o " +
      "termo de devolução assinado pelo encarregado do paiol.",
    relatorio: {
      conclusao: "IMPROCEDENTE",
      atenuantes: [],
      agravantes: [],
      analise:
        "O termo de devolução comprova que não houve extravio, mas guarda em local diverso " +
        "do previsto, sanada antes da conclusão da apuração.",
    },
    decisao: {
      tipo: "ARQUIVAMENTO",
      concordaComRelatorio: true,
      fundamentacao:
        "Restou demonstrado que não houve extravio. Decide-se pelo arquivamento nos termos " +
        "do art. 14 do RDAER.",
    },
    cienciaDecisaoColhida: true,
  },
];

// ---------------------------------------------------------------------------
// Construção
// ---------------------------------------------------------------------------

function processoBase(r: Roteiro, abertoEm: string): Processo {
  return {
    id: `proc-${r.numero.replace(/\//g, "-")}`,
    numero: r.numero,
    status: "PARA_ABERTURA",
    omId: OM.id,
    arroladoId: r.arroladoId,
    comandanteId: CMT,
    origem: { ...r.origem, data: abertoEm },
    relatoFato: r.relato,
    itensArt10: [],
    abertoEm,
    inquiricoes: [],
    documentos: [],
    prazos: [],
    eventos: [],
  };
}

function montar(r: Roteiro, hoje: string): Processo {
  const abertoEm = voltarDiasUteis(hoje, r.aberturaHa);
  let p = processoBase(r, abertoEm);
  let dia = abertoEm;
  const ritmo = r.ritmo ?? [];
  let passo = 0;
  const avancar = () => {
    const n = ritmo[passo] ?? 2;
    passo += 1;
    dia = calcularVencimento(dia, n, "UTEIS");
  };
  const ctx = (autorId: string, autorPerfil: Perfil, hora = 10): Contexto => ({
    autorId,
    autorPerfil,
    em: comHora(dia, hora),
    data: dia,
  });

  // Documento de origem entra nos autos junto com a abertura.
  p = {
    ...p,
    documentos: [
      {
        id: `doc-origem-${p.id}`,
        processoId: p.id,
        anexo: "ORIGEM",
        titulo: "Documento de origem",
        criadoEm: comHora(abertoEm, 8),
        dados: { numero: r.origem.numero, protocolo: r.origem.protocoloComaer ?? "" },
        assinaturas: [],
        anexado: true,
      },
    ],
    eventos: [
      {
        id: `evt-abertura-${p.id}`,
        processoId: p.id,
        em: comHora(abertoEm, 8),
        autorId: ADM,
        autorPerfil: "ADMIN",
        acao: "Abertura registrada",
        detalhe: `Documento de origem ${r.origem.numero} lançado no sistema.`,
        hash: "",
      },
    ],
  };
  if (r.alvo === "PARA_ABERTURA") return p;

  avancar();
  p = autuar(p, ctx(ADM, "ADMIN", 9), {
    apuradorId: r.apuradorId,
    itensArt10: r.itens,
    relatoFato: r.relato,
    portaria: "018/GC3/2026",
    boletim: "142",
  });
  if (r.alvo === "A_CIENTIFICAR") return p;

  avancar();
  p = registrarCiencia(p, ctx(r.arroladoId, "ARROLADO", 14));
  if (r.alvo === "AGUARDANDO_DEFESA") return p;

  avancar();
  if (r.defesa) {
    p = apresentarDefesa(p, ctx(r.arroladoId, "ARROLADO", 16), r.defesa);
  } else {
    p = declararPreclusao(p, ctx(r.apuradorId, "APURADOR", 11));
  }

  if (r.alvo === "EM_APURACAO" && r.aguardandoRecebimento) return p;

  // Dentro da etapa 4 o apurador assina o recebimento no mesmo dia útil seguinte.
  dia = calcularVencimento(dia, 1, "UTEIS");
  p = receberAutos(p, ctx(r.apuradorId, "APURADOR", 9));
  for (const inq of r.inquiricoes ?? []) {
    dia = calcularVencimento(dia, 1, "UTEIS");
    p = registrarInquiricao(p, ctx(r.apuradorId, "APURADOR", 15), {
      tipo: inq.tipo,
      nomeInquirido: inq.nome,
      postoInquirido: inq.posto,
      realizadaEm: dia,
      depoimento: inq.depoimento,
    });
  }
  if (r.alvo === "EM_APURACAO") return p;

  avancar();
  p = emitirRelatorio(p, ctx(r.apuradorId, "APURADOR", 17), r.relatorio ?? RELATORIO_PADRAO);
  if (r.alvo === "AGUARDANDO_DESPACHO") return p;

  avancar();
  p = receberRelatorio(p, ctx(CMT, "COMANDANTE", 9));
  if (r.alvo === "AGUARDANDO_DECISAO") return p;

  avancar();
  p = decidir(p, ctx(CMT, "COMANDANTE", 15), r.decisao!);
  if (r.alvo === "CIENCIA_DA_DECISAO" && !r.cienciaDecisaoColhida) return p;

  avancar();
  p = registrarCienciaDecisao(p, ctx(r.arroladoId, "ARROLADO", 11));
  if (r.alvo === "CIENCIA_DA_DECISAO") return p;
  if (p.status === "FINALIZADO") return p; // arquivamento encerra na ciência

  if (r.reconsideracao) {
    avancar();
    p = pedirReconsideracao(p, ctx(r.arroladoId, "ARROLADO", 10), r.reconsideracao.razoes);
    if (r.alvo === "RECONSIDERACAO_EM_ANALISE") return p;

    avancar();
    p = julgarReconsideracao(p, ctx(CMT, "COMANDANTE", 16), {
      desfecho: r.reconsideracao.desfecho,
      fundamentacao: r.reconsideracao.fundamentacao,
      punicao: r.reconsideracao.desfecho === "DEFERIDO" ? undefined : "REPREENSAO",
      dias: r.reconsideracao.dias,
    });
    if (r.alvo === "CIENCIA_NOVA_DECISAO") return p;

    avancar();
    return registrarCienciaNovaDecisao(p, ctx(r.arroladoId, "ARROLADO", 11));
  }

  // Punição sem reconsideração: encerra pelo decurso dos 15 dias.
  const prazoRec = p.prazos.find((pz) => pz.tipo === "RECONSIDERACAO");
  if (prazoRec) {
    dia = prazoRec.venceEm;
    p = {
      ...p,
      status: "FINALIZADO",
      finalizadoEm: dia,
      prazos: p.prazos.map((pz) =>
        pz.tipo === "RECONSIDERACAO"
          ? { ...pz, status: "CUMPRIDO" as const, cumpridoEm: dia }
          : pz,
      ),
      eventos: [
        ...p.eventos,
        {
          id: `evt-decurso-${p.id}`,
          processoId: p.id,
          em: comHora(dia, 18),
          autorId: ADM,
          autorPerfil: "ADMIN",
          acao: "Encerramento por decurso de prazo",
          detalhe:
            "Transcorridos 15 dias da ciência sem pedido de reconsideração. Processo encerrado.",
          hash: "",
        },
      ],
    };
  }
  return p;
}

export function criarEstadoInicial(hoje: string): EstadoSistema {
  return {
    om: OM,
    militares: MILITARES,
    contas: CONTAS,
    processos: ROTEIROS.map((r) => montar(r, hoje)),
  };
}
