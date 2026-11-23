// Catálogos de referência do domínio disciplinar.
// Fonte normativa: RDAER (Decreto nº 76.322/1975) e ICA 111-6/2021.

import type { Classificacao, TipoPunicao } from "@prisma/client";

export const AVISO_CATALOGO =
  "Amostra ilustrativa do art. 10 do RDAER. A carga oficial dos 116 itens deve ser " +
  "conferida contra o Decreto nº 76.322/1975 antes do uso em processo real.";

export interface ItemArt10 {
  id: string;
  numero: number;
  resumo: string;
}

export const ITENS_ART10: ItemArt10[] = [
  { id: "art10-1", numero: 1, resumo: "Faltar aos atos de serviço para os quais for escalado" },
  { id: "art10-2", numero: 2, resumo: "Atrasar-se ou chegar com demora a qualquer ato de serviço" },
  { id: "art10-3", numero: 3, resumo: "Deixar de participar, em tempo, à autoridade competente, a impossibilidade de comparecer à OM ou ato de serviço" },
  { id: "art10-4", numero: 4, resumo: "Ausentar-se do local de serviço ou de instrução sem autorização" },
  { id: "art10-5", numero: 5, resumo: "Afastar-se do quartel ou local de pouso, em aeronave ou viatura, sem prévia autorização" },
  { id: "art10-6", numero: 6, resumo: "Deixar de apresentar-se, nos prazos regulamentares, à OM para onde for transferido ou designado" },
  { id: "art10-7", numero: 7, resumo: "Deixar de apresentar-se à autoridade competente ao término de licença, férias ou dispensa" },
  { id: "art10-8", numero: 8, resumo: "Permutar serviço sem permissão da autoridade competente" },
  { id: "art10-9", numero: 9, resumo: "Deixar de cumprir ou de fazer cumprir normas regulamentares" },
  { id: "art10-10", numero: 10, resumo: "Deixar de cumprir ordem recebida, ressalvada a hipótese de manifesta ilegalidade" },
  { id: "art10-11", numero: 11, resumo: "Retardar a execução de ordem legal sem motivo justificável" },
  { id: "art10-12", numero: 12, resumo: "Modificar ordem recebida ou desviar-se de suas instruções sem motivo de força maior" },
  { id: "art10-13", numero: 13, resumo: "Assumir compromisso em nome da OM sem a necessária autorização" },
  { id: "art10-14", numero: 14, resumo: "Deixar de comunicar a tempo, ao superior, ocorrência de que tenha conhecimento" },
  { id: "art10-15", numero: 15, resumo: "Deixar de levar ao conhecimento de autoridade superior fato ou irregularidade que lhe incumba apurar" },
  { id: "art10-16", numero: 16, resumo: "Dificultar a ação de superior hierárquico no exercício de suas funções" },
  { id: "art10-17", numero: 17, resumo: "Tratar superior hierárquico de modo desrespeitoso ou sem a deferência devida" },
  { id: "art10-18", numero: 18, resumo: "Censurar atos de superior hierárquico ou procurar desconsiderá-los" },
  { id: "art10-19", numero: 19, resumo: "Procurar desconsiderar autoridade ou superior perante subordinados ou civis" },
  { id: "art10-20", numero: 20, resumo: "Fazer reclamação coletiva ou incitar outros a fazê-la" },
  { id: "art10-21", numero: 21, resumo: "Promover ou tomar parte em manifestações coletivas sobre atos de superior hierárquico" },
  { id: "art10-22", numero: 22, resumo: "Ofender subordinado com palavras ou gestos ofensivos" },
  { id: "art10-23", numero: 23, resumo: "Tratar o subordinado com aspereza desnecessária ou de modo aviltante" },
  { id: "art10-24", numero: 24, resumo: "Exigir do subordinado serviço ou tarefa que não seja de sua competência legal" },
  { id: "art10-25", numero: 25, resumo: "Dirigir-se a autoridade superior sem observância dos trâmites regulamentares" },
  { id: "art10-26", numero: 26, resumo: "Divulgar ou propalar assuntos que possam comprometer a disciplina ou a hierarquia" },
  { id: "art10-27", numero: 27, resumo: "Trabalhar mal, intencionalmente ou por falta de atenção, em serviço ou instrução" },
  { id: "art10-28", numero: 28, resumo: "Negligenciar na guarda de bens materiais ou valores sob sua responsabilidade" },
  { id: "art10-29", numero: 29, resumo: "Danificar ou extraviar, por negligência ou dolo, bens ou materiais da Fazenda Nacional" },
  { id: "art10-30", numero: 30, resumo: "Usar ou autorizar o uso de veículo ou aeronave militar para fim estranho ao serviço" },
  { id: "art10-31", numero: 31, resumo: "Fazer uso indevido de instalações, equipamentos ou materiais sob responsabilidade militar" },
  { id: "art10-32", numero: 32, resumo: "Deixar de providenciar medidas contra extravio, avaria ou deterioração de materiais" },
  { id: "art10-33", numero: 33, resumo: "Portar-se de modo inconveniente ou sem compostura em local público ou sob administração militar" },
  { id: "art10-34", numero: 34, resumo: "Frequentar lugares incompatíveis com o decoro militar" },
  { id: "art10-35", numero: 35, resumo: "Apresentar-se desprovido de uniforme ou com peças em desacordo com as normas" },
  { id: "art10-36", numero: 36, resumo: "Apresentar-se com desleixo em seu asseio corporal ou no uniforme" },
  { id: "art10-37", numero: 37, resumo: "Usar condecorações ou insígnias a que não tenha direito" },
  { id: "art10-38", numero: 38, resumo: "Desrespeitar ou ofender superior hierárquico em público ou reservadamente" },
  { id: "art10-39", numero: 39, resumo: "Deixar de prestar continência a superior hierárquico ou a símbolos nacionais" },
  { id: "art10-40", numero: 40, resumo: "Prestar continência de forma irregular ou em tom jocoso" },
  { id: "art10-41", numero: 41, resumo: "Deixar de cumprir as prescrições referentes à continência militar" },
  { id: "art10-42", numero: 42, resumo: "Apresentar-se com uniforme em desacordo com o regulamento de uniformes da FAB" },
  { id: "art10-43", numero: 43, resumo: "Usar trajes civis quando proibido expressamente pelas normas" },
  { id: "art10-44", numero: 44, resumo: "Ingressar ou permanecer em dependências militares sem autorização competente" },
  { id: "art10-45", numero: 45, resumo: "Introduzir bebidas alcoólicas, substâncias entorpecentes ou materiais ilícitos em área militar" },
  { id: "art10-46", numero: 46, resumo: "Ausentar-se do local de serviço ou posto de sentinela sem autorização" },
  { id: "art10-47", numero: 47, resumo: "Dormir em serviço de guarda, sentinela, vigia ou plantão" },
  { id: "art10-48", numero: 48, resumo: "Entregar-se a jogos proibidos dentro de dependências militares" },
  { id: "art10-49", numero: 49, resumo: "Introduzir armas, munições ou explosivos em dependência militar sem permissão" },
  { id: "art10-50", numero: 50, resumo: "Disparar arma de fogo por imprudência, negligência ou imperícia" },
  { id: "art10-51", numero: 51, resumo: "Manejar armamento em desacordo com as normas de segurança" },
  { id: "art10-52", numero: 52, resumo: "Deixar de inspecionar armamento ou munição quando no exercício de função competente" },
  { id: "art10-53", numero: 53, resumo: "Contar fato inverídico a superior hierárquico ou prestar informações falsas" },
  { id: "art10-54", numero: 54, resumo: "Faltar com a verdade em declarações, certidões ou termos oficiais" },
  { id: "art10-55", numero: 55, resumo: "Simular doença, incapacidade ou moléstia para esquivar-se de serviço ou instrução" },
  { id: "art10-56", numero: 56, resumo: "Agravar intencionalmente estado de moléstia ou retardar a própria cura" },
  { id: "art10-57", numero: 57, resumo: "Subtrair ou tentar subtrair bem pertencente à Fazenda Nacional ou a colega" },
  { id: "art10-58", numero: 58, resumo: "Fazer uso indevido de bem ou material sob carga da Administração Militar" },
  { id: "art10-59", numero: 59, resumo: "Dar em penhor ou comercializar peças de fardamento ou material de serviço" },
  { id: "art10-60", numero: 60, resumo: "Contrair dívidas de forma desonrosa ou reiterada, comprometendo o crédito militar" },
  { id: "art10-61", numero: 61, resumo: "Fazer negócios comerciais não autorizados no interior de dependências militares" },
  { id: "art10-62", numero: 62, resumo: "Aceitar favores, vantagens ou presentes indevidos em razão de função militar" },
  { id: "art10-63", numero: 63, resumo: "Exercer pressão indevida para obtenção de vantagem pessoal" },
  { id: "art10-64", numero: 64, resumo: "Praticar ato lesivo contra pessoa sob administração ou guarda militar" },
  { id: "art10-65", numero: 65, resumo: "Deixar de prestar socorro ou assistência a quem necessite, estando em condições de fazê-lo" },
  { id: "art10-66", numero: 66, resumo: "Tolerar subordinado infringindo a disciplina sem a devida admoestação ou punição" },
  { id: "art10-67", numero: 67, resumo: "Deixar de punir subordinado culpado ou de propor a aplicação da punição" },
  { id: "art10-68", numero: 68, resumo: "Punir subordinado por transgressão já extinta, prescrita ou sem base regulamentar" },
  { id: "art10-69", numero: 69, resumo: "Exceder a competência disciplinar legalmente atribuída" },
  { id: "art10-70", numero: 70, resumo: "Aplicar punição disciplinar sem assegurar o direito à ampla defesa" },
  { id: "art10-71", numero: 71, resumo: "Apresentar-se ao serviço sob efeito de bebida alcoólica ou substância similar" },
  { id: "art10-72", numero: 72, resumo: "Embriagar-se em serviço ou fora dele com escândalo público" },
  { id: "art10-73", numero: 73, resumo: "Provocar desordem, rixa ou tumulto em dependência militar ou via pública" },
  { id: "art10-74", numero: 74, resumo: "Desafiar superior, igual ou subordinado para contenda física" },
  { id: "art10-75", numero: 75, resumo: "Agredir fisicamente superior, igual ou subordinado" },
  { id: "art10-76", numero: 76, resumo: "Ofender a moral pública com atitudes obscenas ou escandalosas" },
  { id: "art10-77", numero: 77, resumo: "Introduzir em dependência militar publicações contrárias à disciplina ou à ordem pública" },
  { id: "art10-78", numero: 78, resumo: "Fazer circular ou subscrever listas de pedidos ou donativos não autorizados" },
  { id: "art10-79", numero: 79, resumo: "Intervir em controvérsia pública de caráter político-partidário em desrespeito às normas" },
  { id: "art10-80", numero: 80, resumo: "Discutir pela imprensa ou meio eletrônico assunto militar sem autorização competente" },
  { id: "art10-81", numero: 81, resumo: "Publicar ou fornecer documentos, informes ou dados oficiais sem prévia autorização" },
  { id: "art10-82", numero: 82, resumo: "Dar conhecimento a terceiros de matérias classificadas ou de sigilo funcional" },
  { id: "art10-83", numero: 83, resumo: "Extraviar documento reservado ou de tramitação interna por negligência" },
  { id: "art10-84", numero: 84, resumo: "Destruir, inutilizar ou ocultar documento oficial ou peça de processo" },
  { id: "art10-85", numero: 85, resumo: "Falsificar ou adulterar documento de qualquer natureza" },
  { id: "art10-86", numero: 86, resumo: "Usar documento falso ou adulterado perante a Administração Militar" },
  { id: "art10-87", numero: 87, resumo: "Recusar-se a receber documento legalmente expedido por autoridade competente" },
  { id: "art10-88", numero: 88, resumo: "Recusar-se a assinar termo, notificação ou certidão sem justa causa" },
  { id: "art10-89", numero: 89, resumo: "Dificultar ou procrastinar a tramitação de processo disciplinar" },
  { id: "art10-90", numero: 90, resumo: "Deixar de prestar declarações ou testemunho quando intimado regularmente" },
  { id: "art10-91", numero: 91, resumo: "Prestar falso testemunho em apuração de transgressão disciplinar ou sindicância" },
  { id: "art10-92", numero: 92, resumo: "Induzir testemunha ou parte a falsear a verdade em processo disciplinar" },
  { id: "art10-93", numero: 93, resumo: "Ameaçar testemunha, arrolado, encarregado ou autoridade de processo" },
  { id: "art10-94", numero: 94, resumo: "Utilizar meio eletrônico ou rede social de forma a comprometer a imagem da instituição" },
  { id: "art10-95", numero: 95, resumo: "Publicar em redes sociais imagens ou informações de áreas restritas da OM" },
  { id: "art10-96", numero: 96, resumo: "Emitir juízo depreciativo sobre as Forças Armadas em meios de comunicação" },
  { id: "art10-97", numero: 97, resumo: "Desrespeitar ordens ou determinações sanitárias em vigor" },
  { id: "art10-98", numero: 98, resumo: "Deixar de submeter-se a exame médico ou perícia quando determinado" },
  { id: "art10-99", numero: 99, resumo: "Fumar em local não permitido ou com risco de incêndio e explosão" },
  { id: "art10-100", numero: 100, resumo: "Conduzir viatura militar sem ter a devida habilitação ou capacitação" },
  { id: "art10-101", numero: 101, resumo: "Infringir normas de trânsito em dependência militar ou com viatura militar" },
  { id: "art10-102", numero: 102, resumo: "Transportar pessoas ou materiais estranhos ao serviço sem prévia permissão" },
  { id: "art10-103", numero: 103, resumo: "Descumprir procedimentos de tráfego aéreo ou de controle de voo" },
  { id: "art10-104", numero: 104, resumo: "Pilotar ou tripular aeronave militar em desacordo com as instruções de voo" },
  { id: "art10-105", numero: 105, resumo: "Operar equipamento aeronáutico sem qualificação ou checagem válida" },
  { id: "art10-106", numero: 106, resumo: "Deixar de inspecionar itens de segurança pré e pós-voo conforme os manuais" },
  { id: "art10-107", numero: 107, resumo: "Omitir pane, irregularidade técnica ou incidente aeronáutico" },
  { id: "art10-108", numero: 108, resumo: "Deixar de preencher cadernetas de voo ou registros técnicos obrigatórios" },
  { id: "art10-109", numero: 109, resumo: "Preencher incorretamente documentação de manutenção ou abastecimento de aeronave" },
  { id: "art10-110", numero: 110, resumo: "Violar procedimentos técnicos de manutenção previstos em manuais de fábrica" },
  { id: "art10-111", numero: 111, resumo: "Liberar aeronave para voo com irregularidades impeditivas conhecidas" },
  { id: "art10-112", numero: 112, resumo: "Deixar de adotar medidas de segurança do trabalho no manuseio de equipamentos de risco" },
  { id: "art10-113", numero: 113, resumo: "Deixar de usar equipamento de proteção individual (EPI) regulamentar" },
  { id: "art10-114", numero: 114, resumo: "Desrespeitar prescrições de segurança das operações em pista ou hangar" },
  { id: "art10-115", numero: 115, resumo: "Adotar conduta desleal contra companheiro em ato de serviço ou competição" },
  { id: "art10-116", numero: 116, resumo: "Praticar qualquer ato contrário à disciplina militar não especificado expressamente" },
];

