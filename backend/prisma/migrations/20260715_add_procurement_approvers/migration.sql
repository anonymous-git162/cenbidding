-- CreateTable
CREATE TABLE "procurement_approvers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "procurement_id" UUID NOT NULL,
    "approver_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_approvers_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data
INSERT INTO "procurement_approvers" ("procurement_id", "approver_id", "assigned_at")
SELECT p."id", p."assigned_approver_id", COALESCE(p."updated_at", NOW())
FROM "procurements" p
WHERE p."assigned_approver_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "procurement_approvers_procurement_id_approver_id_key" ON "procurement_approvers"("procurement_id", "approver_id");
CREATE INDEX "procurement_approvers_procurement_id_idx" ON "procurement_approvers"("procurement_id");
CREATE INDEX "procurement_approvers_approver_id_idx" ON "procurement_approvers"("approver_id");

-- AddForeignKey
ALTER TABLE "procurement_approvers" ADD CONSTRAINT "procurement_approvers_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_approvers" ADD CONSTRAINT "procurement_approvers_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
