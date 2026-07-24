/*
  Warnings:

  - You are about to drop the column `plan` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `razorpaySubscriptionId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionRenewsAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "plan",
DROP COLUMN "razorpaySubscriptionId",
DROP COLUMN "subscriptionRenewsAt",
DROP COLUMN "subscriptionStatus";
