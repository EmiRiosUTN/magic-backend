-- CreateTable
CREATE TABLE "message_media" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_media_message_id_key" ON "message_media"("message_id");

-- AddForeignKey
ALTER TABLE "message_media" ADD CONSTRAINT "message_media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
