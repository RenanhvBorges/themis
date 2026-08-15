-- AlterTable
ALTER TABLE "decisoes" ADD COLUMN     "comportamentoResultante" "Comportamento",
ADD COLUMN     "concordaComRelatorio" BOOLEAN NOT NULL DEFAULT true;
