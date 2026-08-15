import type { StatusProcesso } from "@prisma/client";
import { ESTADOS, ORDEM_ESTADOS, TRILHA_PADRAO, ROTULO_PERFIL, posicaoNaOrdem } from "@/lib/domain/estados";
import { formatarData } from "@/lib/domain/prazos";
import { Icon } from "./icons";

interface DatasPorEstado {
  PARA_ABERTURA?: Date | string | null;
  A_CIENTIFICAR?: Date | string | null;
  AGUARDANDO_DEFESA?: Date | string | null;
  EM_APURACAO?: Date | string | null;
  AGUARDANDO_DESPACHO?: Date | string | null;
  AGUARDANDO_DECISAO?: Date | string | null;
  CIENCIA_DA_DECISAO?: Date | string | null;
  RECONSIDERACAO_EM_ANALISE?: Date | string | null;
  CIENCIA_NOVA_DECISAO?: Date | string | null;
  FINALIZADO?: Date | string | null;
}

export function Trilha({ status, houveReconsideracao, datas }: { status: StatusProcesso; houveReconsideracao: boolean; datas: DatasPorEstado }) {
  const passos = houveReconsideracao ? ORDEM_ESTADOS : TRILHA_PADRAO;
  const posAtual = posicaoNaOrdem(status);

  return (
    <div className="trilha">
      {passos.map((s, i) => {
        const def = ESTADOS[s];
        const pos = posicaoNaOrdem(s);
        const done = pos < posAtual;
        const active = pos === posAtual;
        const data = datas[s];
        return (
          <div key={s} className={`trilha-step${done ? " done" : ""}${active ? " active" : ""}`}>
            {i < passos.length - 1 ? <div className="rail" /> : null}
            <div className="dot">{done ? <Icon name="check" /> : def.etapa}</div>
            <div className="content">
              <span className="ttl">
                {def.titulo}
                {active ? <span className="badge-atual">Atual</span> : null}
              </span>
              <div className="meta">
                {data ? formatarData(typeof data === "string" ? data : data.toISOString().slice(0, 10)) : active ? `Aguardando: ${def.aguardando}` : def.responsavel ? ROTULO_PERFIL[def.responsavel] : "—"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
