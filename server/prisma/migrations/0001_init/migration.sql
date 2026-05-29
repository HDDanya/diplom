-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ComicStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TransitionStyle" AS ENUM ('NONE', 'SLIDE_LEFT', 'SLIDE_RIGHT', 'FADE', 'ZOOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "script" TEXT,
    "coverImageUrl" TEXT,
    "status" "ComicStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicPage" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sketchPrompt" TEXT,
    "transitionStyle" "TransitionStyle" NOT NULL DEFAULT 'SLIDE_LEFT',
    "position" INTEGER NOT NULL,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicChoice" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "targetPageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComicChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComicBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "currentPageId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_slug_key" ON "Comic"("slug");

-- CreateIndex
CREATE INDEX "ComicPage_comicId_position_idx" ON "ComicPage"("comicId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ComicPage_comicId_pageKey_key" ON "ComicPage"("comicId", "pageKey");

-- CreateIndex
CREATE INDEX "ComicChoice_pageId_idx" ON "ComicChoice"("pageId");

-- CreateIndex
CREATE INDEX "ComicChoice_targetPageId_idx" ON "ComicChoice"("targetPageId");

-- CreateIndex
CREATE UNIQUE INDEX "ComicBookmark_userId_comicId_key" ON "ComicBookmark"("userId", "comicId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadProgress_userId_comicId_key" ON "ReadProgress"("userId", "comicId");

-- AddForeignKey
ALTER TABLE "Comic" ADD CONSTRAINT "Comic_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicPage" ADD CONSTRAINT "ComicPage_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicChoice" ADD CONSTRAINT "ComicChoice_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicChoice" ADD CONSTRAINT "ComicChoice_targetPageId_fkey" FOREIGN KEY ("targetPageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicBookmark" ADD CONSTRAINT "ComicBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicBookmark" ADD CONSTRAINT "ComicBookmark_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadProgress" ADD CONSTRAINT "ReadProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadProgress" ADD CONSTRAINT "ReadProgress_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadProgress" ADD CONSTRAINT "ReadProgress_currentPageId_fkey" FOREIGN KEY ("currentPageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

