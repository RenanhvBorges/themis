"use client";

/**
 * Store do protótipo.
 *
 * Substitui, no piloto de demonstração, a camada PostgreSQL/Prisma prevista no PRD:
 * mantém o estado em memória e o persiste no `localStorage`, para que a demonstração
 * sobreviva a recarregamentos de página. As regras de negócio NÃO moram aqui — ficam
 * em `lib/dominio/`, que é a parte destinada a sobreviver à troca da persistência.
 *
 * É um store externo consumido por `useSyncExternalStore`: no servidor e durante a
 * hidratação o instantâneo é o da semente (`pronto: false`), e só depois React troca
 * para o instantâneo do navegador. Isso evita divergência de hidratação sem precisar
 * de efeitos que disparam re-render em cascata.
 */

import { useCallback, useSyncExternalStore } from "react";
import type { Contexto } from "@/lib/dominio/acoes";
import type {
  Conta,
  EstadoSistema,
  Militar,
  Origem,
  Processo,
} from "@/lib/dominio/tipos";
import { criarEstadoInicial } from "./seed";
import { hojeISO } from "./util";

const CHAVE_ESTADO = "themis.estado.v1";
const CHAVE_CONTA = "themis.conta.v1";
const CONTA_PADRAO = "cta-cmt";

interface Instantaneo {
  estado: EstadoSistema;
  contaId: string;
  /** False no servidor e durante a hidratação; true depois que o navegador assume. */
  pronto: boolean;
}

const ouvintes = new Set<() => void>();

let cacheServidor: Instantaneo | null = null;
let cacheCliente: Instantaneo | null = null;

function semente(): EstadoSistema {
  return criarEstadoInicial(hojeISO());
}

function instantaneoServidor(): Instantaneo {
  cacheServidor ??= { estado: semente(), contaId: CONTA_PADRAO, pronto: false };
  return cacheServidor;
}

function lerDoNavegador(): Instantaneo {
  try {
    const bruto = window.localStorage.getItem(CHAVE_ESTADO);
    const salvo = bruto ? (JSON.parse(bruto) as EstadoSistema) : null;
    return {
      estado: salvo?.processos?.length ? salvo : semente(),
      contaId: window.localStorage.getItem(CHAVE_CONTA) ?? CONTA_PADRAO,
      pronto: true,
    };
  } catch {
    return { estado: semente(), contaId: CONTA_PADRAO, pronto: true };
  }
}

function instantaneoCliente(): Instantaneo {
  cacheCliente ??= lerDoNavegador();
  return cacheCliente;
}

function persistir(i: Instantaneo) {
  try {
    window.localStorage.setItem(CHAVE_ESTADO, JSON.stringify(i.estado));
    window.localStorage.setItem(CHAVE_CONTA, i.contaId);
  } catch {
    // Armazenamento indisponível (aba anônima, cota cheia): a demonstração segue
    // em memória, apenas sem sobreviver ao recarregamento.
  }
}

function definir(atualizar: (atual: Instantaneo) => Instantaneo) {
  const proximo = atualizar(instantaneoCliente());
  cacheCliente = proximo;
  persistir(proximo);
  for (const ouvinte of ouvintes) ouvinte();
}

function subscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function proximoNumero(estado: EstadoSistema): string {
  const ano = new Date().getFullYear();
  const maior = estado.processos.reduce((max, p) => {
    const n = Number(p.numero.split("/")[0]);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${String(maior + 1).padStart(3, "0")}/SIJ/${ano}`;
}

export interface ValorStore {
  estado: EstadoSistema;
  conta: Conta;
  militar: Militar;
  hoje: string;
  pronto: boolean;
  trocarConta: (contaId: string) => void;
  aplicar: (
    processoId: string,
    transicao: (p: Processo, ctx: Contexto) => Processo,
  ) => void;
  abrirProcesso: (dados: {
    arroladoId: string;
    origem: Origem;
    relato: string;
  }) => string;
  reiniciar: () => void;
}

export function useStore(): ValorStore {
  const i = useSyncExternalStore(
    subscrever,
    instantaneoCliente,
    instantaneoServidor,
  );

  const conta =
    i.estado.contas.find((c) => c.id === i.contaId) ?? i.estado.contas[0];
  const militar =
    i.estado.militares.find((m) => m.id === conta.militarId) ?? i.estado.militares[0];

  const trocarConta = useCallback((contaId: string) => {
    definir((atual) => ({ ...atual, contaId }));
  }, []);

  const aplicar = useCallback<ValorStore["aplicar"]>((processoId, transicao) => {
    definir((atual) => {
      const contaAtual =
        atual.estado.contas.find((c) => c.id === atual.contaId) ??
        atual.estado.contas[0];
      const ctx: Contexto = {
        autorId: contaAtual.militarId,
        autorPerfil: contaAtual.perfil,
        em: new Date().toISOString(),
        data: hojeISO(),
      };
      return {
        ...atual,
        estado: {
          ...atual.estado,
          processos: atual.estado.processos.map((p) =>
            p.id === processoId ? transicao(p, ctx) : p,
          ),
        },
      };
    });
  }, []);

  const abrirProcesso = useCallback<ValorStore["abrirProcesso"]>(
    ({ arroladoId, origem, relato }) => {
      const data = hojeISO();
      const agora = new Date().toISOString();
      const atual = instantaneoCliente();
      const numero = proximoNumero(atual.estado);
      const id = `proc-${numero.replace(/\//g, "-")}`;
      const autor =
        atual.estado.contas.find((c) => c.id === atual.contaId) ??
        atual.estado.contas[0];

      const novo: Processo = {
        id,
        numero,
        status: "PARA_ABERTURA",
        omId: atual.estado.om.id,
        arroladoId,
        comandanteId:
          atual.estado.contas.find((c) => c.perfil === "COMANDANTE")?.militarId ??
          atual.estado.militares[0].id,
        origem,
        relatoFato: relato,
        itensArt10: [],
        abertoEm: data,
        inquiricoes: [],
        documentos: [
          {
            id: `doc-origem-${id}`,
            processoId: id,
            anexo: "ORIGEM",
            titulo: "Documento de origem",
            criadoEm: agora,
            dados: { numero: origem.numero, protocolo: origem.protocoloComaer ?? "" },
            assinaturas: [],
            anexado: true,
          },
        ],
        prazos: [],
        eventos: [
          {
            id: `evt-abertura-${id}`,
            processoId: id,
            em: agora,
            autorId: autor.militarId,
            autorPerfil: autor.perfil,
            acao: "Abertura registrada",
            detalhe: `Documento de origem ${origem.numero} lançado no sistema.`,
            hash: "",
          },
        ],
      };

      definir((a) => ({
        ...a,
        estado: { ...a.estado, processos: [novo, ...a.estado.processos] },
      }));
      return id;
    },
    [],
  );

  const reiniciar = useCallback(() => {
    definir(() => ({ estado: semente(), contaId: CONTA_PADRAO, pronto: true }));
  }, []);

  return {
    estado: i.estado,
    conta,
    militar,
    hoje: hojeISO(),
    pronto: i.pronto,
    trocarConta,
    aplicar,
    abrirProcesso,
    reiniciar,
  };
}

