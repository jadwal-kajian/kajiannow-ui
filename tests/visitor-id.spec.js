// The dashboard reported one unique visitor a day against hundreds of fetches.
// The API hashes the client IP when no vid arrives, and behind the proxy that
// address is the same for everyone, so the id has to come from the browser.
import { test, expect } from "@playwright/test";

const VID_KEY = "kn_vid";

/** Resolves once the app has actually written its visitor id. */
const waitForVid = (page) =>
  page.waitForFunction((k) => !!localStorage.getItem(k), VID_KEY, { timeout: 15000 });

test("the schedule fetch carries a visitor id", async ({ page }) => {
  const scheduleCalls = [];
  page.on("request", (r) => {
    if (r.url().includes("/schedule?")) scheduleCalls.push(r.url());
  });

  await page.goto("/");
  // Wait on the request itself rather than a fixed delay, so a slow machine
  // does not turn this into a flake.
  await page.waitForRequest((r) => r.url().includes("/schedule?"), { timeout: 15000 });

  expect(scheduleCalls.length).toBeGreaterThan(0);
  for (const url of scheduleCalls) {
    expect(url).toMatch(/[?&]vid=[^&]+/);
  }
});

test("the visitor id survives the on-mount localStorage clear", async ({ page }) => {
  // Home wipes localStorage on mount and restores an explicit keep-list. A vid
  // missing from that list is regenerated every visit, which counts one person
  // as a new visitor every time -- the opposite error, and just as wrong.
  await page.goto("/");
  await waitForVid(page);
  const first = await page.evaluate((k) => localStorage.getItem(k), VID_KEY);
  expect(first).toBeTruthy();

  await page.reload();
  await waitForVid(page);
  const second = await page.evaluate((k) => localStorage.getItem(k), VID_KEY);
  expect(second).toBe(first);
});
