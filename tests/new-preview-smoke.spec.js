import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi, JAKARTA } from "./helpers/geo.js";

// Smoke test for the redesign preview served at /new/ (separate build entry,
// router basename="/new"). Proves the second app boots, renders kajian pins,
// and offers a way back to the classic UI at "/".
const KAJIAN = {
  id: "k1",
  lat: -6.2,
  lng: 106.8,
  city: "Jakarta",
  date: "2026-06-18",
  time_start: "09:00",
  time_end: "11:00",
  topic: "Kajian Tauhid",
  speaker: "Ustadz Fulan",
  loc_name: "Masjid Uji",
  addr: "Jl. Uji No. 1",
  contact: "-",
  notes: "",
  tags: "Aqidah",
  likes: 0,
  going: 0,
};

test.describe("Redesign preview at /new/", () => {
  test("boots the redesign app, renders a kajian pin, and links back to /", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: { latitude: JAKARTA.lat, longitude: JAKARTA.lng, accuracy: 50 } },
    });

    await page.goto("/new/");

    // It is the redesign entry, not the classic shell.
    await expect(page).toHaveTitle(/Tampilan Baru/);

    // The map renders the redesign divIcon pin for the mocked kajian.
    await expect(page.locator(".kajian-pin").first()).toBeVisible({ timeout: 15000 });

    // Way back to the classic UI exists (full-page link to "/").
    await expect(page.getByRole("button", { name: "Kembali ke tampilan lama" })).toBeVisible();
  });
});
