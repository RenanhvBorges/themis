import type { StatusProcesso } from "@prisma/client";
import { ESTADOS, type Tom } from "@/lib/domain/estados";
import { DIAS_POR_PRAZO, diasUteisRestantes, situacaoDoPrazo, type PrazoLike } from "@/lib/domain/prazos";
import { formatarData } from "@/lib/domain/prazos";

export function Chip({ tom, texto, ponto }: { tom: Tom; texto: string; ponto?: boolean }) {
  return (
    <span className={`chip tone-${tom}`}>
      {ponto ? <span className="dot" /> : null}
      {texto}
    </span>
  );
}

export function StatusChip({ status }: { status: StatusProcesso }) {
  const def = ESTADOS[status];
  return <Chip tom={def.tom} texto={`${def.etapa}. ${def.titulo}`} ponto />;
}

export function PrazoChip({
  prazo,
  hoje,
  detalhado,
}: {
  prazo: (PrazoLike & { tipo: keyof typeof DIAS_POR_PRAZO }) | null;
  hoje: string;
  detalhado?: boolean;
}) {
  if (!prazo) return null;
  const situacao = situacaoDoPrazo(prazo, hoje);
  const limite = prazo.prorrogadoAte || prazo.venceEm;
  const restantes = diasUteisRestantes(limite, hoje);
  const texto = restantes < 0 ? `venceu há ${Math.abs(restantes)} d. úteis` : restantes === 0 ? "vence hoje" : `${restantes} d. úteis`;
  const tom: Tom = situacao === "VENCIDO" ? "perigo" : situacao === "EM_RISCO" ? "aviso" : "info";
  const prefixo = detalhado ? `${DIAS_POR_PRAZO[prazo.tipo].rotulo}: ` : "";
  const sufixo = detalhado ? ` (até ${formatarData(limite)})` : "";
  return <Chip tom={tom} texto={`${prefixo}${texto}${sufixo}`} />;
}
