# Design Tokens — Cores

Paleta de cores do Sistema de Apuração de Transgressões Disciplinares, derivada do
**Manual de Identidade Visual da FAB** (30/01/18), página 9 — "Marca | Cores Institucionais".

## Cores oficiais (mandatórias para a marca)

| Cor | Pantone | Hex | RGB | CMYK |
|---|---|---|---|---|
| Azul institucional | 286 | `#0033A0` | 0, 51, 160 | 100, 68, 0, 37 |
| Branco | White | `#FFFFFF` | 255, 255, 255 | 0, 0, 0, 0 |

O manual define **somente essas duas cores** como identidade oficial da marca FAB.
`#0033A0` é `--color-primary-600` / `primary.600` nos tokens — use exatamente esse
valor sempre que a marca/logotipo FAB aparecer na tela (não aplique tint/shade nela).

## Escalas derivadas (uso em interface)

`primary` (50–950) e `neutral` (50–950) foram geradas por mistura matemática do azul
oficial com branco/preto (tints e shades), para cobrir necessidades de UI que o manual
de marca não define: fundos, hover, texto, bordas, estados desabilitados etc.

- `primary-950` (`#00133D`) — indicado para header/sidebar (tom escuro de profundidade,
  como visto no sistema de referência enviado).
- `primary-600` (`#0033A0`) — cor oficial; usar em botões primários, links, elementos
  de destaque e sempre que representar a marca.
- `primary-50…300` — fundos claros, estados hover suaves, backgrounds de cards ativos.

## Semânticas de status

`danger`, `warning`, `success`, `info` **não fazem parte do manual de marca** — são uma
convenção de produto para comunicar estado de processos (ex.: transgressão em apuração,
pendente, concluída, indeferida). Pensadas para conviver com o azul institucional sem
concorrer visualmente com ele.

## Arquivos

- [`colors.json`](./colors.json) — fonte da verdade, agnóstica de framework.
- [`tokens.css`](./tokens.css) — as mesmas cores como custom properties (`:root`),
  prontas para uso direto em CSS/HTML, ou como base para Tailwind/styled-components
  quando a stack for definida.
