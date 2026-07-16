import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi, readGeoState } from "../helpers/geo.js";

// User far from the kajian, so we can prove the map centers on the kajian (not the user).
const USER = { latitude: -6.9, longitude: 107.6, accuracy: 50 }; // Bandung-ish
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

const deepLink = (k) =>
  `/new/?k=${k.id}&d=${k.date}&lat=${k.lat}&lng=${k.lng}`;

test.describe("Notification deep link", () => {
  test("opens the kajian flyer and centers the map on its location", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    // Geolocation resolves after the flyer is likely open: the old code's
    // location spinner shared the SweetAlert singleton and its dismiss() closed
    // the flyer ~100ms in. The flyer must survive that.
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 500 },
    });

    await page.goto(deepLink(KAJIAN));

    // Flyer (SweetAlert) opens with the kajian topic.
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Buka di Google Maps" })).toBeVisible();

    // It must STAY open past the geolocation fix (regression: it auto-closed).
    await page.waitForTimeout(1200);
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible();

    // Map centered on the kajian, not the (far-away) user.
    const geo = await readGeoState(page);
    expect(geo.centerLat).toBeCloseTo(KAJIAN.lat, 3);
    expect(geo.centerLng).toBeCloseTo(KAJIAN.lng, 3);

    // The deep-link query is stripped so a refresh won't reopen it.
    expect(new URL(page.url()).search).toBe("");
  });

  test("flyer survives a geolocation error (no spinner/error dialog clobbers it)", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "error", code: 1, message: "denied", delay: 500 },
    });

    await page.goto(deepLink(KAJIAN));
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible({ timeout: 8000 });

    await page.waitForTimeout(1200);
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible();
    // The geolocation error dialog must NOT appear over the flyer.
    await expect(page.getByText(/izinkan akses lokasi/i)).toHaveCount(0);
  });

  test("a late geolocation fix does not yank the map off the deep-linked kajian", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    // Geolocation resolves after data has loaded and the deep link is handled.
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 1500 },
    });

    await page.goto(deepLink(KAJIAN));
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible({ timeout: 8000 });

    // Wait past the geolocation delay, then confirm the center stayed on the kajian.
    await page.waitForTimeout(2000);
    const geo = await readGeoState(page);
    expect(geo.userLat).toBeCloseTo(USER.latitude, 3); // user marker still tracked
    expect(geo.centerLat).toBeCloseTo(KAJIAN.lat, 3); // but map stays on the kajian
    expect(geo.centerLng).toBeCloseTo(KAJIAN.lng, 3);
  });

  test("Lokasi Saya after closing the flyer recenters the map on the user", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
      watch: { type: "emit", emissions: [{ coords: USER, delay: 100 }] },
    });

    await page.goto(deepLink(KAJIAN));
    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toBeVisible({ timeout: 8000 });

    // Deep link pinned the map to the kajian.
    await expect.poll(async () => (await readGeoState(page)).centerLat).toBeCloseTo(KAJIAN.lat, 3);

    // Close the flyer, then explicitly ask for the user's own location.
    await page.getByRole("button", { name: "Tutup" }).click();
    await page.getByRole("button", { name: "Lokasi Saya" }).click();

    // The map must recenter on the USER — the deep-link lock is released
    // (regression: it stayed pinned to the kajian).
    await expect
      .poll(async () => (await readGeoState(page)).centerLat, { timeout: 5000 })
      .toBeCloseTo(USER.latitude, 3);
    const geo = await readGeoState(page);
    expect(geo.centerLng).toBeCloseTo(USER.longitude, 3);
  });

  test("no deep link → normal load, no flyer, map follows the user", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/new/");
    await page.locator(".leaflet-container").waitFor();
    await page.waitForTimeout(500);

    await expect(page.locator(".swal2-popup").getByText("Kajian Tauhid")).toHaveCount(0);
    const geo = await readGeoState(page);
    expect(geo.centerLat).toBeCloseTo(USER.latitude, 3);
  });
});