export function itemPorId(id: string): ItemArt10 | null {
  return ITENS_ART10.find((i) => i.id === id) ?? null;
}
export function rotularItem(id: string): string {
  const it = itemPorId(id);
  return it ? `Item ${it.numero} — ${it.resumo}` : id;
}
export function rotularItemCurto(id: string): string {
  const it = itemPorId(id);
  return it ? `Item ${it.numero}` : id;
}

export interface Circunstancia {
  id: string;
  letra: string;
  resumo: string;
}

export const ATENUANTES: Circunstancia[] = [
  { id: "at-a", letra: "a", resumo: "Bom comportamento" },
  { id: "at-b", letra: "b", resumo: "Relevantes serviços prestados" },
  { id: "at-c", letra: "c", resumo: "Falta de prática do serviço" },
  { id: "at-d", letra: "d", resumo: "Ter sido cometida para evitar mal maior" },
];

export const AGRAVANTES: Circunstancia[] = [
  { id: "ag-a", letra: "a", resumo: "Mau comportamento" },
  { id: "ag-b", letra: "b", resumo: "Prática simultânea de duas ou mais transgressões" },
  { id: "ag-c", letra: "c", resumo: "Reincidência" },
  { id: "ag-d", letra: "d", resumo: "Conluio de duas ou mais pessoas" },
  { id: "ag-e", letra: "e", resumo: "Ser praticada em presença de subordinado" },
];

