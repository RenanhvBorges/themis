import { BotaoLink } from "@/components/ui/base";
import { IconeCadeado, IconeVoltar } from "@/components/ui/icones";

export function AcessoNegado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="max-w-md rounded-lg border border-neutral-200 bg-white px-6 py-8 text-center">
        <IconeCadeado className="mx-auto size-8 text-neutral-400" />
        <h1 className="mt-3 text-base font-semibold text-neutral-900">
          Documento não disponível
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          A peça não existe ou está fora do seu perfil de acesso. A documentação do PATD é
          classificada como informação pessoal de acesso restrito (Lei nº 12.527/2011,
          art. 31).
        </p>
        <div className="mt-5">
          <BotaoLink href="/processos" variante="secundaria">
            <IconeVoltar className="size-4" />
            Voltar aos processos
          </BotaoLink>
        </div>
      </div>
    </div>
  );
}
