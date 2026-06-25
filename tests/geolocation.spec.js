import { test, expect } from "@playwright/test";
import {
  installGeoMock,
  mockApi,
  readGeoState,
  geoCalls,
  UA_INAPP_THREADS,
  JAKARTA,
  COARSE,
  FINE,
  NETWORK_FIX,
} from "./helpers/geo.js";

const loadingPopup = (page) => page.getByText("Mencari Lokasi", { exact: true });
const errorPopup = (page) => page.getByText("Gagal mendapatkan lokasi");
const lokasiSayaBtn = (page) => page.getByRole("button", { name: "Lokasi Saya" });
const mapContainer = (page) => page.locator(".leaflet-container");

// approximate float compare
const near = (actual, expected, eps = 1e-4) =>
  expect(Math.abs(actual - expected)).toBeLessThan(eps);

test.describe("Geolocation — normal browser (Chrome)", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("initial load: low-accuracy fix centers the map on the user (no high-accuracy GPS)", async ({ page }) => {
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: NETWORK_FIX, delay: 50 },
    });
    await page.goto("/");

    await expect(mapContainer(page)).toBeVisible();
    await expect(errorPopup(page)).toHaveCount(0);

    await expect
      .poll(async () => (await readGeoState(page)).userLat)
      .not.toBeNull();
    const state = await readGeoState(page);
    near(state.userLat, NETWORK_FIX.latitude);
    near(state.userLng, NETWORK_FIX.longitude);
    near(state.centerLat, NETWORK_FIX.latitude);
    expect(state.locating).toBe(false);

    // Initial load must NOT request high-accuracy GPS, and must not watch.
    const calls = await geoCalls(page);
    const gcp = calls.filter((c) => c.method === "getCurrentPosition");
    expect(gcp.length).toBeGreaterThan(0);
    expect(gcp.every((c) => c.opts.enableHighAccuracy === false)).toBe(true);
    expect(calls.some((c) => c.method === "watchPosition")).toBe(false);
  });

  test("permission denied: shows the generic error and falls back to Jakarta (no user marker)", async ({ page }) => {
    await installGeoMock(page, {
      getCurrentPosition: { type: "error", code: 1, message: "User denied Geolocation", delay: 30 },
    });
    await page.goto("/");

    await expect(errorPopup(page)).toBeVisible();
    // Generic (not in-app) message
    await expect(page.getByText(/Mohon izinkan akses lokasi/)).toBeVisible();
    await expect(page.getByText(/Buka halaman ini di browser/)).toHaveCount(0);

    await expect.poll(async () => (await readGeoState(page)).centerLat).not.toBeNull();
    const state = await readGeoState(page);
    near(state.centerLat, JAKARTA.lat);
    near(state.centerLng, JAKARTA.lng);
    // No user location was obtained.
    expect(state.userLat).toBeNull();
    await expect(mapContainer(page)).toBeVisible();
  });

  test("timeout/hang: after the request timeout, falls back to default location", async ({ page }) => {
    test.setTimeout(40000); // the 15s fast-timeout elapses for real
    await installGeoMock(page, { getCurrentPosition: { type: "hang" } });
    await page.goto("/");

    // Spinner is shown while waiting.
    await expect(loadingPopup(page)).toBeVisible();

    // Eventually times out -> error + default.
    await expect(errorPopup(page)).toBeVisible({ timeout: 20000 });
    const state = await readGeoState(page);
    near(state.centerLat, JAKARTA.lat);
    expect(state.userLat).toBeNull();

    // The fast request used the normal (non-in-app) 15s timeout.
    const calls = await geoCalls(page);
    expect(calls[0].opts.timeout).toBe(15000);
  });

  test("Lokasi Saya: fast fix shows immediately, then high-accuracy GPS refines (non-blocking)", async ({ page }) => {
    await installGeoMock(page, {
      // initial load -> NETWORK_FIX; button click -> COARSE (distinct, proves the
      // button's own fast fix applied), then the watch refines to FINE.
      getCurrentPosition: [
        { type: "success", coords: NETWORK_FIX, delay: 30 },
        { type: "success", coords: COARSE, delay: 30 },
      ],
      watch: { type: "emit", emissions: [{ coords: FINE, delay: 1500 }] },
    });
    await page.goto("/");

    // Wait for the initial network fix to settle.
    await expect.poll(async () => (await readGeoState(page)).userLat)
      .toBeCloseTo(NETWORK_FIX.latitude, 2);

    await lokasiSayaBtn(page).click();

    // The spinner must dismiss on the FAST fix — well before the 1.5s refine arrives.
    await expect.poll(async () => (await readGeoState(page)).userLat, { timeout: 1000 })
      .toBeCloseTo(COARSE.latitude, 3);
    await expect(loadingPopup(page)).toHaveCount(0);

    // High-accuracy GPS was requested via watchPosition.
    const calls = await geoCalls(page);
    expect(calls.some((c) => c.method === "watchPosition" && c.opts.enableHighAccuracy === true)).toBe(true);

    // Then the refined (fine) position takes over.
    await expect.poll(async () => (await readGeoState(page)).userLat, { timeout: 5000 })
      .toBeCloseTo(FINE.latitude, 3);
    const state = await readGeoState(page);
    near(state.userLng, FINE.longitude);
  });

  test("geolocation unsupported: shows 'tidak mendukung' and falls back to default", async ({ page }) => {
    await installGeoMock(page, { unsupported: true });
    await page.goto("/");

    await expect(errorPopup(page)).toBeVisible();
    await expect(page.getByText(/tidak mendukung akses lokasi/)).toBeVisible();
    await expect.poll(async () => (await readGeoState(page)).centerLat).not.toBeNull();
    near((await readGeoState(page)).centerLat, JAKARTA.lat);
  });
});

