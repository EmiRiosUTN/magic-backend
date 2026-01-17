-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN     "embedding_text" TEXT;
