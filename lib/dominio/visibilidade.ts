/**
 * Controle de acesso por perfil (RF-24 / RNF-01).
 *
 * Toda a documentação do PATD é classificada como "Informação Pessoal – Acesso
 * Restrito" (Lei 12.527/2011, art. 31), então a lista de processos nunca é filtrada
 * na tela: é filtrada aqui, e a tela só enxerga o que já passou por este ponto.
 */

import type { Conta, EstadoSistema, Perfil, Processo } from "./tipos";

export function podeVer(p: Processo, perfil: Perfil, militarId: string): boolean {
  switch (perfil) {
    case "COMANDANTE":
    case "ADMIN":
      // Atuam sobre todos os PATD da própria OM.
      return true;
    case "APURADOR":
      // Só os processos em que foi designado.
      return p.apuradorId === militarId;
    case "ARROLADO":
      // Só os próprios processos.
      return p.arroladoId === militarId;
  }
}

export function processosVisiveis(
  estado: EstadoSistema,
  conta: Conta,
): Processo[] {
  return estado.processos.filter((p) =>
    podeVer(p, conta.perfil, conta.militarId),
  );
}

/**
 * O painel de indicadores é restrito ao Comandante (RF-23). Os demais perfis não
 * enxergam agregados que permitam inferir dados de processos alheios.
 */
export function podeVerPainel(perfil: Perfil): boolean {
  return perfil === "COMANDANTE";
}

export function podeAbrirProcesso(perfil: Perfil): boolean {
  return perfil === "ADMIN";
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  COMANDANTE: "Comandante",
  ADMIN: "Admin",
  APURADOR: "Oficial Apurador",
  ARROLADO: "Militar Arrolado",
};
