/*
  Warnings:

  - Added the required column `imageKey` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Analysis` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "error" TEXT,
ADD COLUMN     "imageKey" TEXT NOT NULL,
ADD COLUMN     "kind" TEXT NOT NULL,
ADD COLUMN     "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "resultJson" DROP NOT NULL;
