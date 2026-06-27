import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi } from "./helpers/geo.js";

const USER = { latitude: -6.2, longitude: 106.8, accuracy: 50 };

// Stub Notification (granted) + a fake service worker whose pushManager records
// subscribe/unsubscribe. `preSubscribed` seeds an existing subscription.
const installPushMock = async (page, { preSubscribed = false } = {}) => {
  await page.addInitScript((pre) => {
    window.__notifs = [];
    class FakeNotification {
      constructor(t, o) {
        window.__notifs.push({ title: t, body: o && o.body });
      }
      close() {}
    }
    FakeNotification.permission = "granted";
    FakeNotification.requestPermission = () => Promise.resolve("granted");
    window.Notification = FakeNotification;

    window.__push = { subscribeCalls: 0, unsubscribeCalls: 0 };

    const makeSub = (endpoint) => ({
      endpoint,
      toJSON() {
        return { endpoint, keys: { p256dh: "p256dh-key", auth: "auth-key" } };
      },
      async unsubscribe() {
        window.__push.unsubscribeCalls++;
        return true;
      },
    });

    let current = pre ? makeSub("https://push.example/existing") : null;

    const reg = {
      pushManager: {
        async getSubscription() {
          return current;
        },
        async subscribe() {
          window.__push.subscribeCalls++;
          current = makeSub("https://push.example/new");
          return current;
        },
      },
    };

    const swApi = {
      async register() {
        return reg;
      },
      async getRegistration() {
        return reg;
      },
      ready: Promise.resolve(reg),
    };

    Object.defineProperty(navigator, "serviceWorker", {
      value: swApi,
      configurable: true,
    });
  }, preSubscribed);
};

// Capture the backend subscribe/unsubscribe calls.
const routePushApi = async (page, sink) => {
  await page.route("**/push/subscribe", (route) => {
    const req = route.request();
    sink.push({ method: req.method(), body: req.postDataJSON?.() ?? null });
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
};

const openNotifySettings = async (page) => {
  await page.getByRole("button", { name: "Pengaturan notifikasi kajian terdekat" }).click();
  await expect(page.getByText("Tetap diberi tahu walau situs ditutup")).toBeVisible();
};

const pushToggle = (page) =>
  page.getByRole("switch").nth(1); // [0] = in-tab, [1] = background push
const saveBtn = (page) => page.getByRole("button", { name: /Simpan/ });

test.describe("Web Push subscription", () => {
  test("enabling background push subscribes and registers with the backend", async ({ page }) => {
    const calls = [];
    await mockApi(page, { schedule: [] });
    await routePushApi(page, calls);
    await installPushMock(page);
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/");
    // Wait for the location fix so the popup has a userLocation to send.
    await expect
      .poll(() => page.evaluate(() => window.__geoCalls && window.__geoCalls.length))
      .toBeGreaterThan(0);

    await openNotifySettings(page);
    await pushToggle(page).click();
    await saveBtn(page).click();

    await expect.poll(() => page.evaluate(() => window.__push.subscribeCalls)).toBe(1);

    const post = calls.find((c) => c.method === "POST");
    expect(post).toBeTruthy();
    expect(post.body.subscription.endpoint).toBe("https://push.example/new");
    expect(post.body.lat).toBeCloseTo(USER.latitude, 3);
    expect(post.body.lng).toBeCloseTo(USER.longitude, 3);
    expect(post.body.radius_km).toBe(5);
    expect(post.body.lead_minutes).toBe(60);
  });

  test("disabling background push unsubscribes and tells the backend", async ({ page }) => {
    const calls = [];
    await mockApi(page, { schedule: [] });
    await routePushApi(page, calls);
    await installPushMock(page, { preSubscribed: true });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });

    await page.goto("/");
    await openNotifySettings(page);

    // Reflects the existing subscription as ON.
    await expect(pushToggle(page)).toHaveAttribute("aria-checked", "true");

    await pushToggle(page).click();
    await saveBtn(page).click();

    await expect.poll(() => page.evaluate(() => window.__push.unsubscribeCalls)).toBe(1);
    expect(calls.some((c) => c.method === "DELETE")).toBe(true);
  });

  test("without a location, enabling push shows an error and does not subscribe", async ({ page }) => {
    const calls = [];
    await mockApi(page, { schedule: [] });
    await routePushApi(page, calls);
    await installPushMock(page);
    // Geolocation denied → no userLocation.
    await installGeoMock(page, {
      getCurrentPosition: { type: "error", code: 1, message: "denied", delay: 20 },
    });

    await page.goto("/");
    // Dismiss the location-error popup so the bell is clickable.
    await expect(page.getByText("Gagal mendapatkan lokasi")).toBeVisible();
    await page.keyboard.press("Escape").catch(() => {});
    await page.evaluate(() => window.Swal && window.Swal.close && window.Swal.close());

    await openNotifySettings(page);
    await pushToggle(page).click();
    await saveBtn(page).click();

    await expect(page.getByText(/Aktifkan lokasi dulu/)).toBeVisible();
    expect(await page.evaluate(() => window.__push.subscribeCalls)).toBe(0);
  });
});

test.describe("iPhone (Safari tab, not installed)", () => {
  // Real iPhone Safari UA (iOS 16.4).
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  });

  test("shows 'Add to Home Screen' steps instead of a dead-end unsupported message", async ({ page }) => {
    await mockApi(page, { schedule: [] });
    await installGeoMock(page, {
      getCurrentPosition: { type: "success", coords: USER, delay: 30 },
    });
    // iOS Safari tab: the Notification API is absent until the site is installed.
    await page.addInitScript(() => {
      try {
        delete window.Notification;
      } catch {
        /* ignore */
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Pengaturan notifikasi kajian terdekat" }).click();

    // Actionable install guidance, not the generic "browser tidak mendukung" dead end.
    await expect(page.getByText("Tambahkan ke Layar Utama dulu")).toBeVisible();
    await expect(page.getByText("Tambah ke Layar Utama")).toBeVisible();
    await expect(page.getByText("Browser Anda tidak mendukung notifikasi.")).toHaveCount(0);
  });
});
