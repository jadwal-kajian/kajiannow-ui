// /new/ is a live second app served by nginx, not dead code. Its notification
// settings must not keep offering "Latar belakang" as an optional extra after
// the classic UI stopped: push is the delivery, not a second feature.
import { test, expect } from "@playwright/test";

const openSettings = async (page) => {
  await page.goto("/new/");
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await expect(page.locator(".swal2-container")).toHaveCount(0, { timeout: 10000 });
  await page.getByLabel("Pengaturan notifikasi kajian terdekat").click();
  await page.waitForSelector(".swal2-container", { timeout: 10000 });
};

test("/new/ offers one notification switch, like the classic UI", async ({ page }) => {
  await openSettings(page);
  await expect(page.getByText("Tetap diberi tahu walau situs ditutup")).toBeVisible();
  await expect(page.getByText("Saat situs terbuka")).toHaveCount(0);
  await expect(page.getByText("Latar belakang", { exact: true })).toHaveCount(0);
  expect(await page.locator(".swal2-container [role='switch']").count()).toBe(1);
});
