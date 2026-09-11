import Link from "next/link";
import { redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { listarProcessosVisiveis } from "@/lib/queries/processos";
import { StatusChip, PrazoChip, Chip } from "@/components/chips";
import { hojeISO } from "@/lib/domain/prazos";
import { podeAbrirProcesso, podeExcluirProcesso } from "@/lib/domain/rbac";
import { Icon } from "@/components/icons";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  const { filtro = "acao", q = "" } = await searchParams;

  const todos = await listarProcessosVisiveis(conta);
  const busca = q.trim().toLowerCase();
  const filtrados = todos.filter((p) => {
    if (filtro === "acao" && !p.temAcaoPendente) return false;
    if (!busca) return true;
    return p.numero.toLowerCase().includes(busca) || p.arrolado.nome.toLowerCase().includes(busca) || p.relatoFato.toLowerCase().includes(busca);
  });
  const hoje = hojeISO();
  const contagemAcao = todos.filter((p) => p.temAcaoPendente).length;

  return (
    <>
      <div className="page-head hstack between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1>Processos</h1>
          <p>Processos administrativos de transgressão disciplinar visíveis ao seu perfil.</p>
        </div>
        <div className="hstack" style={{ gap: 10 }}>
          {podeExcluirProcesso(conta) ? (
            <Link href="/processos/excluidos" className="btn btn-secondary">
              Excluídos
            </Link>
          ) : null}
          {podeAbrirProcesso(conta) ? (
            <Link href="/processos/novo" className="btn btn-primary">
              <Icon name="mais" /> Novo processo
            </Link>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="seg-group">
            <Link href={`/processos?filtro=acao${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="seg-btn" aria-pressed={filtro === "acao"}>
              Aguardando ação ({contagemAcao})
            </Link>
            <Link href={`/processos?filtro=todos${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="seg-btn" aria-pressed={filtro === "todos"}>
              Todos ({todos.length})
            </Link>
          </div>
          <form action="/processos" className="grow" style={{ maxWidth: 280 }}>
            <input type="hidden" name="filtro" value={filtro} />
            <input className="ctrl" type="search" name="q" placeholder="Buscar por número, arrolado ou fato…" defaultValue={q} />
          </form>
        </div>
        <div className="divide">
          {filtrados.length === 0 ? (
            <div className="empty">Nenhum processo encontrado.</div>
          ) : (
            filtrados.map((p) => (
              <Link key={p.id} href={`/processos/${p.id}`} className="proc-row">
                <div className="grow">
                  <div className="top">
                    <span className="num">{p.numero}</span>
                    <StatusChip status={p.status} />
                    {p.arquivadoEm ? <Chip tom="neutro" texto="Arquivado" /> : null}
                  </div>
                  <p className="fato">{p.relatoFato}</p>
                  <div className="meta">
                    <span>
                      Arrolado: <b>{p.arrolado.postoGrad} {p.arrolado.nome}</b>
                    </span>
                    {p.apurador ? (
                      <span>
                        Apurador: <b>{p.apurador.postoGrad} {p.apurador.nome}</b>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="side">
                  <PrazoChip
                    prazo={p.prazoAtivo ? { ...p.prazoAtivo, venceEm: p.prazoAtivo.venceEm.toISOString().slice(0, 10), prorrogadoAte: p.prazoAtivo.prorrogadoAte?.toISOString().slice(0, 10) ?? null } : null}
                    hoje={hoje}
                  />
                  <Icon name="seta" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
