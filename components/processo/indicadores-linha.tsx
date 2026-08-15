import { Etiqueta } from "@/components/ui/base";
import { prazoAtivo } from "@/lib/dominio/acoes";
import { ESTADOS } from "@/lib/dominio/estados";
import {
  DIAS_POR_PRAZO,
  diasUteisRestantes,
  formatarData,
  situacaoDoPrazo,
} from "@/lib/dominio/prazos";
import type { Processo } from "@/lib/dominio/tipos";

export function EtiquetaStatus({ processo }: { processo: Processo }) {
  const def = ESTADOS[processo.status];
  return (
    <Etiqueta tom={def.tom} ponto>
      {def.etapa}. {def.titulo}
    </Etiqueta>
  );
}

/** Chip do prazo em curso — some quando não há prazo aberto no processo. */
export function ChipPrazo({
  processo,
  hoje,
  detalhado = false,
}: {
  processo: Processo;
  hoje: string;
  detalhado?: boolean;
}) {
  const prazo = prazoAtivo(processo);
  if (!prazo || processo.status === "FINALIZADO") return null;

  const situacao = situacaoDoPrazo(prazo, hoje);
  const limite = prazo.prorrogadoAte ?? prazo.venceEm;
  const restantes = diasUteisRestantes(limite, hoje);

  const texto =
    restantes < 0
      ? `venceu há ${Math.abs(restantes)} d. úteis`
      : restantes === 0
        ? "vence hoje"
        : `${restantes} d. úteis`;

  const tom =
    situacao === "VENCIDO" ? "perigo" : situacao === "EM_RISCO" ? "aviso" : "info";

  return (
    <Etiqueta tom={tom}>
      {detalhado ? `${DIAS_POR_PRAZO[prazo.tipo].rotulo}: ` : ""}
      {texto}
      {detalhado ? ` (até ${formatarData(limite)})` : ""}
    </Etiqueta>
  );
}
