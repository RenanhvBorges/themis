import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { contaAtual } from "@/lib/auth/current";
import { carregarProcessoDetalhe } from "@/lib/queries/processo-detalhe";
import { AnexoDocumento } from "@/components/documentos/Anexos";
import { Icon } from "@/components/icons";
import { BotaoImprimir } from "@/components/BotaoImprimir";

export default async function DocumentoPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const conta = await contaAtual();
  if (!conta) redirect("/login");
  const { id, docId } = await params;

  const resultado = await carregarProcessoDetalhe(id, conta);
  if (!resultado) notFound();
  if (resultado.negado) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        A peça não existe ou está fora do seu perfil de acesso.
      </div>
    );
  }

  const documento = resultado.processo.documentos.find((d) => d.id === docId);
  if (!documento) notFound();

  return (
    <div className="doc-viewer-shell">
      <div className="viewer-topbar">
        <div className="viewer-topbar-row">
          <Link href={`/processos/${id}`} className="viewer-back">
            <Icon name="voltar" /> Voltar ao processo
          </Link>
          <div style={{ textAlign: "right" }}>
            <h1>{documento.titulo}</h1>
            <div className="sub">{resultado.processo.numero}</div>
          </div>
        </div>
      </div>
      <div className="viewer-pages">
        <AnexoDocumento processo={resultado.processo} documento={documento} />
      </div>
      <div className="viewer-note">
        Este documento eletrônico integra o PATD nº {resultado.processo.numero}. A conferência de assinaturas eletrônicas pode ser feita pelo hash
        SHA-256 e pelo protocolo indicados junto a cada assinatura.
        <div>
          <BotaoImprimir />
        </div>
      </div>
    </div>
  );
}
