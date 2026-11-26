import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// nginx.conf allows script only from our own files and the hashes it lists, so
// an inline script whose hash is missing would silently stop running in
// production while every dev-server test stays green.
const policy = () => {
  const conf = readFileSync("nginx.conf", "utf8");
  const m = conf.match(/add_header Content-Security-Policy "([^"]+)"/);
  return m ? m[1] : "";
};

const inlineScripts = (file) =>
  [...readFileSync(file, "utf8").matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

const hashOf = (body) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;

test("the site sends a script policy that blocks javascript: links and inline script", () => {
  const csp = policy();
  const scriptSrc = (csp.match(/script-src ([^;]+)/) || [])[1] || "";
  expect(scriptSrc).toContain("'self'");
  expect(scriptSrc).not.toContain("'unsafe-inline'");
  expect(scriptSrc).not.toContain("'unsafe-eval'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
});

for (const shell of ["index.html", "new/index.html"]) {
  test(`every inline script in ${shell} is allowed by its hash`, () => {
    const scriptSrc = (policy().match(/script-src ([^;]+)/) || [])[1] || "";
    for (const body of inlineScripts(shell)) expect(scriptSrc).toContain(hashOf(body));
  });
}
