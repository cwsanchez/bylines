import { test, expect } from "@playwright/test";

test.describe("Pulse @ demo mode", () => {
  test("loads the first column and renders news pods", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Pulse", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("demo-banner")).toBeVisible();

    // Default layout is one column showing International
    await expect(page.getByTestId("section-international")).toBeVisible();
    const pods = page
      .getByTestId("section-international")
      .getByTestId("news-pod");
    await expect(pods.first()).toBeVisible();
    expect(await pods.count()).toBeGreaterThan(0);
  });

  test("expands the Grok briefing", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    const toggle = section.getByTestId("briefing-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(section.getByTestId("briefing-content")).toBeVisible();
    // Full paragraph visible and longer than a one-liner.
    const text = await section.getByTestId("briefing-content").innerText();
    expect(text.length).toBeGreaterThan(80);
  });

  test("opens pod modal with Read full article and Open on X", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    await section.getByTestId("news-pod").first().click();
    const modal = page.getByTestId("post-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("post-modal-text").first()).toBeVisible();
    await expect(page.getByTestId("open-on-x")).toBeVisible();
    await expect(page.getByTestId("read-full-article")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("Open on X opens a new tab to x.com", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    await section.getByTestId("news-pod").first().click();
    await expect(page.getByTestId("post-modal")).toBeVisible();

    const openOnX = page.getByTestId("open-on-x");
    const href = await openOnX.getAttribute("href");
    expect(href).toMatch(/^https:\/\/x\.com\//);
    expect(await openOnX.getAttribute("target")).toBe("_blank");
  });

  test("timeframe selector switches window (month >= 24h)", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    await expect(section.getByTestId("news-pod").first()).toBeVisible();
    const pods24 = await section.getByTestId("news-pod").count();

    await page.getByTestId("timeframe-select").selectOption("month");

    await expect
      .poll(async () => section.getByTestId("news-pod").count())
      .toBeGreaterThanOrEqual(pods24);
  });

  test("column count toggle adds columns and shows another category", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("section-international")).toBeVisible();

    // Switch to 2 columns - a second category should appear.
    await page.getByTestId("column-count-2").click();
    const columns = page
      .getByTestId("columns-grid")
      .locator("[data-testid^='section-']");
    await expect.poll(async () => columns.count()).toBeGreaterThanOrEqual(2);
  });

  test("column dropdown changes the category", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    await expect(section).toBeVisible();

    await section
      .getByTestId("section-select-international")
      .selectOption("science");
    await expect(page.getByTestId("section-science")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("Pulse @ mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test("mobile: pods render and modal is usable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("section-international")).toBeVisible();
    const pod = page
      .getByTestId("section-international")
      .getByTestId("news-pod")
      .first();
    await pod.click();
    await expect(page.getByTestId("post-modal")).toBeVisible();
  });
});
