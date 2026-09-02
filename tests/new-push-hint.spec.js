// /new/ pins its buttons to the top-right corner, so the hint opens leftwards
// rather than upwards, where the safe-area inset is.
import { test, expect } from "@playwright/test";

const hint = (page) => page.getByText("Dapatkan pemberitahuan kajian terdekat");
const bell = (page) => page.getByLabel("Pengaturan notifikasi kajian terdekat");

const clearStartupModal = async (page) => {
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await expect(page.locator(".swal2-container")).toHaveCount(0, { timeout: 10000 });
};

test("offered on /new/ to a visitor who is not subscribed", async ({ page }) => {
  await page.goto("/new/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });
});

test("opens to the left of the bell and stays on screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/new/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });

  const h = await hint(page).boundingBox();
  const b = await bell(page).boundingBox();

  // Left of the button, vertically aligned with it, and fully on screen.
  expect(h.x + h.width).toBeLessThanOrEqual(b.x + 1);
  expect(h.x).toBeGreaterThanOrEqual(0);
  const hMid = h.y + h.height / 2, bMid = b.y + b.height / 2;
  expect(Math.abs(hMid - bMid)).toBeLessThan(6);
});

test("the close button is actually clickable", async ({ page }) => {
  await page.goto("/new/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });
  // The map controls sit high in this layout; nothing may cover the hint.
  const reachable = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Tutup info notifikasi"]');
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el;
  });
  expect(reachable).toBe(true);
});

test("dismissal survives a reload", async ({ page }) => {
  await page.goto("/new/");
  await clearStartupModal(page);
  await expect(hint(page)).toBeVisible({ timeout: 15000 });
  await page.getByLabel("Tutup info notifikasi").click();
  await expect(hint(page)).toHaveCount(0);

  await page.reload();
  await clearStartupModal(page);
  await page.waitForTimeout(1500);
  await expect(hint(page)).toHaveCount(0);
});

test("no JSX comment text leaks into the page", async ({ page }) => {
  await page.goto("/new/");
  await clearStartupModal(page);
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("*/");
  expect(body).not.toContain("safe-area");
});
