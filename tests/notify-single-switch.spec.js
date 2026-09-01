// Push is how a notification is delivered, not a second thing to opt into: the
// service worker fires whether or not the page is open. Offering it as its own
// toggle implied you could be notified only while looking at the site.
import { test, expect } from "@playwright/test";

const openSettings = async (page) => {
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await expect(page.locator(".swal2-container")).toHaveCount(0, { timeout: 10000 });
  await page.getByLabel("Pengaturan notifikasi kajian terdekat").click();
  await page.waitForSelector(".swal2-container", { timeout: 10000 });
};

test("offers one notification switch, not two", async ({ page }) => {
  await page.goto("/");
  await openSettings(page);

  await expect(page.getByText("Notifikasi kajian terdekat").last()).toBeVisible();
  // The old split is gone.
  await expect(page.getByText("Saat situs terbuka")).toHaveCount(0);
  await expect(page.getByText("Latar belakang", { exact: true })).toHaveCount(0);
});

test("says it keeps working while the site is closed", async ({ page }) => {
  await page.goto("/");
  await openSettings(page);
  await expect(page.getByText("Tetap diberi tahu walau situs ditutup")).toBeVisible();
});

test("only one toggle governs notifications", async ({ page }) => {
  await page.goto("/");
  await openSettings(page);
  // Radius and lead time are steppers, not toggles. Counting role=switch only:
  // sweetalert ships its own hidden checkbox, which is not ours to count.
  const toggles = page.locator(".swal2-container [role='switch']");
  expect(await toggles.count()).toBe(1);
});
