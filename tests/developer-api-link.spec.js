import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi, JAKARTA } from "./helpers/geo.js";

// The schedules are an open API. Developers find the guide from the site,
// without it getting in the way of people who only want a kajian.
const API_GUIDE = "https://github.com/jadwal-kajian/kajiannow-ui/blob/master/docs/API.md";

test.beforeEach(async ({ page }) => {
  await mockApi(page, { schedule: [] });
  await installGeoMock(page, {
    getCurrentPosition: { type: "success", coords: { latitude: JAKARTA.lat, longitude: JAKARTA.lng, accuracy: 50 } },
  });
});

test("the classic footer points developers to the API guide", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: /API untuk developer/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", API_GUIDE);
  await expect(link).toHaveAttribute("target", "_blank");
});

test("the redesign's about page points developers to the API guide", async ({ page }) => {
  // The dev server only serves the redesign from /new/, so arrive the way a reader does.
  await page.goto("/new/");
  await page.getByRole("button", { name: "Tentang" }).click();
  const link = page.getByRole("link", { name: /Untuk developer: API terbuka/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", API_GUIDE);
});
