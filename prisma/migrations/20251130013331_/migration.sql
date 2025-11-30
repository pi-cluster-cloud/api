/*
  Warnings:

  - You are about to drop the column `filename` on the `files` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "files" DROP COLUMN "filename",
ADD COLUMN     "fileName" VARCHAR(255) NOT NULL;
