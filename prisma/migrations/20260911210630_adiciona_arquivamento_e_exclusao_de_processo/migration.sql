-- AlterTable
ALTER TABLE "processos" ADD COLUMN     "arquivadoEm" TIMESTAMP(3),
ADD COLUMN     "arquivadoPorId" TEXT,
ADD COLUMN     "excluidoEm" TIMESTAMP(3),
ADD COLUMN     "excluidoPorId" TEXT,
ADD COLUMN     "justificativaArquivamento" TEXT,
ADD COLUMN     "motivoExclusao" TEXT;

-- CreateIndex
CREATE INDEX "processos_excluidoEm_idx" ON "processos"("excluidoEm");

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_arquivadoPorId_fkey" FOREIGN KEY ("arquivadoPorId") REFERENCES "militares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "militares"("id") ON DELETE SET NULL ON UPDATE CASCADE;