export function rotularCircunstancia(id: string): string {
  const achado = [...ATENUANTES, ...AGRAVANTES].find((a) => a.id === id);
  return achado ? `Letra "${achado.letra}" — ${achado.resumo}` : id;
}

export function letrasCircunstancias(ids: string[], fonte: Circunstancia[]): string {
  const ls = ids.map((id) => fonte.find((a) => a.id === id)?.letra).filter(Boolean);
  if (!ls.length) return "";
  return ls.map((l) => `"${l}"`).join(", ");
}

export const CLASSIFICACOES: Record<Classificacao, string> = {
  LEVE: "Leve",
  MEDIA: "Média",
  GRAVE: "Grave",
};

export const PUNICOES: Record<TipoPunicao, { rotulo: string; privativa: boolean }> = {
  ADVERTENCIA: { rotulo: "Advertência", privativa: false },
  REPREENSAO: { rotulo: "Repreensão", privativa: false },
  DETENCAO: { rotulo: "Detenção", privativa: true },
  PRISAO: { rotulo: "Prisão", privativa: true },
  PRISAO_EM_SEPARADO: { rotulo: "Prisão em separado", privativa: true },
};

export const COMPORTAMENTOS: Record<string, string> = {
  EXCEPCIONAL: "Excepcional",
  OTIMO: "Ótimo",
  BOM: "Bom",
  INSUFICIENTE: "Insuficiente",
  MAU: "Mau",
};

