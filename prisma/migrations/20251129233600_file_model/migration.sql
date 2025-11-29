-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL,
    "size" BIGINT NOT NULL,
    "path" VARCHAR(512) NOT NULL,
    "user" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_user_idx" ON "files"("user");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
