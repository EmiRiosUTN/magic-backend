-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "reminder_days_before" INTEGER,
ADD COLUMN     "reminder_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "cards_due_date_reminder_enabled_reminder_sent_idx" ON "cards"("due_date", "reminder_enabled", "reminder_sent");
