# Themis — Apuração de Transgressão Disciplinar (PATD)

Protótipo navegável do sistema que digitaliza o Processo de Apuração de Transgressão
Disciplinar do Comando da Aeronáutica, conforme a **ICA 111-6/2021** e o **RDAER**
(Decreto nº 76.322/1975).

O escopo do produto está em [`docs/PRD.md`](docs/PRD.md). Este repositório traz o
protótipo que dá forma àquele documento: os quatro perfis, o fluxo de dez etapas, o
motor de prazos em dias úteis, os documentos oficiais em PDF e o painel de indicadores
do Comandante.

> **Todos os dados são fictícios.** Nomes, SARAM, fatos, defesas e decisões foram
> inventados para a demonstração. Nenhum processo real está representado.

## Como rodar

```bash
npm install
npm run dev
```

Acesse <http://localhost:3000>. Não há banco de dados nem variáveis de ambiente: o
estado da demonstração vive no navegador.

## Roteiro de demonstração

O seletor de perfil fica no canto superior direito. Ele existe só no protótipo — no
produto a identidade vem do Login gov.br e ninguém troca de perfil sozinho.

O **PATD nº 071** foi montado para ser percorrido do início ao fim pelas quatro contas —
o roteiro abaixo acompanha esse processo único trocando de perfil a cada etapa. Ao final
dele, o botão **Ação pendente** sempre indica de quem é a vez.

| # | Perfil | O que mostrar |
|---|---|---|
| 1 | **Comandante** | O painel abre direto. Mostre os prazos vencidos e em risco, o tempo médio por etapa e a reincidência — nenhum desses números foi digitado por alguém, todos saem do próprio trâmite. |
| 2 | **Admin** | Em *Processos*, abra o **PATD nº 071** (Para abertura) e clique em **Autuar processo**: designa o apurador, enquadra no art. 10 e gera a Capa, o Despacho (Anexo B) e o FATD (Anexo D) já assinados. |
| 3 | **Militar Arrolado** | A lista mostra apenas os processos do próprio militar — é o controle de acesso em ação. No 071, registre a ciência: é esse ato que abre o prazo de cinco dias úteis. Em seguida apresente a defesa. |
| 4 | **Oficial Apurador** | No 071, assine o recebimento dos autos — dispara o prazo do relatório. Lavre um termo de inquirição e emita o relatório. |
| 5 | **Comandante** | Receba o relatório (dispara o prazo de decisão) e decida. Escolha *Prisão* para ver o sistema alertar sobre o art. 38 do RDAER — ele avisa, mas não bloqueia. |
| 6 | **Militar Arrolado** | Registre a ciência da decisão e da NPD. Abre-se o prazo de 15 dias do art. 58 do RDAER; peça reconsideração para percorrer também a etapa 7a. |
| 7 | **Documentos** | Abra qualquer peça dos autos e use **Baixar PDF**. Em *Baixar dossiê*, o 071 aparece completo, na ordem de autuação. O **PATD nº 042** já traz esse caminho pronto, com reconsideração em análise. |

Para voltar ao ponto de partida, use **Restaurar dados de demonstração** no rodapé da
barra lateral.

## O que o protótipo demonstra

| Épico do PRD | Estado |
|---|---|
| **E1** Condução guiada do processo | Completo — as dez etapas, incluindo recusa de ciência, preclusão e reconsideração |
| **E2** Motor de prazos | Completo — dias úteis com feriados nacionais e datas da FAB, prorrogação da defesa, alertas de vencido/em risco |
| **E3** Geração de documentos | Completo — Anexos B, C, D, E, F, G, H, I, J, K, M, Q e dossiê consolidado |
| **E4** Assinatura eletrônica | Simulada — carimbo, protocolo e hash no formato do produto; a integração com a plataforma gov.br é trabalho de implementação |
| **E5** Painel do Comandante | Completo — todos os indicadores da seção 7 do PRD, filtráveis por período |
| **E6** Controle de acesso e auditoria | Completo — RBAC dos quatro perfis e trilha append-only em cada processo |

## Estrutura

```
app/                     rotas (App Router)
  (sistema)/             telas autenticadas: painel, processos, abertura
  documento/ dossie/     visualização imprimível das peças dos autos
components/
  documentos/            renderização dos Anexos da ICA em formato de folha A4
  painel/ processo/ ui/  componentes de interface
lib/
  dominio/               regras do PATD — sem React, sem persistência
  dados/                 semente de demonstração e store do protótipo
design-tokens/           paleta institucional (fonte da verdade das cores)
docs/PRD.md              escopo do produto
scripts/gerar-tema.mjs   gera app/tema.css a partir de design-tokens/colors.json
```

A separação importante é entre `lib/dominio` e `lib/dados`. O domínio — máquina de
estados, contagem de prazos, geração de peças, permissões, indicadores — é código puro
e é a parte destinada a sobreviver. `lib/dados` é o andaime: troca-se por Prisma +
PostgreSQL sem tocar nas regras.

A massa de demonstração não é escrita "pronta": cada processo parte do estado inicial e
é avançado pelas mesmas transições que a interface usa. A linha do tempo, os documentos,
as assinaturas e os prazos dos dezoito processos de exemplo são, portanto, coerentes com
as regras — e um erro nas regras aparece já na tela inicial.

## Identidade visual

A paleta vem do Manual de Identidade Visual da FAB e está versionada em
[`design-tokens/`](design-tokens/README.md). O azul institucional (Pantone 286 /
`#0033A0`) é aplicado sem tint, conforme o manual.

`design-tokens/colors.json` é a fonte da verdade; `npm run tokens:build` regenera
`app/tema.css`, que é o bloco `@theme` consumido pelo Tailwind. Não edite `app/tema.css`
à mão.

A marca do produto **não reproduz o emblema oficial da FAB** — o uso do brasão é
restrito pelo manual e o ativo oficial deve ser inserido pela própria OM.

## Distância entre o protótipo e o produto

| Item | No protótipo | No produto (PRD, seção 8) |
|---|---|---|
| Persistência | `localStorage` do navegador | PostgreSQL + Prisma, com Row-Level Security |
| Autenticação | Seletor de perfil | Auth.js + Login gov.br (OIDC) |
| Assinatura eletrônica | Carimbo, protocolo e hash simulados | API da Plataforma gov.br, nível avançado (Lei nº 14.063/2020) |
| Geração de PDF | Impressão do navegador sobre a mesma marcação HTML | Playwright headless no servidor |
| Alertas de prazo | Calculados na tela a cada visita | BullMQ + Redis, com notificação por e-mail |
| Itens do art. 10 do RDAER | Amostra ilustrativa de 12 itens | Carga completa dos 116 itens, conferida contra o Decreto |
| Cadastro de militares | Fixo na semente | Manual no piloto; SARAM/SIGPES fora do MVP |

O item do RDAER merece destaque: **a lista de transgressões precisa ser carregada e
conferida integralmente contra o texto oficial do Decreto nº 76.322/1975 antes de
qualquer uso real.** As telas que consomem esse catálogo exibem o aviso.

## Verificações

```bash
npx tsc --noEmit   # tipos
npm run lint       # ESLint
npm run build      # build de produção
```
