import { expect, test } from "@playwright/test";
import { installAuthorSession } from "./auth-session";

test("@performance editor defers offscreen images on initial load", async ({ page }, testInfo) => {
  await installAuthorSession(page);

  let imageRequests = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "image") {
      imageRequests += 1;
    }
  });

  const startedAt = Date.now();
  await page.goto("/editor/planet-comics-signal", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Подключено: gpt-image-1")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>(".editor-page-card img"));
    return {
      pageCards: document.querySelectorAll(".editor-page-card").length,
      mountedPageBodies: document.querySelectorAll(".editor-page-card-body").length,
      mountedPageInputs: document.querySelectorAll(".editor-page-card-body input, .editor-page-card-body textarea").length,
      editorImages: images.length,
      lazyImages: images.filter((image) => image.loading === "lazy").length,
      asyncImages: images.filter((image) => image.decoding === "async").length,
      completedImages: images.filter((image) => image.complete && image.naturalWidth > 0).length,
      mountedPresetImages: document.querySelectorAll(".editor-page-card .mantine-Image-root").length,
      scrollHeight: document.documentElement.scrollHeight
    };
  });

  const styleInput = page.getByLabel("Визуальный стиль");
  await styleInput.fill("");
  const typingStartedAt = Date.now();
  await styleInput.pressSequentially("cinematic graphic novel with detailed ink and restrained color palette");
  const typingDurationMs = Date.now() - typingStartedAt;

  const pageKeyInput = page.getByLabel("Ключ страницы").first();
  await pageKeyInput.fill("scene_latency_check");
  await page.waitForTimeout(350);
  await expect(pageKeyInput).toBeFocused();
  await pageKeyInput.press("Backspace");
  await page.waitForTimeout(350);
  await expect(pageKeyInput).toBeFocused();

  const result = {
    ...metrics,
    imageRequestsBeforeScroll: imageRequests,
    elapsedUntilReadyMs: Date.now() - startedAt,
    typingDurationMs
  };

  console.log("Editor performance:", JSON.stringify(result));
  await testInfo.attach("editor-performance.json", {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json"
  });

  expect(metrics.pageCards).toBeGreaterThan(0);
  expect(metrics.mountedPageBodies).toBe(1);
  expect(metrics.mountedPageInputs).toBeLessThan(20);
  expect(metrics.editorImages).toBeLessThan(30);
  expect(metrics.lazyImages).toBe(metrics.editorImages);
  expect(metrics.asyncImages).toBe(metrics.editorImages);
  expect(metrics.mountedPresetImages).toBe(0);
  expect(imageRequests).toBeLessThanOrEqual(3);
  expect(typingDurationMs).toBeLessThan(2_500);
});
