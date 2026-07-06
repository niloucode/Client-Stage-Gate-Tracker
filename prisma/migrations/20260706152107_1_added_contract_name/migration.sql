/*
  Warnings:

  - A unique constraint covering the columns `[contract_name]` on the table `Contracts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Contracts" ADD COLUMN     "contract_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contracts_contract_name_key" ON "Contracts"("contract_name");