test.describe("Geolocation — in-app browser (Threads/Instagram)", () => {
  test.use({ userAgent: UA_INAPP_THREADS });

  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("Lokasi Saya never requests high-accuracy GPS (it hangs in webviews)", async ({ page }) => {
    await installGeoMock(page, {
      // initial -> NETWORK_FIX, button -> COARSE (distinct), proving the low-accuracy
      // path still updates the map even inside the webview.
      getCurrentPosition: [
        { type: "success", coords: NETWORK_FIX, delay: 30 },
        { type: "success", coords: COARSE, delay: 30 },
      ],
      // If the app wrongly started a high-accuracy watch, it would hang here.
      watch: { type: "hang" },
    });
    await page.goto("/");
    await expect.poll(async () => (await readGeoState(page)).userLat)
      .toBeCloseTo(NETWORK_FIX.latitude, 2);

    await lokasiSayaBtn(page).click();

    // Map still updates from the low-accuracy fix, quickly.
    await expect.poll(async () => (await readGeoState(page)).userLat, { timeout: 2000 })
      .toBeCloseTo(COARSE.latitude, 2);
    await expect(loadingPopup(page)).toHaveCount(0);

    // Crucially: no high-accuracy watch was ever started.
    const calls = await geoCalls(page);
    expect(calls.some((c) => c.method === "watchPosition" && c.opts.enableHighAccuracy === true)).toBe(false);
  });

  test("uses the shorter in-app timeout and shows the 'open in browser' hint on failure", async ({ page }) => {
    test.setTimeout(30000); // the 10s in-app timeout elapses for real
    await installGeoMock(page, { getCurrentPosition: { type: "hang" } });
    await page.goto("/");

    await expect(loadingPopup(page)).toBeVisible();
    await expect(errorPopup(page)).toBeVisible({ timeout: 15000 });

    // In-app specific guidance to open in a real browser.
    await expect(page.getByText(/Buka halaman ini di browser/)).toBeVisible();

    // The fast request used the shorter 10s in-app timeout.
    const calls = await geoCalls(page);
    expect(calls[0].opts.timeout).toBe(10000);

    near((await readGeoState(page)).centerLat, JAKARTA.lat);
  });
});

