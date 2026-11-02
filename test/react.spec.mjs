import { expect, test } from "playwright/test";

const url = "http://127.0.0.1:48167/";
const log = async (page) => JSON.parse(await page.locator("#log").textContent());
const state = async (page) => JSON.parse(await page.locator("#state").textContent());
const clearLog = (page) => page.getByRole("button", { name: "Clear log" }).click();

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.waitForFunction(() => customElements.get("h6-switch") && window.hydrationErrors);
  await expect(page.locator("#iban input")).toHaveValue("DE89 3704 0044 0532 0130 00");
});

test("prerendered markup hydrates without errors and the elements receive their values", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await page.waitForFunction(() => window.hydrationErrors);
  await expect(page.locator("#tags")).toHaveJSProperty("value", ["html", "forms"]);
  await expect(page.locator("#budget")).toHaveJSProperty("value", [200, 800]);
  await expect(page.locator("#level")).toHaveJSProperty("value", 40);
  await expect(page.locator("#formats")).toHaveJSProperty("value", ["csv"]);
  await expect(page.locator("#updates")).toHaveJSProperty("checked", true);
  await expect(page.locator("#choice")).toHaveJSProperty("value", "a");
  expect(await page.evaluate(() => window.hydrationErrors)).toEqual([]);
  expect(errors).toEqual([]);
});

test("React's value prop sets current state and all fields submit through FormData", async ({ page }) => {
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("#submitted")).not.toBeEmpty();
  expect(JSON.parse(await page.locator("#submitted").textContent())).toEqual([
    ["iban", "DE89370400440532013000"],
    ["amount", "1.5"],
    ["duration", "5400"],
    ["date", "2028-02-29"],
    ["tags", "html"],
    ["tags", "forms"],
    ["budget.min", "200"],
    ["budget.max", "800"],
    ["choice", "a"],
    ["fruit", "a"],
    ["level", "40"],
    ["formats", "csv"],
    ["updates", "email"],
    ["fallback", "AT611904300234573201"],
  ]);
});

test("onInput and onChange fire once for a user edit, and typing survives the controlled round trip", async ({
  page,
}) => {
  const iban = page.locator("#iban input");
  await iban.fill("");
  await clearLog(page);
  await iban.pressSequentially("gb82");
  await expect(iban).toHaveValue("GB82");
  expect(await log(page)).toEqual(["iban:input", "iban:input", "iban:input", "iban:input"]);
  await iban.press("Tab");
  await expect.poll(() => log(page)).toContain("iban:change");
  expect((await log(page)).filter((item) => item === "iban:change")).toHaveLength(1);
  expect((await state(page)).iban).toBe("GB82");
});

test("a controlled field keeps drafts its canonical value cannot express", async ({ page }) => {
  const amount = page.locator("#amount input");
  await amount.fill("");
  await amount.pressSequentially("3.75");
  await expect(amount).toHaveValue("3.75");
  expect((await state(page)).amount).toBe("3.75");

  const duration = page.locator("#duration input");
  await duration.fill("");
  await duration.pressSequentially("1h 30m");
  await expect(duration).toHaveValue("1h 30m");
  expect((await state(page)).duration).toBe("5400");

  const date = page.locator("#date input");
  await date.fill("");
  await date.pressSequentially("03/04/2028");
  await expect(date).toHaveValue("03/04/2028");
  expect((await state(page)).date).toBe("2028-03-04");

  await date.fill("");
  await date.pressSequentially("03/");
  await expect(date).toHaveValue("03/");
  expect((await state(page)).date).toBe("");

  const fruit = page.locator("#fruit input");
  await fruit.fill("");
  await fruit.pressSequentially("Ban");
  await expect(fruit).toHaveValue("Ban");
  await expect(page.locator("#fruit")).toHaveJSProperty("value", "");

  const lower = page.locator("#budget input").first();
  await lower.fill("");
  await lower.pressSequentially("15");
  await expect(lower).toHaveValue("15");
  expect((await state(page)).budget).toEqual([15, 800]);
});

