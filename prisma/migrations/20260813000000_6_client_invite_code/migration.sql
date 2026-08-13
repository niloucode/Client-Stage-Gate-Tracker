-- AlterTable
ALTER TABLE "Clients" ADD COLUMN "invite_code_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "Clients_invite_code_hash_key" ON "Clients"("invite_code_hash");
