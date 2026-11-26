import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi } from "./helpers/geo.js";

// gmaps_url comes from community posts read by a program. A javascript: value
// passed to window.open ran as this site, so the maps button may only open an
// https Google Maps link, and anything else falls back to the coordinates.
const record = (gmaps_url) => ({
  id: "m1",
  lat: -6.2,
  lng: 106.8,
  city: "Jakarta",
  date: "2026-06-18",
  time_start: "09:00",
  time_end: "11:00",
  topic: "Kajian Peta",
  speaker: "Ustadz Fulan",
  loc_name: "Masjid Uji",
  addr: "Jl. Uji No. 1",
  contact: "-",
  notes: "",
  tags: "Aqidah",
  likes: 0,
  going: 0,
  gmaps_url,
});

const UIS = [
  { name: "classic", base: "", button: /^Buka di Maps$/ },
  { name: "redesign", base: "/new", button: /^Buka di Google Maps$/ },
];

const openFlyerAndTap = async (page, ui, k) => {
  await mockApi(page, { schedule: [k] });
  await installGeoMock(page, { getCurrentPosition: { type: "error", code: 1, message: "denied", delay: 100 } });
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (url, target, features) => {
      window.__opened.push({ url: String(url), features: String(features || "") });
      return null;
    };
  });
  await page.goto(`${ui.base}/?k=${k.id}&d=${k.date}&lat=${k.lat}&lng=${k.lng}`);
  await expect(page.locator(".swal2-popup").getByText("Kajian Peta").first()).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: ui.button }).first().click();
  return page.evaluate(() => window.__opened);
};

for (const ui of UIS) {
  test.describe(`maps button (${ui.name})`, () => {
    for (const bad of ["javascript:window.__kn_x=1", " JaVaScRiPt:window.__kn_x=1", "https://evil.example/maps", "http://www.google.com/maps?q=1"]) {
      test(`a maps link of ${JSON.stringify(bad)} is not opened; the coordinates are`, async ({ page }) => {
        const opened = await openFlyerAndTap(page, ui, record(bad));
        expect(opened).toEqual([
          { url: "https://www.google.com/maps?q=-6.2,106.8", features: "noopener,noreferrer" },
        ]);
      });
    }

    test("an https Google Maps link is opened as given, without a handle back to the site", async ({ page }) => {
      const opened = await openFlyerAndTap(page, ui, record("https://maps.app.goo.gl/abc123"));
      expect(opened).toEqual([{ url: "https://maps.app.goo.gl/abc123", features: "noopener,noreferrer" }]);
    });
  });
}
