import Link from "next/link";
import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { podeVerPainel } from "@/lib/domain/rbac";
import { carregarPainel } from "@/lib/queries/painel";
import { Icon } from "@/components/icons";

export default async function PainelPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeVerPainel(conta)) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            O painel de indicadores é de acesso exclusivo do Comandante. Os dados agregados podem permitir identificar militares em processos aos
            quais este perfil não tem acesso (Lei nº 12.527/2011, art. 31).
          </p>
        </div>
      </div>
    );
  }

  const dados = await carregarPainel(conta.omId);
  const maiorGrupo = Math.max(1, ...dados.porStatus.map((s) => s.quantidade));

  return (
    <>
      <div className="page-head">
        <h1>Painel</h1>
        <p>Indicadores agregados dos processos administrativos de transgressão disciplinar.</p>
      </div>

      <div className="grid-4">
        <div className="card kpi">
          <div className="lbl">
            <Icon name="processos" /> Total de processos
          </div>
          <div className="val">{dados.total}</div>
        </div>
        <div className="card kpi">
          <div className="lbl">
            <Icon name="relogio" /> Em andamento
          </div>
          <div className="val tone-info">{dados.emAndamento}</div>
        </div>
        <div className="card kpi">
          <div className="lbl">
            <Icon name="alerta" /> Requerem atenção
          </div>
          <div className="val tone-aviso">{dados.criticos.length}</div>
          <div className="det">Prazo vencido ou em risco</div>
        </div>
        <div className="card kpi">
          <div className="lbl">
            <Icon name="check" /> Finalizados
          </div>
          <div className="val tone-sucesso">{dados.finalizados}</div>
        </div>
      </div>

      <div className="grid-5-3">
        <div className="card">
          <div className="card-head">
            <h2>Processos por etapa</h2>
          </div>
          <div className="bars">
            {dados.porStatus.length === 0 ? (
              <div className="empty">Nenhum processo cadastrado.</div>
            ) : (
              dados.porStatus.map((s) => (
                <div key={s.status} className="bar-row">
                  <div className="top">
                    <span className="name">{s.titulo}</span>
                    <span className="num">{s.quantidade}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(s.quantidade / maiorGrupo) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Desfechos</h2>
          </div>
          <div className="donut-wrap">
            <div className="legend-list">
              <div className="legend-item">
                <span className="sw" style={{ background: "var(--danger)" }} />
                <span className="name">Punições aplicadas</span>
                <span className="num">{dados.punicoes}</span>
              </div>
              <div className="legend-item">
                <span className="sw" style={{ background: "var(--success)" }} />
                <span className="name">Arquivamentos</span>
                <span className="num">{dados.arquivamentos}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Processos que requerem atenção</h2>
          <p>Ordenados por urgência — prazo vencido primeiro.</p>
        </div>
        <div className="divide">
          {dados.criticos.length === 0 ? (
            <div className="empty">Nenhum processo com prazo vencido ou em risco.</div>
          ) : (
            dados.criticos.map((p) => (
              <Link key={p.id} href={`/processos/${p.id}`} className="critical-row">
                <div>
                  <b>{p.numero}</b>
                  <div className="sub">
                    {p.arrolado.postoGrad} {p.arrolado.nome}
                  </div>
                </div>
                <span className={`num tone-${p.situacao === "VENCIDO" ? "perigo" : "aviso"}`}>{p.situacao === "VENCIDO" ? "Vencido" : "Em risco"}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
