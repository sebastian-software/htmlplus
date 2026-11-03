import { test, expect } from "playwright/test";

const site = "http://127.0.0.1:48165/htmlplus/";

test("the exported Pages artifact works under a repository subpath", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${site}demo/`);
  await expect(page.getByText("All fields valid", { exact: true })).toBeVisible();
  await expect(page.getByText("33 entries", { exact: true })).toBeVisible();
  expect(await page.locator("hplus-interval").evaluate((control) => control.value)).toEqual([200, 800]);
  expect(await page.locator(".inspector").evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
  expect((await request.get(`${site}package.json`)).status()).toBe(404);
  const notices = await request.get(`${site}dist/THIRD_PARTY_NOTICES.txt`);
  expect(notices.ok()).toBe(true);
  expect(await notices.text()).toContain("proxy-compare");
  await page.getByRole("link", { name: "Style hplus-switch", exact: true }).click();
  await expect(page).toHaveURL(`${site}demo/styling.html#hplus-switch`);
  await expect(page.locator("#recipe-heading")).toHaveText("Switch");
  await page.getByRole("button", { name: "Theme CSS", exact: true }).click();
  await expect(page.locator("#recipe-code")).toContainText(".hp-dark");
  await page.getByRole("button", { name: "Adapter", exact: true }).click();
  await expect(page.locator("#recipe-code")).toContainText("--_hp-shadcn-primary: var(--primary)");
  for (const file of ["shadcn.css", "themes.css", "native.css"])
    expect((await request.get(`${site}dist/${file}`)).ok()).toBe(true);
  await page.getByRole("link", { name: "html plus home" }).click();
  await expect(page).toHaveURL(site);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("More capable HTML. Ordinary forms.");
  expect(errors).toEqual([]);
});

test("the project site explains the project and shows real FormData", async ({ page }) => {
  const errors = [],
    external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(site) && !request.url().startsWith("data:")) external.push(request.url());
  });
  await page.goto(site);
  const rows = page.locator("#result-rows tr");
  await expect(rows).toHaveText([
    /iban\s*DE89370400440532013000/,
    /topics\s*html/,
    /topics\s*forms/,
    /updates\s*email/,
  ]);
  await expect(page.locator("hplus-iban input")).toHaveValue("DE89 3704 0044 0532 0130 00");
  await page.locator("hplus-iban input").fill("DE00");
  await expect(page.locator("#result-status")).toContainText("A submit would be blocked");
  await page.getByRole("button", { name: "Reset form" }).click();
  await expect(page.locator("#result-status")).toHaveText("All fields valid.");
  await expect(rows.first()).toContainText("DE89370400440532013000");
  await page.getByRole("link", { name: "Open the playground" }).click();
  await expect(page).toHaveURL(`${site}demo/`);
  await expect(page.getByText("33 entries", { exact: true })).toBeVisible();
  await page.goBack();
  const links = await page
    .locator(".catalog-groups a")
    .evaluateAll((items) => items.map((item) => item.getAttribute("href")));
  expect(links).toHaveLength(24);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("the project site fits a phone without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(site);
  await expect(page.locator("#result-rows tr").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
