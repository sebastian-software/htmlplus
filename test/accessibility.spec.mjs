import { test, expect } from "playwright/test";
import { fileURLToPath } from "node:url";

const axePath = fileURLToPath(import.meta.resolve("axe-core/axe.min.js"));

async function violations(page) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const { violations } = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
    return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(" ")) }));
  });
}

// Axe covers what automation can see. Screen reader behavior still needs manual checks.
for (const [name, path, ready] of [
  ["project site", "/", "#result-rows tr"],
  ["playground", "/demo/", "#entry-count"],
  ["styling gallery", "/demo/styling.html", "#recipe-heading"],
]) {
  test(`the ${name} has no automatically detectable WCAG A or AA violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(ready).first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("open popups have no automatically detectable WCAG A or AA violations", async ({ page }) => {
  await page.route("**/popup-accessibility", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head><title>Popups</title><script type="module" src="/dist/src/index.js"></script></head><body><main><form>
    <label for="choice">Choice</label><h6-select id="choice" name="choice"><option value="a">Apple</option></h6-select>
    <label for="date">Date</label><h6-date-picker id="date" name="date" value="2028-02-29"></h6-date-picker>
  </form></main></body></html>`,
    }),
  );
  await page.goto("/popup-accessibility");
  await page.waitForFunction(() => customElements.get("h6-field"));
  await page.locator("#choice").evaluate((host) => host.shadowRoot.querySelector("[part=trigger]").click());
  await expect(page.locator("#choice [part=content]")).toBeVisible();
  expect(await violations(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await page.locator("#date").evaluate((host) => host.showPicker());
  await expect(page.locator("#date [part=content]")).toBeVisible();
  expect(await violations(page)).toEqual([]);
});