test.describe("Geolocation — notification deep link", () => {
  // A kajian far from the user's location so "centered on kajian" vs
  // "centered on user" is unambiguous.
  const KAJIAN = {
    id: "k1",
    lat: -6.9,
    lng: 107.6,
    city: "Bandung",
    tags: "Umum",
    date: "2026-06-25",
    time: "19:00",
    title: "Kajian Test",
    topic: "Topik Test",
    speaker: "Ustadz Test",
    mosque: "Masjid Test",
  };

  test("opening from a notification then clicking Lokasi Saya recenters on the user (not the kajian)", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await installGeoMock(page, {
      // initial silent fix -> NETWORK_FIX; the button's request -> COARSE (distinct).
      getCurrentPosition: [
        { type: "success", coords: NETWORK_FIX, delay: 50 },
        { type: "success", coords: COARSE, delay: 30 },
      ],
      watch: { type: "hang" },
    });

    // Arrive via the notification deep link.
    await page.goto(`/?k=${KAJIAN.id}&d=${KAJIAN.date}&lat=${KAJIAN.lat}&lng=${KAJIAN.lng}`);

    // The deep link centers the map on the kajian and opens its flyer.
    await expect
      .poll(async () => (await readGeoState(page)).centerLat)
      .toBeCloseTo(KAJIAN.lat, 3);

    // Close the flyer (the "schedule" popup) — while it's open, SweetAlert marks
    // the rest of the page aria-hidden, so the button below is unreachable.
    await page.getByRole("button", { name: "Tutup" }).first().click();

    // Now click "Lokasi Saya": the map must move to the user's real location,
    // not stay pinned on the deep-linked kajian.
    await lokasiSayaBtn(page).click();

    await expect
      .poll(async () => (await readGeoState(page)).centerLat, { timeout: 5000 })
      .toBeCloseTo(COARSE.latitude, 3);
    const state = await readGeoState(page);
    near(state.centerLng, COARSE.longitude);
    near(state.userLat, COARSE.latitude);
  });
});

test.describe("Geolocation — edge details", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("high-accuracy good fix (<=50m) finalizes and is cached on first emit", async ({ page }) => {
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: COARSE, delay: 30 },
      watch: { type: "emit", emissions: [{ coords: FINE, delay: 300 }] },
    });
    await page.goto("/");
    await expect.poll(async () => (await readGeoState(page)).userLat).not.toBeNull();

    await lokasiSayaBtn(page).click();

    // The good (25m) fix should win.
    await expect.poll(async () => (await readGeoState(page)).userLat, { timeout: 5000 })
      .toBeCloseTo(FINE.latitude, 3);

    // After finalize, the high-accuracy watch must be cleared (no leak).
    await expect
      .poll(async () => (await geoCalls(page)).some((c) => c.method === "clearWatch"))
      .toBe(true);
  });

  test("rapid double-click on Lokasi Saya does not start overlapping requests", async ({ page }) => {
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: COARSE, delay: 400 },
      watch: { type: "hang" },
    });
    await page.goto("/");
    await expect.poll(async () => (await readGeoState(page)).userLat).not.toBeNull();

    const before = (await geoCalls(page)).filter((c) => c.method === "getCurrentPosition").length;

    // Fire two clicks in the SAME task (the modal would otherwise serialize real
    // clicks). This exercises the synchronous locatingRef guard directly.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === "Lokasi Saya"
      );
      btn.click();
      btn.click();
    });
    await page.waitForTimeout(600);

    const after = (await geoCalls(page)).filter((c) => c.method === "getCurrentPosition").length;
    // Only one new getCurrentPosition from the button (the second click was a no-op).
    expect(after - before).toBe(1);
  });
});
