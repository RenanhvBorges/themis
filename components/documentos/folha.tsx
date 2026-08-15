import { BASES_SIGILO, TARJA_SIGILO, TIMBRE } from "@/lib/dominio/anexos";
import { formatarDataHora } from "@/lib/dominio/prazos";
import type { Assinatura, OrganizacaoMilitar } from "@/lib/dominio/tipos";
import { cn } from "@/lib/ui";

/** Folha A4 — mesma marcação usada na tela e na impressão/PDF. */
export function Folha({
  children,
  rodape,
  primeira = false,
}: {
  children: React.ReactNode;
  rodape?: string;
  primeira?: boolean;
}) {
  return (
    <article
      data-folha
      data-quebra-pagina={primeira ? undefined : true}
      className={cn(
        "mx-auto w-full max-w-[210mm] border border-neutral-300 bg-white",
        "px-[18mm] py-[16mm] shadow-[0_2px_8px_rgba(41,52,69,0.10)]",
        "font-documento text-[11.5pt] leading-[1.55] text-black",
        !primeira && "mt-6",
      )}
    >
      {children}
      {rodape ? (
        <p className="mt-10 border-t border-neutral-300 pt-2 text-[9pt]">{rodape}</p>
      ) : null}
    </article>
  );
}

/** Tarja de sigilo obrigatória em todas as peças dos autos (RNF-01). */
export function Tarja() {
  return (
    <div className="mb-6 border border-black px-3 py-2 text-center">
      <p className="text-[10.5pt] font-bold tracking-wide">{TARJA_SIGILO}</p>
      {BASES_SIGILO.map((b) => (
        <p key={b} className="text-[8pt] leading-snug">
          {b}
        </p>
      ))}
    </div>
  );
}

export function Timbre({ om }: { om: OrganizacaoMilitar }) {
  return (
    <div className="mb-6 text-center text-[11pt] font-bold tracking-wide uppercase">
      {TIMBRE.map((l) => (
        <p key={l}>{l}</p>
      ))}
      <p>{om.nome}</p>
    </div>
  );
}

export function TituloDocumento({
  children,
  subtitulo,
}: {
  children: React.ReactNode;
  subtitulo?: string;
}) {
  return (
    <header className="mb-6 text-center">
      <h1 className="text-[12pt] font-bold uppercase">{children}</h1>
      {subtitulo ? <p className="mt-1 text-[11pt]">{subtitulo}</p> : null}
    </header>
  );
}

export function Paragrafo({
  children,
  semRecuo = false,
}: {
  children: React.ReactNode;
  semRecuo?: boolean;
}) {
  return (
    <p className={cn("mt-4 text-justify", !semRecuo && "indent-[2.5cm]")}>
      {children}
    </p>
  );
}

export function Fecho({ texto }: { texto: string }) {
  return <p className="mt-8 text-right">{texto}</p>;
}

/**
 * Bloco de assinatura. Quando o ato já foi assinado no sistema, a linha manuscrita dá
 * lugar ao carimbo eletrônico com identidade, data-hora, protocolo e hash — é isso que
 * substitui, nos autos digitais, a assinatura de próprio punho e as testemunhas.
 */
export function BlocoAssinatura({
  nome,
  papel,
  assinatura,
}: {
  nome: string;
  papel: string;
  assinatura?: Assinatura;
}) {
  if (!assinatura) {
    return (
      <div className="mt-10 text-center">
        <p className="mx-auto w-[9cm] border-t border-black pt-1">{nome}</p>
        <p>{papel}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mx-auto max-w-[15cm] border border-neutral-500 px-3 py-2">
        <p className="text-[9pt] leading-snug">
          <span className="font-bold">Documento assinado eletronicamente</span> por{" "}
          <span className="font-bold">{nome}</span>, {papel}, em{" "}
          {formatarDataHora(assinatura.assinadoEm)}, com fundamento no art. 4º da Lei nº
          14.063, de 23 de setembro de 2020 (assinatura eletrônica avançada).
        </p>
        <p className="mt-1 text-[8pt] break-all">
          Protocolo gov.br: {assinatura.protocolo} · Hash SHA-256: {assinatura.hash}
        </p>
      </div>
    </div>
  );
}

export function Quadro({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 border border-black">
      <h2 className="border-b border-black bg-neutral-100 px-2 py-1 text-[10pt] font-bold uppercase">
        {titulo}
      </h2>
      <div className="px-2 py-2 text-[11pt]">{children}</div>
    </section>
  );
}
