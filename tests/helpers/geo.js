// Helpers to deterministically control geolocation and the backend API in tests.

/**
 * Install a fully controllable `navigator.geolocation` mock BEFORE the app loads.
 *
 * The mock honors the real `timeout` option semantics: a "hang" (or a "success"
 * whose delay exceeds the request timeout) fires a TIMEOUT (code 3) error at
 * `opts.timeout`, exactly like a real browser. Every call is recorded on
 * `window.__geoCalls` for assertions.
 *
 * scenario = {
 *   unsupported?: boolean,
 *   getCurrentPosition?: { type:'success'|'error'|'hang', coords?, code?, message?, delay? },
 *   watch?: { type:'emit'|'error'|'hang', emissions?:[{coords,delay}], code?, message?, delay? },
 * }
 */
export async function installGeoMock(page, scenario = {}) {
  await page.addInitScript((scn) => {
    window.__geoCalls = [];

    const makePos = (c = {}) => ({
      coords: {
        latitude: c.latitude ?? 0,
        longitude: c.longitude ?? 0,
        accuracy: c.accuracy ?? 1000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1700000000000,
    });

    const makeErr = (e = {}) => ({
      code: e.code ?? 2,
      message: e.message ?? "error",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    const fireTimeout = (opts, error) => {
      const t = opts && typeof opts.timeout === "number" ? opts.timeout : null;
      if (t != null && t !== Infinity) {
        setTimeout(() => error(makeErr({ code: 3, message: "Timeout expired" })), t);
      }
    };

    let watchCounter = 0;
    let gcpIndex = 0;

    const mock = {
      getCurrentPosition(success, error, opts = {}) {
        window.__geoCalls.push({ method: "getCurrentPosition", opts });
        // getCurrentPosition may be a single response or a sequence consumed in
        // call order (the last entry repeats for any further calls).
        const cfg = scn.getCurrentPosition;
        const s = Array.isArray(cfg)
          ? cfg[Math.min(gcpIndex++, cfg.length - 1)] || { type: "hang" }
          : cfg || { type: "hang" };
        const delay = s.delay ?? 0;
        if (s.type === "success") {
          const timeout = opts.timeout ?? Infinity;
          if (delay > timeout) fireTimeout(opts, error);
          else setTimeout(() => success(makePos(s.coords)), delay);
        } else if (s.type === "error") {
          setTimeout(() => error(makeErr(s)), delay);
        } else {
          fireTimeout(opts, error);
        }
      },
      watchPosition(success, error, opts = {}) {
        const id = ++watchCounter;
        window.__geoCalls.push({ method: "watchPosition", opts, id });
        const w = scn.watch || { type: "hang" };
        if (w.type === "emit") {
          (w.emissions || []).forEach((e) =>
            setTimeout(() => success(makePos(e.coords)), e.delay ?? 0)
          );
        } else if (w.type === "error") {
          setTimeout(() => error(makeErr(w)), w.delay ?? 0);
        } else {
          fireTimeout(opts, error);
        }
        return id;
      },
      clearWatch(id) {
        window.__geoCalls.push({ method: "clearWatch", id });
      },
    };

    try {
      Object.defineProperty(navigator, "geolocation", {
        value: scn.unsupported ? undefined : mock,
        configurable: true,
      });
    } catch (e) {
      navigator.geolocation = scn.unsupported ? undefined : mock;
    }
  }, scenario);
}

/** Stub the kajian API so tests never depend on the real backend. */
export async function mockApi(page, { schedule = [] } = {}) {
  await page.route("**/last_update", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ last_update: "2026-06-06 10:00:00" }),
    })
  );
  await page.route("**/schedule*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(schedule),
    })
  );
}

/** Read the test-observable geo state rendered by the Home component. */
export async function readGeoState(page) {
  const el = page.getByTestId("geo-state");
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    locating: (await el.getAttribute("data-locating")) === "1",
    userLat: num(await el.getAttribute("data-user-lat")),
    userLng: num(await el.getAttribute("data-user-lng")),
    centerLat: num(await el.getAttribute("data-center-lat")),
    centerLng: num(await el.getAttribute("data-center-lng")),
  };
}

export const geoCalls = (page) => page.evaluate(() => window.__geoCalls || []);

// User agents.
export const UA_INAPP_THREADS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21A329 Instagram 309.0.0.0 (iPhone; iOS 17_0; en_US) Barcelona";

// Known coordinates.
export const JAKARTA = { lat: -6.2088, lng: 106.8456 }; // default fallback
export const COARSE = { latitude: 1.23, longitude: 4.56, accuracy: 3000 };
export const FINE = { latitude: 1.2345, longitude: 4.5678, accuracy: 25 };
export const NETWORK_FIX = { latitude: -7.5, longitude: 110.0, accuracy: 1500 };
