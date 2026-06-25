import { expect, test } from "@playwright/test";
import { installAuthorSession } from "./auth-session";

test("catalog opens and responsive navigation remains usable", async ({ page }, testInfo) => {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: "Каталог историй" })).toBeVisible();
  await expect(page.getByPlaceholder("Найти комикс по названию или описанию")).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Каталог" })).toBeVisible();
  }
});

test("public pages explain the platform and creation workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /InkFlow/i })).toBeVisible();
  await expect(page.getByText("Один момент. Два продолжения.")).toBeVisible();

  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "От первой идеи до первого читателя" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Задайте основу/ })).toBeVisible();
  await page.getByRole("tab", { name: /Разделите диалоги/ }).click();
  await expect(page.getByText(/поставьте разделитель --- на отдельной строке/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Одна сцена, три панели" })).toBeVisible();

  await page.goto("/contacts");
  await expect(page.getByRole("heading", { name: "Есть идея, вопрос или сюжетный тупик?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить" })).toBeVisible();
});

test("authentication screen exposes the demo workflow", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "InkFlow Account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("Batman and The Boys contain four distinct endings", async ({ page }) => {
  for (const slug of ["batman", "the-boys-vought-files"]) {
    await page.goto(`/comics/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: /^17\. Страница 17: Финал:/ })).toBeVisible();
    await expect(
      page.locator("p").filter({ hasText: /^\d+\. Страница (14|15|16|17): Финал:/ })
    ).toHaveCount(4);
  }
});

test("reader shows all four final choices at the same time", async ({ page }) => {
  for (const slug of ["batman", "the-boys-vought-files"]) {
    await page.goto(`/read/${slug}`);
    await page.getByRole("button", { name: "Пойти по неофициальному сигналу" }).click();
    await page.getByRole("button", { name: "Проверить опасную альтернативу" }).click();
    await page.getByRole("button", { name: "Использовать систему против врага" }).click();
    await page.getByRole("button", { name: "Начать финальный штурм" }).click();

    await expect(page.getByText("Выберите один из четырёх исходов")).toBeVisible();
    await expect(page.getByText("4 варианта", { exact: true })).toBeVisible();
    await expect(page.getByTestId("reader-choices").getByRole("button")).toHaveCount(4);

    const panelImages = await page.locator(".comic-panel-image").evaluateAll((panels) =>
      panels.map((panel) => getComputedStyle(panel).backgroundImage)
    );
    expect(new Set(panelImages).size).toBe(panelImages.length);
    expect(panelImages.every((image) => image.includes(`/uploads/seed/comics/${slug === "batman" ? "batman" : "the-boys"}/`))).toBe(
      true
    );
  }
});

test("editor refreshes an expired access token and waits for long image generation", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await installAuthorSession(page);
  await page.goto("/editor/planet-comics-signal");
  await expect(page.getByText("Подключено: gpt-image-1")).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    const rawSession = localStorage.getItem("inkflow-auth");
    if (!rawSession) {
      throw new Error("Auth session was not stored");
    }
    const session = JSON.parse(rawSession);
    session.accessToken = "expired-access-token";
    localStorage.setItem("inkflow-auth", JSON.stringify(session));
  });

  await page.route(/\/api\/uploads\/generate(?:\?.*)?$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 11_000));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "/uploads/seed/public-domain/pages/planet-37-page-12.jpg",
        filename: "planet-37-page-12.jpg",
        mimetype: "image/jpeg",
        images: [
          {
            url: "/uploads/seed/public-domain/pages/planet-37-page-12.jpg",
            filename: "planet-37-page-12.jpg",
            mimetype: "image/jpeg"
          }
        ]
      })
    });
  });

  const editorImages = page.locator(".editor-page-card img");
  expect(await editorImages.count()).toBeLessThan(30);
  await expect(editorImages.first()).toHaveAttribute("loading", "lazy");
  expect(await editorImages.evaluateAll((images) => images.every((image) => image.getAttribute("decoding") === "async"))).toBe(true);
  await expect(page.getByAltText("Planet Comics #1")).toHaveCount(0);
  await page.getByRole("button", { name: "Показать шаблоны (8)" }).first().click();
  await expect(page.getByAltText("Planet Comics #1").first()).toHaveAttribute("loading", "lazy");
  await page.getByRole("button", { name: "Сгенерировать сцену" }).first().click();
  await expect(page.getByText(/Получено вариантов: 1/)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".editor-scene-preview img").first()).toHaveAttribute(
    "src",
    /planet-37-page-12\.jpg$/
  );

  expect(consoleErrors.filter((message) => /same key|unhandled|timeout of 10000/i.test(message))).toEqual([]);
});
