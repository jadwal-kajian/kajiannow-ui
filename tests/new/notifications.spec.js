import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi } from "../helpers/geo.js";

// User sits here; nearby kajian share these coords so distance ≈ 0.
const USER = { latitude: -6.2, longitude: 106.8, accuracy: 50 };

// Build a kajian whose clock start is `minsAhead` from now in WIB (UTC+7).
// Date and HH.mm are derived from the same future moment so it stays "upcoming"
// even across a midnight rollover.
const kajianStartingIn = (minsAhead, overrides = {}) => {
  const wib = new Date(Date.now() + minsAhead * 60 * 1000 + 7 * 3600 * 1000);
  const date = wib.toISOString().slice(0, 10);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  return {
    id: "k1",
    lat: USER.latitude,
    lng: USER.longitude,
    city: "Jakarta",
    date,
    time_start: `${hh}.${mm}`,
    time_end: "",
    topic: "Kajian Tauhid",
    speaker: "Ustadz Fulan",
    loc_name: "Masjid Uji",
    addr: "Jl. Uji No. 1",
    contact: "-",
    notes: "",
    tags: "Aqidah",
    ...overrides,
  };
};

// Stub the Notification API: granted permission + capture every constructed
// notification on window.__notifs.
const installNotificationMock = async (page) => {
  await page.addInitScript(() => {
    window.__notifs = [];
    class FakeNotification {
      constructor(title, opts) {
        this.title = title;
        this.opts = opts;
        window.__notifs.push({ title, body: opts && opts.body });
      }
      close() {}
    }
    FakeNotification.permission = "granted";
    FakeNotification.requestPermission = () => Promise.resolve("granted");
    window.Notification = FakeNotification;

    // The hook prefers the service worker's showNotification (required on
    // Android Chrome); capture that path too.
    const reg = {
      showNotification(title, opts) {
        window.__notifs.push({ title, body: opts && opts.body });
        return Promise.resolve();
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: { async register() { return reg; }, async getRegistration() { return reg; }, ready: Promise.resolve(reg) },
      configurable: true,
    });
  });
};

// Enable the feature before the app boots (Home preserves this key across its
// on-mount localStorage.clear()).
const enableNotifySettings = async (page, { radiusKm, leadMinutes }) => {
  await page.addInitScript(
    (s) => localStorage.setItem("kn_notify_settings", JSON.stringify(s)),
    { enabled: true, radiusKm, leadMinutes }
  );
};

const notifCount = (page) => page.evaluate(() => (window.__notifs || []).length);

test.describe("Nearby kajian notifications", () => {
  test("notifies for a kajian that is near and starting soon", async ({ page }) => {
    await mockApi(page, { schedule: [kajianStartingIn(30)] });
    await installNotificationMock(page);
    await enableNotifySettings(page, { radiusKm: 5, leadMinutes: 60 });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/new/");

    await expect.poll(() => notifCount(page), { timeout: 8000 }).toBeGreaterThan(0);

    const notifs = await page.evaluate(() => window.__notifs);
    expect(notifs[0].title).toContain("Kajian dekat");
    expect(notifs[0].body).toContain("Kajian Tauhid");
  });

  test("does NOT notify when the kajian is outside the radius", async ({ page }) => {
    // ~550 km east — well outside a 5 km radius, same time window.
    const far = kajianStartingIn(30, { id: "far", lng: USER.longitude + 5 });
    await mockApi(page, { schedule: [far] });
    await installNotificationMock(page);
    await enableNotifySettings(page, { radiusKm: 5, leadMinutes: 60 });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/new/");
    await expect.poll(async () => (await page.evaluate(() => window.location.href)) && true).toBe(true);
    await page.waitForTimeout(2000);
    expect(await notifCount(page)).toBe(0);
  });

  test("does NOT notify when the kajian starts beyond the lead window", async ({ page }) => {
    // Starts in 5h; lead window is 60 min → no notification.
    await mockApi(page, { schedule: [kajianStartingIn(300)] });
    await installNotificationMock(page);
    await enableNotifySettings(page, { radiusKm: 50, leadMinutes: 60 });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/new/");
    await page.waitForTimeout(2000);
    expect(await notifCount(page)).toBe(0);
  });

  test("does NOT notify when the feature is disabled", async ({ page }) => {
    await mockApi(page, { schedule: [kajianStartingIn(30)] });
    await installNotificationMock(page);
    await enableNotifySettings(page, { radiusKm: 5, leadMinutes: 60 });
    // Override: turn it off.
    await page.addInitScript(() =>
      localStorage.setItem(
        "kn_notify_settings",
        JSON.stringify({ enabled: false, radiusKm: 5, leadMinutes: 60 })
      )
    );
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/new/");
    await page.waitForTimeout(2000);
    expect(await notifCount(page)).toBe(0);
  });
});
