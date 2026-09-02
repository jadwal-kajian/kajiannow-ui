// Motion follows beui.dev's character: spring rather than linear, and a blur
// cross-fade on a swap. Asserted through computed style, because a wrong
// easing or a missing transition looks fine in a screenshot.
import { test, expect } from "@playwright/test";

test("the theme toggle cross-fades both icons instead of redrawing one", async ({ page }) => {
  await page.goto("/new/");
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  const state = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Mode gelap"], [aria-label="Mode terang"]');
    const icons = [...btn.querySelectorAll("svg")];
    return icons.map((i) => {
      const cs = getComputedStyle(i);
      return { opacity: cs.opacity, transition: cs.transitionProperty, easing: cs.transitionTimingFunction, filter: cs.filter };
    });
  });

  // Both icons are mounted at once: one shown, one faded out.
  expect(state.length).toBe(2);
  const shown = state.filter((s) => s.opacity === "1");
  const hidden = state.filter((s) => s.opacity === "0");
  expect(shown.length).toBe(1);
  expect(hidden.length).toBe(1);
  // The hidden one is blurred, and the swap is eased rather than linear.
  expect(hidden[0].filter).toContain("blur");
  expect(state[0].easing).toContain("cubic-bezier");
});

test("the notification switch springs rather than sliding at a constant rate", async ({ page }) => {
  await page.goto("/new/");
  if (await page.locator(".swal2-container").count()) await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.getByLabel("Pengaturan notifikasi kajian terdekat").click();
  await page.waitForSelector(".swal2-container", { timeout: 10000 });

  const easing = await page.evaluate(() => {
    const thumb = document.querySelector('.swal2-container [role="switch"] span');
    return getComputedStyle(thumb).transitionTimingFunction;
  });
  // beUI's EASE_OUT, not a bounce: every spring in that library sits at a
  // damping ratio of 0.87-0.94, so the thumb arrives decisively and does not
  // wobble. What this pins is that it is not a browser default either --
  // their own note is that ease-in/ease-out "feel weak".
  const [x1, y1, x2, y2] = easing.match(/cubic-bezier\(([^)]+)\)/)[1].split(",").map(Number);
  expect([x1, y1, x2, y2]).toEqual([0.16, 1, 0.3, 1]);
});
