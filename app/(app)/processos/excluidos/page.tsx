import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { podeExcluirProcesso } from "@/lib/domain/rbac";
import { listarProcessosExcluidos } from "@/lib/queries/processos";
import { Icon } from "@/components/icons";
import { formatarDataHora } from "@/lib/domain/prazos";

export default async function ProcessosExcluidosPage() {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  if (!podeExcluirProcesso(conta)) notFound();

  const excluidos = await listarProcessosExcluidos(conta);

  return (
    <>
      <Link href="/processos" className="hstack" style={{ gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
        <Icon name="voltar" /> Voltar para processos
      </Link>

      <div className="page-head">
        <h1>Processos excluídos</h1>
        <p>Trilha de auditoria dos processos excluídos por engano de abertura ou por serem de teste. Não contam na numeração e não aparecem nas listagens normais.</p>
      </div>

      <div className="card">
        <div className="divide">
          {excluidos.length === 0 ? (
            <div className="empty">Nenhum processo excluído.</div>
          ) : (
            excluidos.map((p) => (
              <Link key={p.id} href={`/processos/${p.id}`} className="proc-row">
                <div className="grow">
                  <div className="top">
                    <span className="num">{p.numero}</span>
                  </div>
                  <p className="fato">{p.relatoFato}</p>
                  <div className="meta">
                    <span>
                      Arrolado: <b>{p.arrolado.postoGrad} {p.arrolado.nome}</b>
                    </span>
                    <span>
                      Excluído por: <b>{p.excluidoPor ? `${p.excluidoPor.postoGrad} ${p.excluidoPor.nome}` : "—"}</b> em {formatarDataHora(p.excluidoEm!.toISOString())}
                    </span>
                  </div>
                  {p.motivoExclusao ? <p className="fato">Motivo: {p.motivoExclusao}</p> : null}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
