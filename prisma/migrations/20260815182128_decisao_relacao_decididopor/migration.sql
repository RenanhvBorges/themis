-- AddForeignKey
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "militares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
