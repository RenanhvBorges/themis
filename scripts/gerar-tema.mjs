/**
 * Gera `app/tema.css` (bloco @theme do Tailwind v4) a partir de `design-tokens/colors.json`.
 *
 * A fonte da verdade das cores continua sendo o JSON derivado do Manual de Identidade
 * Visual da FAB — este script apenas traduz aquele arquivo para o formato que o Tailwind
 * consome, evitando que a paleta seja copiada à mão para dentro do CSS e saia de sincronia.
 *
 * Uso: npm run tokens:build
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(
  readFileSync(join(raiz, "design-tokens", "colors.json"), "utf8"),
);

const linhas = [];

const escala = (nome, obj) => {
  linhas.push(`  /* ${obj.$description} */`);
  for (const [chave, valor] of Object.entries(obj)) {
    if (chave.startsWith("$") || typeof valor !== "string") continue;
    linhas.push(`  --color-${nome}-${chave}: ${valor};`);
  }
  linhas.push("");
};

escala("primary", tokens.primary);
escala("neutral", tokens.neutral);

linhas.push("  /* Cores de status — convenção de produto, fora do manual de marca */");
for (const [nome, tons] of Object.entries(tokens.semantic)) {
  if (nome.startsWith("$")) continue;
  for (const [tom, valor] of Object.entries(tons)) {
    if (tom.startsWith("$")) continue;
    linhas.push(`  --color-${nome}-${tom}: ${valor};`);
  }
}

const conteudo = `/* GERADO POR scripts/gerar-tema.mjs — NÃO EDITAR À MÃO.
 * Fonte: design-tokens/colors.json
 * ${tokens.$source}
 */

@theme {
${linhas.join("\n")}
}
`;

writeFileSync(join(raiz, "app", "tema.css"), conteudo);
console.log("app/tema.css gerado a partir de design-tokens/colors.json");
