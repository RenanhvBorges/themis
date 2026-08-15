"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Aviso, Botao, CabecalhoCartao, Cartao } from "@/components/ui/base";
import {
  CampoArea,
  CampoOpcoes,
  CampoSelect,
  CampoTexto,
} from "@/components/ui/formulario";
import { IconeVoltar } from "@/components/ui/icones";
import { nomeCompleto } from "@/lib/dados/seed";
import { useStore } from "@/lib/dados/store";
import type { Origem } from "@/lib/dominio/tipos";
import { podeAbrirProcesso } from "@/lib/dominio/visibilidade";

export default function NovoProcesso() {
  const { estado, conta, hoje, abrirProcesso } = useStore();
  const router = useRouter();

  const candidatos = estado.militares.filter((m) => m.id !== conta.militarId);
  const [arroladoId, setArroladoId] = useState(candidatos[0]?.id ?? "");
  const [tipo, setTipo] = useState<Origem["tipo"]>("OFICIO");
  const [numero, setNumero] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const [relato, setRelato] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  if (!podeAbrirProcesso(conta.perfil)) {
    return (
      <div className="mx-auto max-w-2xl">
        <Cartao>
          <CabecalhoCartao titulo="Acesso restrito" />
          <p className="px-5 py-6 text-sm leading-relaxed text-neutral-700">
            A abertura de PATD é atribuição do perfil Admin, que recebe o documento de
            origem e o lança no sistema.
          </p>
        </Cartao>
      </div>
    );
  }

  function enviar() {
    setErro(null);
    if (!numero.trim()) {
      setErro("Informe o número do documento de origem.");
      return;
    }
    if (relato.trim().length < 20) {
      setErro("Descreva o fato relatado com mais detalhe.");
      return;
    }
    const id = abrirProcesso({
      arroladoId,
      origem: {
        tipo,
        numero: numero.trim(),
        data: hoje,
        protocoloComaer: protocolo.trim() || undefined,
      },
      relato: relato.trim(),
    });
    router.push(`/processos/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/processos")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 transition-colors hover:text-primary-700"
        >
          <IconeVoltar className="size-4" />
          Processos
        </button>
      </div>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Abrir Processo de Apuração
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Etapa 1 — lançamento do documento que relatou o fato. A designação do apurador
          e o enquadramento no art. 10 do RDAER acontecem na autuação, logo em seguida.
        </p>
      </header>

      <Cartao>
        <CabecalhoCartao titulo="Documento de origem" />
        <div className="space-y-5 px-5 py-5">
          {erro ? <Aviso tom="perigo">{erro}</Aviso> : null}

          <CampoOpcoes
            rotulo="Tipo de documento"
            valor={tipo}
            aoMudar={setTipo}
            opcoes={[
              { valor: "OFICIO", rotulo: "Ofício" },
              { valor: "PARTE", rotulo: "Parte disciplinar" },
              { valor: "SINDICANCIA", rotulo: "Sindicância" },
              { valor: "IPM", rotulo: "IPM" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Número do documento"
              valor={numero}
              aoMudar={setNumero}
              placeholder="ex.: 184/SP/2026"
              obrigatorio
            />
            <CampoTexto
              rotulo="Protocolo COMAER"
              valor={protocolo}
              aoMudar={setProtocolo}
              placeholder="ex.: 67210.004182/2026-11"
            />
          </div>

          <CampoSelect
            rotulo="Militar arrolado"
            ajuda="No piloto o cadastro é manual — a integração com SARAM/SIGPES está fora do MVP."
            valor={arroladoId}
            aoMudar={setArroladoId}
            obrigatorio
            opcoes={candidatos.map((m) => ({
              valor: m.id,
              rotulo: `${nomeCompleto(m)} — SARAM ${m.saram}`,
            }))}
          />

          <CampoArea
            rotulo="Fato relatado"
            ajuda="Transcreva o que o documento de origem relata. O texto pode ser refinado na autuação."
            valor={relato}
            aoMudar={setRelato}
            obrigatorio
            linhas={7}
          />
        </div>
        <footer className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3.5">
          <Botao variante="sutil" onClick={() => router.push("/processos")}>
            Cancelar
          </Botao>
          <Botao variante="primaria" onClick={enviar}>
            Registrar abertura
          </Botao>
        </footer>
      </Cartao>
    </div>
  );
}
