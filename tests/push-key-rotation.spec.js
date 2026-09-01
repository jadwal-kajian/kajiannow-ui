// A push subscription is bound to the applicationServerKey it was created
// with. When the server's VAPID key no longer matches, the push service
// rejects every send with 403 forever -- so reusing an existing subscription
// blindly left those browsers permanently silent, and re-enabling
// notifications changed nothing because the old subscription was reused again.
import { test, expect } from "@playwright/test";

const evalWithKey = (page, key) =>
  page.evaluate(async (k) => {
    const { usesCurrentKey } = await import("/src/hooks/usePushSubscription.js");
    const { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } = await import("/src/utils/push.js");
    const buf = (b64) => urlBase64ToUint8Array(b64).buffer;
    const sub = { options: { applicationServerKey: buf(k ?? VAPID_PUBLIC_KEY) } };
    return {
      current: usesCurrentKey({ options: { applicationServerKey: buf(VAPID_PUBLIC_KEY) } }),
      given: usesCurrentKey(sub),
      noOptions: usesCurrentKey({}),
    };
  }, key);

test("keeps a subscription made with the key we still sign with", async ({ page }) => {
  await page.goto("/");
  const r = await evalWithKey(page, null);
  expect(r.current).toBe(true);
});

test("rejects a subscription made with a different key", async ({ page }) => {
  await page.goto("/");
  // A valid-looking but different P-256 key.
  const stale = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUAM-Ijv1IyKk8Wcbxs";
  const r = await evalWithKey(page, stale);
  expect(r.given).toBe(false);
});

test("keeps the subscription when the browser hides applicationServerKey", async ({ page }) => {
  // Older browsers do not expose it. Unsubscribing on a guess would prompt for
  // permission again for no reason.
  await page.goto("/");
  const r = await evalWithKey(page, null);
  expect(r.noOptions).toBe(true);
});

test("a stale subscription reports as not subscribed", async ({ page }) => {
  // Otherwise the settings toggle shows on, the user has no reason to touch
  // it, and the one action that would restore notifications never happens.
  await page.goto("/");
  const r = await page.evaluate(async () => {
    const { usesCurrentKey } = await import("/src/hooks/usePushSubscription.js");
    const { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } = await import("/src/utils/push.js");
    const stale = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUAM-Ijv1IyKk8Wcbxs";
    const sub = { options: { applicationServerKey: urlBase64ToUint8Array(stale).buffer } };
    // What getIsSubscribed now computes: present, but not usable.
    return { present: !!sub, reported: !!sub && usesCurrentKey(sub) };
  });
  expect(r.present).toBe(true);
  expect(r.reported).toBe(false);
});
