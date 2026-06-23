CREATE TABLE "ComicReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComicReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComicReview_userId_comicId_key" ON "ComicReview"("userId", "comicId");
CREATE INDEX "ComicReview_comicId_idx" ON "ComicReview"("comicId");

ALTER TABLE "ComicReview" ADD CONSTRAINT "ComicReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComicReview" ADD CONSTRAINT "ComicReview_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
