// Seed de homologação — cadastra apenas a OM e a conta do próprio usuário
// que está validando o sistema, com os 4 perfis liberados para percorrer o
// fluxo completo sozinho enquanto não existem contas reais para cada papel.
//
// IMPORTANTE: `acessoTotalTeste: true` e a concessão simultânea de
// COMANDANTE + ADMIN a uma única pessoa são uma conveniência EXCLUSIVA de
// homologação. Antes de operar com processos reais, ver README —
// "Passagem para produção" — para revogar esse acesso amplo e cadastrar
// uma conta por titular de função.

import { PrismaClient } from "@prisma/client";
import { gerarHashSenha } from "../lib/auth/senha";

const prisma = new PrismaClient();

async function main() {
  const om = await prisma.organizacaoMilitar.upsert({
    where: { sigla: "BINFAE-RJ" },
    update: {},
    create: {
      sigla: "BINFAE-RJ",
      nome: "Batalhão de Infantaria da Aeronáutica Especial do Rio de Janeiro",
      cidade: "Rio de Janeiro",
      uf: "RJ",
    },
  });

  const saram = "6571590";
  const senhaHash = await gerarHashSenha(saram);

  const militar = await prisma.militar.upsert({
    where: { saram },
    update: {
      nome: "Renan Henrique Vaz Borges",
      postoGrad: "1T QOINF",
      secao: "Adjunto da SAP-01",
      omId: om.id,
    },
    create: {
      saram,
      nome: "Renan Henrique Vaz Borges",
      postoGrad: "1T QOINF",
      quadro: "",
      secao: "Adjunto da SAP-01",
      omId: om.id,
      // Comportamento não é presumido para uma pessoa real — deve ser
      // conferido e preenchido a partir do registro funcional oficial.
      comportamento: null,
    },
  });

  await prisma.conta.upsert({
    where: { militarId: militar.id },
    update: {},
    create: {
      militarId: militar.id,
      senhaHash,
      deveTrocarSenha: true,
      perfisFuncionais: ["COMANDANTE", "ADMIN"],
      acessoTotalTeste: true,
    },
  });

  console.log("Seed concluído:");
  console.log(`  OM: ${om.sigla} — ${om.nome}`);
  console.log(`  Militar: ${militar.postoGrad} ${militar.nome} (SARAM ${militar.saram})`);
  console.log("  Login: SARAM como usuário e senha inicial (troca obrigatória no primeiro acesso).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