export function alertasDeEnquadramento(
  classificacao: Classificacao | null | undefined,
  punicao: TipoPunicao | null | undefined,
): string[] {
  const alertas: string[] = [];
  if (!classificacao || !punicao) return alertas;
  const privativa = PUNICOES[punicao].privativa;
  if (classificacao === "LEVE" && privativa) {
    alertas.push("Transgressão leve não pode ser punida com prisão (RDAER, arts. 11 e 12).");
  }
  if (classificacao === "GRAVE" && !privativa) {
    alertas.push("Transgressão grave, em regra, é punida com prisão (RDAER, arts. 11 e 12).");
  }
  if (punicao === "PRISAO" || punicao === "PRISAO_EM_SEPARADO") {
    alertas.push(
      "A primeira punição de prisão do militar é sempre atribuição do Comandante da OM e não pode ser delegada (RDAER, art. 38).",
    );
  }
  return alertas;
}

export const TARJA_SIGILO = "INFORMAÇÃO PESSOAL – ACESSO RESTRITO";
export const BASES_SIGILO = [
  "Art. 5º, Inciso X, da Constituição Federal do Brasil, de 1988",
  "Art. 31 da Lei nº 12.527, de 2011",
  "Arts. 55 a 62 do Decreto nº 7.724, de 2012",
];

