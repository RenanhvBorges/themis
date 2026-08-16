import { prisma } from "@/lib/prisma";

export async function listarUsuarios(omId: string) {
  return prisma.militar.findMany({
    where: { omId },
    select: {
      id: true,
      nome: true,
      postoGrad: true,
      saram: true,
      secao: true,
      conta: {
        select: {
          id: true,
          ativa: true,
          perfisFuncionais: true,
          deveTrocarSenha: true,
          ultimoLoginEm: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });
}

export type UsuarioLinha = Awaited<ReturnType<typeof listarUsuarios>>[number];
