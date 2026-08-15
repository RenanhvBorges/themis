"use client";

import { use } from "react";
import { AcessoNegado } from "@/components/documentos/acesso-negado";
import { RenderizarAnexo } from "@/components/documentos/anexo";
import { Visualizador } from "@/components/documentos/visualizador";
import { useStore } from "@/lib/dados/store";
import { ORDEM_AUTUACAO } from "@/lib/dominio/anexos";
import { podeVer } from "@/lib/dominio/visibilidade";

/** Dossiê consolidado (RF-19): todas as peças na ordem de autuação, em PDF único. */
export default function Dossie({
  params,
}: {
  params: Promise<{ processoId: string }>;
}) {
  const { processoId } = use(params);
  const { estado, conta, militar, pronto } = useStore();

  if (!pronto) return null;

  const processo = estado.processos.find((p) => p.id === processoId);
  if (!processo || !podeVer(processo, conta.perfil, militar.id)) {
    return <AcessoNegado />;
  }

  const documentos = [...processo.documentos].sort((a, b) => {
    const ordem = ORDEM_AUTUACAO.indexOf(a.anexo) - ORDEM_AUTUACAO.indexOf(b.anexo);
    return ordem !== 0 ? ordem : a.criadoEm.localeCompare(b.criadoEm);
  });

  return (
    <Visualizador
      titulo={`Dossiê completo — PATD nº ${processo.numero}`}
      subtitulo={`${documentos.length} peças na ordem de autuação — ${estado.om.sigla}`}
      voltarPara={`/processos/${processo.id}`}
    >
      {documentos.map((doc, i) => (
        <RenderizarAnexo
          key={doc.id}
          processo={processo}
          documento={doc}
          estado={estado}
          primeira={i === 0}
        />
      ))}
    </Visualizador>
  );
}
