-- CreateEnum
CREATE TYPE "Comportamento" AS ENUM ('EXCEPCIONAL', 'OTIMO', 'BOM', 'INSUFICIENTE', 'MAU');

-- CreateEnum
CREATE TYPE "PerfilFuncional" AS ENUM ('COMANDANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusProcesso" AS ENUM ('PARA_ABERTURA', 'A_CIENTIFICAR', 'AGUARDANDO_DEFESA', 'EM_APURACAO', 'AGUARDANDO_DESPACHO', 'AGUARDANDO_DECISAO', 'CIENCIA_DA_DECISAO', 'RECONSIDERACAO_EM_ANALISE', 'CIENCIA_NOVA_DECISAO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "OrigemTipo" AS ENUM ('OFICIO', 'MEMORANDO', 'PARTE_DISCIPLINAR', 'RELATO_REDUZIDO_A_TERMO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Classificacao" AS ENUM ('LEVE', 'MEDIA', 'GRAVE');

-- CreateEnum
CREATE TYPE "TipoPunicao" AS ENUM ('ADVERTENCIA', 'REPREENSAO', 'DETENCAO', 'PRISAO', 'PRISAO_EM_SEPARADO');

-- CreateEnum
CREATE TYPE "TipoDecisao" AS ENUM ('PUNICAO', 'ARQUIVAMENTO');

-- CreateEnum
CREATE TYPE "ConclusaoRelatorio" AS ENUM ('PROCEDENTE', 'IMPROCEDENTE');

-- CreateEnum
CREATE TYPE "DesfechoReconsideracao" AS ENUM ('DEFERIDO', 'PARCIALMENTE_DEFERIDO', 'INDEFERIDO');

-- CreateEnum
CREATE TYPE "TipoInquiricao" AS ENUM ('ARROLADO', 'TESTEMUNHA');

-- CreateEnum
CREATE TYPE "AnexoTipo" AS ENUM ('ORIGEM', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'M', 'Q');

-- CreateEnum
CREATE TYPE "PrazoTipo" AS ENUM ('DEFESA', 'RELATORIO', 'DECISAO', 'RECONSIDERACAO');

-- CreateEnum
CREATE TYPE "ContagemPrazo" AS ENUM ('UTEIS', 'CORRIDOS');

-- CreateEnum
CREATE TYPE "StatusPrazo" AS ENUM ('EM_CURSO', 'PRORROGADO', 'CUMPRIDO');

-- CreateTable
CREATE TABLE "organizacoes_militares" (
    "id" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizacoes_militares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "militares" (
    "id" TEXT NOT NULL,
    "saram" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "postoGrad" TEXT NOT NULL,
    "quadro" TEXT NOT NULL DEFAULT '',
    "secao" TEXT NOT NULL,
    "comportamento" "Comportamento",
    "omId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "militares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas" (
    "id" TEXT NOT NULL,
    "militarId" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "deveTrocarSenha" BOOLEAN NOT NULL DEFAULT true,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "perfisFuncionais" "PerfilFuncional"[] DEFAULT ARRAY[]::"PerfilFuncional"[],
    "acessoTotalTeste" BOOLEAN NOT NULL DEFAULT false,
    "ultimoLoginEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_acesso" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "sucesso" BOOLEAN NOT NULL,
    "motivoFalha" TEXT,

    CONSTRAINT "logs_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "omId" TEXT NOT NULL,
    "status" "StatusProcesso" NOT NULL DEFAULT 'PARA_ABERTURA',
    "arroladoId" TEXT NOT NULL,
    "apuradorId" TEXT,
    "comandanteId" TEXT NOT NULL,
    "abertoPorId" TEXT NOT NULL,
    "origemTipo" "OrigemTipo" NOT NULL,
    "origemNumero" TEXT NOT NULL,
    "origemData" DATE NOT NULL,
    "relatoFato" TEXT NOT NULL,
    "itensArt10" TEXT[],
    "autuadoEm" DATE,
    "cienciaEm" DATE,
    "recebidoApuradorEm" DATE,
    "recebidoComandanteEm" DATE,
    "cienciaDecisaoEm" DATE,
    "cienciaNovaDecisaoEm" DATE,
    "finalizadoEm" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defesas" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "apresentada" BOOLEAN NOT NULL DEFAULT false,
    "preclusa" BOOLEAN NOT NULL DEFAULT false,
    "texto" TEXT,
    "apresentadaEm" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relatorios_apuracao" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "conclusao" "ConclusaoRelatorio" NOT NULL,
    "classificacao" "Classificacao",
    "itensConfirmados" TEXT[],
    "recomendacaoPunicao" "TipoPunicao",
    "recomendacaoDias" INTEGER,
    "atenuantes" TEXT[],
    "agravantes" TEXT[],
    "fundamentacao" TEXT NOT NULL,
    "emitidoEm" DATE NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relatorios_apuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "TipoDecisao" NOT NULL,
    "classificacao" "Classificacao",
    "punicao" "TipoPunicao",
    "dias" INTEGER,
    "atenuantes" TEXT[],
    "agravantes" TEXT[],
    "fundamentacao" TEXT NOT NULL,
    "decididoPorId" TEXT NOT NULL,
    "decididoEm" DATE NOT NULL,
    "ehJulgamentoReconsideracao" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_reconsideracao" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "razoes" TEXT NOT NULL,
    "pedidoEm" DATE NOT NULL,
    "desfecho" "DesfechoReconsideracao",
    "fundamentacao" TEXT,
    "decididoEm" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_reconsideracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiricoes" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "TipoInquiricao" NOT NULL,
    "nomeInquirido" TEXT NOT NULL,
    "postoInquirido" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "anexo" "AnexoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "dados" JSONB NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "signatarioId" TEXT NOT NULL,
    "papel" TEXT NOT NULL,
    "assinadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hash" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "autorPerfil" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhe" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prazos" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "tipo" "PrazoTipo" NOT NULL,
    "inicioEm" DATE NOT NULL,
    "venceEm" DATE NOT NULL,
    "contagem" "ContagemPrazo" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "status" "StatusPrazo" NOT NULL DEFAULT 'EM_CURSO',
    "prorrogadoAte" DATE,
    "cumpridoEm" DATE,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prazos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos_apoio" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "enviadoPorId" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_apoio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizacoes_militares_sigla_key" ON "organizacoes_militares"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "militares_saram_key" ON "militares"("saram");

-- CreateIndex
CREATE INDEX "militares_omId_idx" ON "militares"("omId");

-- CreateIndex
CREATE UNIQUE INDEX "contas_militarId_key" ON "contas"("militarId");

-- CreateIndex
CREATE INDEX "logs_acesso_contaId_idx" ON "logs_acesso"("contaId");

-- CreateIndex
CREATE UNIQUE INDEX "processos_numero_key" ON "processos"("numero");

-- CreateIndex
CREATE INDEX "processos_omId_idx" ON "processos"("omId");

-- CreateIndex
CREATE INDEX "processos_arroladoId_idx" ON "processos"("arroladoId");

-- CreateIndex
CREATE INDEX "processos_apuradorId_idx" ON "processos"("apuradorId");

-- CreateIndex
CREATE INDEX "processos_status_idx" ON "processos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "defesas_processoId_key" ON "defesas"("processoId");

-- CreateIndex
CREATE UNIQUE INDEX "relatorios_apuracao_processoId_key" ON "relatorios_apuracao"("processoId");

-- CreateIndex
CREATE UNIQUE INDEX "decisoes_processoId_key" ON "decisoes"("processoId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_reconsideracao_processoId_key" ON "pedidos_reconsideracao"("processoId");

-- CreateIndex
CREATE INDEX "inquiricoes_processoId_idx" ON "inquiricoes"("processoId");

-- CreateIndex
CREATE INDEX "documentos_processoId_idx" ON "documentos"("processoId");

-- CreateIndex
CREATE INDEX "assinaturas_documentoId_idx" ON "assinaturas"("documentoId");

-- CreateIndex
CREATE INDEX "eventos_processoId_idx" ON "eventos"("processoId");

-- CreateIndex
CREATE INDEX "prazos_processoId_idx" ON "prazos"("processoId");

-- CreateIndex
CREATE INDEX "anexos_apoio_processoId_idx" ON "anexos_apoio"("processoId");

-- AddForeignKey
ALTER TABLE "militares" ADD CONSTRAINT "militares_omId_fkey" FOREIGN KEY ("omId") REFERENCES "organizacoes_militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas" ADD CONSTRAINT "contas_militarId_fkey" FOREIGN KEY ("militarId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_acesso" ADD CONSTRAINT "logs_acesso_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "contas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_omId_fkey" FOREIGN KEY ("omId") REFERENCES "organizacoes_militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_arroladoId_fkey" FOREIGN KEY ("arroladoId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_apuradorId_fkey" FOREIGN KEY ("apuradorId") REFERENCES "militares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_comandanteId_fkey" FOREIGN KEY ("comandanteId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_abertoPorId_fkey" FOREIGN KEY ("abertoPorId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defesas" ADD CONSTRAINT "defesas_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorios_apuracao" ADD CONSTRAINT "relatorios_apuracao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_reconsideracao" ADD CONSTRAINT "pedidos_reconsideracao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiricoes" ADD CONSTRAINT "inquiricoes_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiricoes" ADD CONSTRAINT "inquiricoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_signatarioId_fkey" FOREIGN KEY ("signatarioId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prazos" ADD CONSTRAINT "prazos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos_apoio" ADD CONSTRAINT "anexos_apoio_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos_apoio" ADD CONSTRAINT "anexos_apoio_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
