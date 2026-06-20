import { test, expect } from "@playwright/test";
import { installGeoMock, mockApi } from "./helpers/geo.js";

const USER = { latitude: -6.2, longitude: 106.8, accuracy: 50 };

const KAJIAN = {
  id: "k1", lat: -6.2, lng: 106.8, city: "Jakarta", date: "2026-06-17",
  time_start: "09:00", time_end: "11:00", topic: "Kajian Reaksi",
  speaker: "Ustadz Tes", loc_name: "Masjid Tes", addr: "Jl. Tes", contact: "-",
  notes: "", tags: "rutin", likes: 2, going: 1,
};

// Stateful fake: mutates the counts like the real backend would, so add then
// remove returns to the original value.
const routeReact = (page, sink) => {
  const counts = { likes: 2, going: 1 };
  return page.route("**/react/**", (route) => {
    const url = new URL(route.request().url());
    const type = url.searchParams.get("type");
    const op = url.searchParams.get("op");
    sink.push({ type, op });
    const key = type === "like" ? "likes" : "going";
    counts[key] = Math.max(0, counts[key] + (op === "add" ? 1 : -1));
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "k1", ...counts }) });
  });
};

const openKajian = async (page) => {
  await installGeoMock(page, { getCurrentPosition: { type: "success", coords: USER, delay: 20 } });
  await page.goto("/");
  await page.locator(".leaflet-marker-icon.kajian-pin").first().click();
  await expect(page.locator(".swal2-popup").getByText("Kajian Reaksi")).toBeVisible();
};

test.describe("Kajian reactions", () => {
  test("liking calls the API, bumps the count, and records it locally", async ({ page }) => {
    const calls = [];
    await mockApi(page, { schedule: [KAJIAN] });
    await routeReact(page, calls);
    await openKajian(page);

    const suka = page.getByRole("button", { name: /Suka/ });
    await expect(suka).toContainText("2");
    await suka.click();

    await expect.poll(() => calls.find((c) => c.type === "like")?.op).toBe("add");
    await expect(suka).toContainText("3"); // server-reconciled count
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kn_reactions") || "{}"));
    expect(stored.like).toContain("k1");
  });

  test("count survives closing and reopening the popup", async ({ page }) => {
    await mockApi(page, { schedule: [KAJIAN] });
    await routeReact(page, []);
    await openKajian(page);

    const suka = page.getByRole("button", { name: /Suka/ });
    await expect(suka).toContainText("2");
    await suka.click();
    await expect(suka).toContainText("3"); // server-reconciled

    // Close, then reopen the same kajian (no page reload, schedule not refetched).
    await page.getByRole("button", { name: "Tutup" }).click();
    await expect(page.locator(".swal2-popup").getByText("Kajian Reaksi")).toBeHidden();
    await page.locator(".leaflet-marker-icon.kajian-pin").first().click();
    await expect(page.locator(".swal2-popup").getByText("Kajian Reaksi")).toBeVisible();

    // Count stays at 3 instead of resetting to the page-load value of 2.
    await expect(page.getByRole("button", { name: /Suka/ })).toContainText("3");
  });

  test("tapping an active reaction removes it (toggle)", async ({ page }) => {
    const calls = [];
    await mockApi(page, { schedule: [KAJIAN] });
    await routeReact(page, calls);
    await openKajian(page);

    const hadir = page.getByRole("button", { name: /Akan Hadir/ });
    await hadir.click();
    await expect.poll(() => calls.some((c) => c.type === "going" && c.op === "add")).toBe(true);
    await expect(hadir).toContainText("2");

    await hadir.click();
    await expect.poll(() => calls.some((c) => c.type === "going" && c.op === "remove")).toBe(true);
    await expect(hadir).toContainText("1");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kn_reactions") || "{}"));
    expect(stored.going || []).not.toContain("k1");
  });
});
