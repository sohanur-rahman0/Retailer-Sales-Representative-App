-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token_exp" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT;
