/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OTP_createdAt_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarUrl",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "ecos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" TEXT NOT NULL,

    CONSTRAINT "ecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "fideId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "sex" TEXT,
    "title" TEXT,

    CONSTRAINT "players_pkey" PRIMARY KEY ("fideId")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "eventId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "place" TEXT,
    "federation" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "type" TEXT,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournamentId" INTEGER NOT NULL,
    "datePlayed" TIMESTAMP(3),
    "round" DOUBLE PRECISION,
    "whiteId" INTEGER NOT NULL,
    "blackId" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "whiteElo" DOUBLE PRECISION,
    "blackElo" DOUBLE PRECISION,
    "ecoCode" TEXT NOT NULL,
    "plyCount" DOUBLE PRECISION,
    "termination" TEXT,
    "endgame" TEXT,
    "endgameCount" DOUBLE PRECISION,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_whiteId_fkey" FOREIGN KEY ("whiteId") REFERENCES "players"("fideId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_blackId_fkey" FOREIGN KEY ("blackId") REFERENCES "players"("fideId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_ecoCode_fkey" FOREIGN KEY ("ecoCode") REFERENCES "ecos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
