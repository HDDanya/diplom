import { describe, expect, it } from "vitest";
import { buildChoices, buildPages, CHOICES, COMICS } from "./seed";

describe("defense demo seed", () => {
  it("contains 12 comics with 17 pages and four reachable endings each", () => {
    expect(COMICS).toHaveLength(12);

    const branchingPages = Object.values(CHOICES).filter((choices) => choices.length > 1).length;
    expect(branchingPages).toBeGreaterThanOrEqual(4);
    expect(CHOICES.p13).toHaveLength(4);

    for (const comic of COMICS) {
      const pages = buildPages(comic);
      const choices = buildChoices(comic);
      const endingKeys = pages
        .filter((page) => !choices[page.pageKey])
        .map((page) => page.pageKey);

      expect(pages).toHaveLength(17);
      expect(endingKeys).toEqual(["p14", "p15", "p16", "p17"]);
      expect(pages.filter((page) => page.isStart)).toHaveLength(1);
      expect(pages.every((page) => page.imageUrl && page.panelImageUrls.length >= 4)).toBe(true);
      expect(pages.every((page) => new Set(page.panelImageUrls).size === 4)).toBe(true);
      expect(new Set(pages.map((page) => page.imageUrl))).toHaveProperty("size", 17);
      expect(pages.every((page) => !page.imageUrl.endsWith(".svg"))).toBe(true);
      expect(choices.p13).toHaveLength(4);
    }
  });

  it("uses a separate non-repeating 17-image set for every comic", () => {
    const allPageImages = COMICS.flatMap((comic) => buildPages(comic).map((page) => page.imageUrl));

    expect(new Set(COMICS.map((comic) => comic.assetDirectory))).toHaveProperty("size", COMICS.length);
    expect(new Set(allPageImages)).toHaveProperty("size", COMICS.length * 17);
  });

  it("keeps every transition target inside the 17-page graph", () => {
    const pageKeys = new Set(buildPages(COMICS[0]).map((page) => page.pageKey));

    for (const [pageKey, choices] of Object.entries(CHOICES)) {
      expect(pageKeys.has(pageKey)).toBe(true);
      for (const choice of choices) {
        expect(pageKeys.has(choice.target)).toBe(true);
      }
    }
  });

  it("contains completed Batman and The Boys fan stories", () => {
    const batman = COMICS.find((comic) => comic.slug === "batman");
    const theBoys = COMICS.find((comic) => comic.slug === "the-boys-vought-files");

    expect(batman?.pageBodies).toHaveLength(17);
    expect(theBoys?.pageBodies).toHaveLength(17);
    expect(batman?.script).toContain("4");
    expect(theBoys?.script).toContain("4");
    expect(batman && buildChoices(batman).p13[0].label).toContain("Оракулу");
    expect(theBoys && buildChoices(theBoys).p13[0].label).toContain("редакциям");
  });
});