export const ANEXOS: Record<string, { titulo: string }> = {
  ORIGEM: { titulo: "Documento de origem" },
  B: { titulo: "Anexo B — Despacho de Abertura e Designação de Apurador" },
  C: { titulo: "Anexo C — Capa" },
  D: { titulo: "Anexo D — Formulário de Apuração de Transgressão Disciplinar (FATD)" },
  E: { titulo: "Anexo E — Certidão de Recusa de Ciência" },
  F: { titulo: "Anexo F — Alegações de Defesa" },
  G: { titulo: "Anexo G — Certidão de Preclusão" },
  H: { titulo: "Anexo H — Termo de Inquirição do Arrolado" },
  I: { titulo: "Anexo I — Relatório do Oficial Apurador" },
  J: { titulo: "Anexo J — Decisão da Autoridade Competente" },
  K: { titulo: "Anexo K — Nota de Punição Disciplinar (NPD)" },
  M: { titulo: "Anexo M — Pedido de Reconsideração" },
  Q: { titulo: "Anexo Q — Termo de Inquirição de Testemunha" },
};

export const ORDEM_AUTUACAO = ["C", "ORIGEM", "B", "D", "E", "F", "G", "H", "Q", "I", "J", "K", "M"];

/** Anexos de apoio (evidências enviadas pelo usuário) — limites do protótipo. */
export const LIMITE_ANEXOS_QTD = 3;
export const LIMITE_ANEXOS_BYTES = 4 * 1024 * 1024;

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
