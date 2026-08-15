// Hash de integridade e protocolo da assinatura eletrônica avançada
// (art. 4º da Lei nº 14.063, de 23 de setembro de 2020).
//
// Diferente do artefato de demonstração (que usava um hash não
// criptográfico só para simular o formato), aqui usamos SHA-256 real:
// o hash tem peso probatório sobre o conteúdo assinado.

import { createHash, randomUUID } from "node:crypto";

export function hashConteudo(entrada: string): string {
  return createHash("sha256").update(entrada, "utf8").digest("hex");
}

export function conteudoParaAssinar(params: {
  documentoId: string;
  processoId: string;
  anexo: string;
  dados: unknown;
}): string {
  return `${params.documentoId}|${params.processoId}|${params.anexo}|${JSON.stringify(params.dados ?? {})}`;
}

/** Protocolo legível de conferência, derivado do UUID do ato de assinatura. */
export function gerarProtocolo(): string {
  const h = randomUUID().replace(/-/g, "").toUpperCase();
  return `GOVBR-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}
