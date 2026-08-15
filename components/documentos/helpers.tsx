import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { formatarData, formatarDataHora, dataPorExtenso } from "@/lib/domain/prazos";
import { TARJA_SIGILO, BASES_SIGILO, ITENS_ART10, PUNICOES, ATENUANTES, AGRAVANTES, letrasCircunstancias } from "@/lib/domain/catalogo";
import type { TipoPunicao } from "@prisma/client";

export interface Assinante {
  id: string;
  postoGrad: string;
  quadro: string;
  nome: string;
}

export interface AssinaturaInfo {
  papel: string;
  assinadoEm: Date;
  hash: string;
  protocolo: string;
}

export function nomeCompleto(m: Assinante | null | undefined): string {
  if (!m) return "—";
  return [m.postoGrad, m.quadro, m.nome].filter(Boolean).join(" ");
}

export function identificacaoDoc(m: Assinante | null | undefined): string {
  if (!m) return "—";
  return [m.nome, [m.postoGrad, m.quadro].filter(Boolean).join(" ")].join(", ");
}

export function listarItensNumeros(itens: string[]): string {
  const nums = itens.map((i) => ITENS_ART10.find((it) => it.id === i)?.numero).filter((n): n is number => n != null);
  if (!nums.length) return "—";
  if (nums.length === 1) return String(nums[0]);
  return `${nums.slice(0, -1).join(", ")} e ${nums[nums.length - 1]}`;
}

const NUMEROS_EXTENSO = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte",
];
function porExtensoNum(n: number): string {
  return NUMEROS_EXTENSO[n] ?? String(n);
}

export function frasePunicao(punicao: TipoPunicao | null | undefined, dias: number | null | undefined): string {
  if (!punicao) return "—";
  const rotulo = PUNICOES[punicao]?.rotulo ?? punicao;
  return dias ? `${rotulo} de ${dias} (${porExtensoNum(dias)}) dias` : rotulo;
}

export function letrasAtenuantes(ids: string[]): string {
  return letrasCircunstancias(ids, ATENUANTES);
}
export function letrasAgravantes(ids: string[]): string {
  return letrasCircunstancias(ids, AGRAVANTES);
}

export function Tarja() {
  return (
    <div className="tarja">
      <div className="t1">{TARJA_SIGILO}</div>
      {BASES_SIGILO.map((b) => (
        <div className="t2" key={b}>
          {b}
        </div>
      ))}
    </div>
  );
}

export function Timbre({ omNome }: { omNome: string }) {
  return (
    <div className="timbre">
      <div>MINISTÉRIO DA DEFESA</div>
      <div>COMANDO DA AERONÁUTICA</div>
      <div>{omNome}</div>
    </div>
  );
}

export function TituloDoc({ titulo, subtitulo }: { titulo: string; subtitulo?: string }) {
  return (
    <div className="doc-title">
      <h1>{titulo}</h1>
      {subtitulo ? <div className="sub">{subtitulo}</div> : null}
    </div>
  );
}

export function Quadro({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="quadro">
      <h2>{titulo}</h2>
      <div className="qb">{children}</div>
    </div>
  );
}

export function SigBloco({ nome, papel, assinatura }: { nome: string; papel: string; assinatura: AssinaturaInfo | null }) {
  if (!assinatura) {
    return (
      <div className="sig-manual">
        <div className="line">{nome}</div>
        <div>{papel}</div>
      </div>
    );
  }
  return (
    <div className="sig-elet">
      <div className="box">
        <div>
          <span className="who">Documento assinado eletronicamente</span> por <span className="who">{nome}</span>, {papel}, em{" "}
          {formatarDataHora(assinatura.assinadoEm.toISOString())}, com fundamento no art. 4º da Lei nº 14.063, de 23 de setembro de 2020 (assinatura
          eletrônica avançada).
        </div>
        <div className="meta">
          Protocolo gov.br: {assinatura.protocolo} · Hash SHA-256: {assinatura.hash}
        </div>
      </div>
    </div>
  );
}

export function Folha({ children, rodape }: { children: ReactNode; rodape?: string }) {
  return (
    <div className="folha">
      {children}
      {rodape ? <div className="rodape">{rodape}</div> : null}
    </div>
  );
}

export function Fecho({ data }: { data: string }) {
  return <div className="fecho">{data}</div>;
}

export function ItalNote({ children }: { children: ReactNode }) {
  return <p className="ital-note">{children}</p>;
}

export function PersonName({ children }: { children: ReactNode }) {
  return <p className="person-name">{children}</p>;
}

export function H2Center({ children }: { children: ReactNode }) {
  return <div className="h2-center">{children}</div>;
}

export { formatarData, formatarDataHora, dataPorExtenso };
export { Icon };