test("a controlled edit keeps the caret and native undo", async ({ page }) => {
  const iban = page.locator("#iban input");
  await iban.fill("DE89 3704");
  await iban.evaluate((input) => input.setSelectionRange(2, 2));
  await iban.pressSequentially("8");
  await expect(iban).toHaveValue("DE88 9370 4");
  expect(await iban.evaluate((input) => input.selectionStart)).toBe(3);
  await iban.press("ControlOrMeta+Z");
  await expect(iban).not.toHaveValue("DE88 9370 4");
});

test("non-text elements report one change through React", async ({ page }) => {
  await clearLog(page);
  await page.locator("#updates").click();
  await expect.poll(() => state(page).then((current) => current.updates)).toBe(false);
  expect((await log(page)).filter((item) => item.endsWith(":change"))).toEqual(["updates:change"]);

  await clearLog(page);
  await page.locator("#tags input").fill("web");
  await page.locator("#tags input").press("Enter");
  await expect.poll(() => state(page).then((current) => current.tags)).toEqual(["html", "forms", "web"]);
  expect(await log(page)).toContain("tags:change");

  await clearLog(page);
  await page.locator("#formats").getByRole("button", { name: "JSON" }).click();
  await expect.poll(() => state(page).then((current) => current.formats)).toEqual(["csv", "json"]);
  expect((await log(page)).filter((item) => item === "formats:change")).toHaveLength(1);

  await clearLog(page);
  await page.locator("#choice").getByRole("combobox").click();
  await page.locator("#choice").getByRole("option", { name: "Banana" }).click();
  await expect.poll(() => state(page).then((current) => current.choice)).toBe("b");
  expect((await log(page)).filter((item) => item === "choice:change")).toHaveLength(1);

  await clearLog(page);
  await page.locator("#level [part~=thumb]").press("ArrowRight");
  await expect.poll(() => state(page).then((current) => current.level)).toBe(41);
  expect((await log(page)).filter((item) => item === "level:change")).toHaveLength(1);
});

test("setting state from React updates every element without firing events", async ({ page }) => {
  await clearLog(page);
  await page.getByRole("button", { name: "Set from React" }).click();
  await expect(page.locator("#iban input")).toHaveValue("GB82 WEST 1234 5698 7654 32");
  await expect(page.locator("#amount")).toHaveJSProperty("value", "42");
  await expect(page.locator("#duration")).toHaveJSProperty("value", "60");
  await expect(page.locator("#date")).toHaveJSProperty("value", "2030-01-15");
  await expect(page.locator("#tags")).toHaveJSProperty("value", ["set"]);
  await expect(page.locator("#budget")).toHaveJSProperty("value", [1, 2]);
  await expect(page.locator("#choice")).toHaveJSProperty("value", "b");
  await expect(page.locator("#fruit")).toHaveJSProperty("value", "b");
  await expect(page.locator("#level")).toHaveJSProperty("value", 80);
  await expect(page.locator("#formats")).toHaveJSProperty("value", ["json"]);
  await expect(page.locator("#updates")).toHaveJSProperty("checked", false);
  expect(await log(page)).toEqual([]);
});

test("reset returns to the defaultValue prop, and elements survive unmounting", async ({ page }) => {
  await expect(page.locator("#fallback input")).toHaveValue("AT61 1904 3002 3457 3201");
  await page.locator("#fallback input").fill("DE89");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.locator("#fallback input")).toHaveValue("AT61 1904 3002 3457 3201");

  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Toggle mount" }).click();
  await expect(page.locator("#iban")).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle mount" }).click();
  await expect(page.locator("#iban input")).toHaveValue(/ /);
  await expect(page.locator("#tags")).toHaveJSProperty("value", (await state(page)).tags);
  expect(errors).toEqual([]);
});
