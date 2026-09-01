// Someone who has never enabled notifications has no way of knowing the
// feature exists: the bell looks like every other icon in the row.
import { test, expect } from "@playwright/test";

const hint = (page) => page.getByText("Dapatkan pemberitahuan kajian terdekat");
const bell = (page) => page.getByLabel("Pengaturan notifikasi kajian terdekat");

/**
 * Dismiss whatever dialog the app opens on load.
 *
 * Without geolocation the location popup comes up, and its backdrop covers the
 * page. The hint deliberately waits for that to close, so a test that never
 * closes it is testing the waiting rather than the hint.
 */
const clearStartupModal = async (page) => {
  // Its close button is hidden, so Escape is the way out -- the same one a
  // visitor has.
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await expect(page.locator(".swal2-container")).toHaveCount(0, { timeout: 10000 });
};

test("offered to a visitor who is not subscribed", async ({ page }) => {
  await page.goto("/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });
});

test("waits for a dialog to close rather than appearing behind it", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector(".swal2-container", { timeout: 15000 });
  // Sweetalert's backdrop sits at z-index 1060 over everything.
  await expect(hint(page)).toHaveCount(0);

  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });
});

test("sits above the bell, on screen, and is actually clickable", async ({ page }) => {
  await page.goto("/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });

  const h = await hint(page).boundingBox();
  const b = await bell(page).boundingBox();
  const width = page.viewportSize().width;

  expect(h.y + h.height).toBeLessThanOrEqual(b.y + 1);   // above, not overlapping
  expect(h.x).toBeGreaterThanOrEqual(0);                  // and on screen
  expect(h.x + h.width).toBeLessThanOrEqual(width);

  // The button clips its own overflow, so a bubble rendered inside it would be
  // cut in half; and nothing may sit on top of it.
  const reachable = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Tutup info notifikasi"]');
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
  });
  expect(reachable).toBe(true);
});

test("dismissing it is remembered across reloads", async ({ page }) => {
  await page.goto("/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });

  await page.getByLabel("Tutup info notifikasi").click();
  await expect(hint(page)).toHaveCount(0);

  // Home wipes localStorage on mount and restores a keep-list; a dismissal not
  // on that list comes back on the next visit and nags forever.
  await page.reload();
  await clearStartupModal(page);
  await page.waitForTimeout(1500);
  await expect(hint(page)).toHaveCount(0);
});

test("not shown once the visitor is already subscribed", async ({ page }) => {
  await page.addInitScript(() => {
    const orig = navigator.serviceWorker.getRegistration.bind(navigator.serviceWorker);
    navigator.serviceWorker.getRegistration = async () => {
      const reg = await orig();
      if (!reg) return reg;
      reg.pushManager.getSubscription = async () => ({ options: {} });
      return reg;
    };
  });
  await page.goto("/");
  await clearStartupModal(page);
  await page.waitForTimeout(2000);
  await expect(hint(page)).toHaveCount(0);
});

test("no JSX comment text leaks into the page", async ({ page }) => {
  // A mis-closed {/* ... */} renders its tail as visible text instead of
  // vanishing, and nothing else here would notice.
  await page.goto("/");
  await clearStartupModal(page);
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("*/");
  expect(body).not.toContain("z-index");
});
