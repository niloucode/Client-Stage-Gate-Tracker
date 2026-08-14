-- AlterTable: department invite codes (staff signup, per-department)
ALTER TABLE "Department" ADD COLUMN "invite_code_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "Department_invite_code_hash_key" ON "Department"("invite_code_hash");
