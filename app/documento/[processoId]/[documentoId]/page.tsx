"use client";

import { use } from "react";
import { RenderizarAnexo } from "@/components/documentos/anexo";
import { Visualizador } from "@/components/documentos/visualizador";
import { AcessoNegado } from "@/components/documentos/acesso-negado";
import { useStore } from "@/lib/dados/store";
import { podeVer } from "@/lib/dominio/visibilidade";

export default function VerDocumento({
  params,
}: {
  params: Promise<{ processoId: string; documentoId: string }>;
}) {
  const { processoId, documentoId } = use(params);
  const { estado, conta, militar, pronto } = useStore();

  if (!pronto) return null;

  const processo = estado.processos.find((p) => p.id === processoId);
  if (!processo || !podeVer(processo, conta.perfil, militar.id)) {
    return <AcessoNegado />;
  }

  const documento = processo.documentos.find((d) => d.id === documentoId);
  if (!documento) return <AcessoNegado />;

  return (
    <Visualizador
      titulo={documento.titulo}
      subtitulo={`PATD nº ${processo.numero} — ${estado.om.sigla}`}
      voltarPara={`/processos/${processo.id}`}
    >
      <RenderizarAnexo processo={processo} documento={documento} estado={estado} />
    </Visualizador>
  );
}
