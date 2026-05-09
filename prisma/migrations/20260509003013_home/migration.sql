-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "avaterPublicId" TEXT;

-- CreateTable
CREATE TABLE "eulas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eulas_pkey" PRIMARY KEY ("id")
);
