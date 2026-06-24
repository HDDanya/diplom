import { expect, test } from "@playwright/test";

test("catalog opens and responsive navigation remains usable", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Интерактивные комиксы" })).toBeVisible();
  await expect(page.getByPlaceholder("Найти комикс по названию или описанию")).toBeVisible();

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.getByRole("link", { name: "Каталог" })).toBeVisible();
  }
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

  await page.goto("/auth");
  await page.getByLabel("Email").fill("author@inkflow.app");
  await page.getByLabel("Пароль").fill("password123");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.evaluate(() => {
    const rawSession = localStorage.getItem("inkflow-auth");
    if (!rawSession) {
      throw new Error("Auth session was not stored");
    }
    const session = JSON.parse(rawSession);
    session.accessToken = "expired-access-token";
    localStorage.setItem("inkflow-auth", JSON.stringify(session));
  });

  await page.route("**/api/uploads/generate", async (route) => {
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

  await page.goto("/editor/planet-comics-signal");
  await expect(page.getByText("Подключено: gpt-image-1")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Сгенерировать сцену" }).first().click();
  await expect(page.getByText(/Получено вариантов: 1/)).toBeVisible({ timeout: 20_000 });

  expect(consoleErrors.filter((message) => /same key|unhandled|timeout of 10000/i.test(message))).toEqual([]);
});
