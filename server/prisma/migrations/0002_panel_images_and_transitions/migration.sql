-- Add enum variants for richer scene transitions
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'PAGE_FLIP';
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'VERTICAL_REVEAL';
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'GLITCH_CUT';
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'WHIP_PAN';
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'INK_BLEED';
ALTER TYPE "TransitionStyle" ADD VALUE IF NOT EXISTS 'PARALLAX_SWEEP';

-- Add per-panel image storage (aligned with dialog separators '---')
ALTER TABLE "ComicPage"
ADD COLUMN IF NOT EXISTS "panelImageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
