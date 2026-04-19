import { test, expect } from "@playwright/test";

test.describe("Pulse @ demo mode", () => {
  test("loads all core sections and renders news pods", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Pulse", { exact: false }).first()).toBeVisible();
    await expect(page.getByTestId("demo-banner")).toBeVisible();

    // Core section headers are present
    await expect(page.getByTestId("section-international")).toBeVisible();
    await expect(page.getByTestId("section-national")).toBeVisible();

    // International section should have pods rendered
    const intlPosts = page
      .getByTestId("section-international")
      .getByTestId("news-pod");
    await expect(intlPosts.first()).toBeVisible();
    expect(await intlPosts.count()).toBeGreaterThan(0);
  });

  test("expands collapsed summary", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    const toggle = section.getByTestId("summary-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(section.getByTestId("summary-content")).toBeVisible();
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
    // "Read full article" appears when a post has a URL - first demo post does
    await expect(page.getByTestId("read-full-article")).toBeVisible();

    // Closing works
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("Open on X opens a new tab to x.com", async ({ page, context }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    await section.getByTestId("news-pod").first().click();
    await expect(page.getByTestId("post-modal")).toBeVisible();

    const openOnX = page.getByTestId("open-on-x");
    const href = await openOnX.getAttribute("href");
    expect(href).toMatch(/^https:\/\/x\.com\//);
    expect(await openOnX.getAttribute("target")).toBe("_blank");
  });

  test("can add a new US state section and it appears in feed", async ({
    page,
    viewport,
  }) => {
    await page.goto("/");
    // On mobile the sidebar is off-canvas; tap the menu button to slide it in.
    if ((viewport?.width ?? 1280) < 768) {
      await page.getByTestId("toggle-sidebar").click();
    }
    await page.getByTestId("add-section").first().click();
    const dialog = page.getByTestId("add-state-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("state-filter").fill("texas");
    await page.getByTestId("add-state-texas").click();
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("section-state-texas")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("timeframe switcher updates feed (72h shows >= 24h)", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.getByTestId("section-international");
    const pods24 = await section.getByTestId("news-pod").count();
    await section.getByTestId("timeframe-international-72h").click();
    await expect
      .poll(async () =>
        section.getByTestId("news-pod").count(),
      )
      .toBeGreaterThanOrEqual(pods24);
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
