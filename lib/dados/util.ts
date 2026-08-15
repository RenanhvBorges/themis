import { deISO, ehDiaUtil, paraISO } from "@/lib/dominio/prazos";

/** Data de hoje no fuso das OM do piloto, em ISO (só data). */
export function hojeISO(): string {
  const agora = new Date();
  const local = new Date(
    agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  return paraISO(
    new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate())),
  );
}

function somar(iso: string, dias: number): string {
  const d = deISO(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return paraISO(d);
}

/** Retrocede `n` dias úteis a partir de `iso`. */
export function voltarDiasUteis(iso: string, n: number): string {
  let cursor = iso;
  let restantes = n;
  while (restantes > 0) {
    cursor = somar(cursor, -1);
    if (ehDiaUtil(cursor)) restantes -= 1;
  }
  return cursor;
}

export function voltarDiasCorridos(iso: string, n: number): string {
  return somar(iso, -n);
}

/** Combina data ISO com um horário de expediente, para carimbar eventos. */
export function comHora(iso: string, hora: number, minuto = 0): string {
  // -03:00 é o fuso de Brasília, onde ficam as OM do piloto.
  const hh = String(hora).padStart(2, "0");
  const mm = String(minuto).padStart(2, "0");
  return `${iso}T${hh}:${mm}:00-03:00`;
}
