import type { Tom } from "@/lib/dominio/estados";

export function cn(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ");
}

/** Classes de cada tom semântico — um único lugar para ajustar a paleta de status. */
export const TOM_CLASSES: Record<Tom, string> = {
  neutro: "bg-neutral-100 text-neutral-700 border-neutral-300",
  info: "bg-info-bg text-info-text border-info-border",
  aviso: "bg-warning-bg text-warning-text border-warning-border",
  sucesso: "bg-success-bg text-success-text border-success-border",
  perigo: "bg-danger-bg text-danger-text border-danger-border",
};

export const TOM_PONTO: Record<Tom, string> = {
  neutro: "bg-neutral-400",
  info: "bg-info-base",
  aviso: "bg-warning-base",
  sucesso: "bg-success-base",
  perigo: "bg-danger-base",
};
