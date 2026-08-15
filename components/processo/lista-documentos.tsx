import Link from "next/link";
import { Etiqueta, Vazio } from "@/components/ui/base";
import { IconeAssinatura, IconeDocumento } from "@/components/ui/icones";
import { militarPorId, nomeCurto } from "@/lib/dados/seed";
import { ORDEM_AUTUACAO } from "@/lib/dominio/anexos";
import { formatarData } from "@/lib/dominio/prazos";
import type { EstadoSistema, Processo } from "@/lib/dominio/tipos";

export function ListaDocumentos({
  processo,
  estado,
}: {
  processo: Processo;
  estado: EstadoSistema;
}) {
  // Os autos são exibidos na ordem de autuação (RF-19), não na ordem de criação.
  const documentos = [...processo.documentos].sort((a, b) => {
    const ordem = ORDEM_AUTUACAO.indexOf(a.anexo) - ORDEM_AUTUACAO.indexOf(b.anexo);
    return ordem !== 0 ? ordem : a.criadoEm.localeCompare(b.criadoEm);
  });

  if (!documentos.length) {
    return <Vazio>Nenhum documento nos autos ainda.</Vazio>;
  }

  return (
    <ul className="divide-y divide-neutral-200">
      {documentos.map((doc, i) => (
        <li key={doc.id}>
          <Link
            href={`/documento/${processo.id}/${doc.id}`}
            className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-primary-50"
          >
            <IconeDocumento className="mt-0.5 size-4 shrink-0 text-neutral-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">{doc.titulo}</p>
              <p className="mt-0.5 text-xs text-neutral-600">
                fls. {i + 1} · {formatarData(doc.criadoEm.slice(0, 10))}
                {doc.anexado ? " · anexado ao sistema" : ""}
              </p>
              {doc.assinaturas.length ? (
                <ul className="mt-1.5 space-y-0.5">
                  {doc.assinaturas.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-1.5 text-xs text-neutral-600"
                    >
                      <IconeAssinatura className="size-3 shrink-0 text-success-base" />
                      {nomeCurto(militarPorId(estado, a.signatarioId))} — {a.papel}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {doc.assinaturas.length ? (
              <Etiqueta tom="sucesso">
                {doc.assinaturas.length} assinatura
                {doc.assinaturas.length > 1 ? "s" : ""}
              </Etiqueta>
            ) : (
              <Etiqueta tom="neutro">Sem assinatura</Etiqueta>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
