import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi, JAKARTA } from "./helpers/geo.js";

// The classic home page fits one screen: the map takes the height left over,
// so the footer (contributors, open source, API link) is visible without
// scrolling on phones and desktops alike.
const SIZES = { "small phone": [360, 640], phone: [390, 844], laptop: [1366, 768], desktop: [1280, 1000] };

for (const [name, [width, height]] of Object.entries(SIZES)) {
  test(`home fits a ${name} screen (${width}x${height})`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await mockApi(page, { schedule: [] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: { latitude: JAKARTA.lat, longitude: JAKARTA.lng, accuracy: 50 } },
    });
    await page.goto("/");
    await expect(page.locator(".leaflet-container")).toBeVisible();

    const box = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight - innerHeight,
      footerBottom: document.querySelector("footer").getBoundingClientRect().bottom - innerHeight,
      map: document.querySelector(".leaflet-container").getBoundingClientRect().height,
    }));
    expect(box.scroll).toBeLessThanOrEqual(0);
    expect(box.footerBottom).toBeLessThanOrEqual(0);
    expect(box.map).toBeGreaterThanOrEqual(240);
  });
}
