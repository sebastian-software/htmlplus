import { test, expect } from "playwright/test";

const pageUrl = "http://127.0.0.1:48164/contract";
const editors = [
  ["h6-iban", "input"],
  ["h6-bic", "input"],
  ["h6-otp", "input"],
  ["h6-duration", "input"],
  ["h6-password-input", "input"],
  ["h6-number-input", "input"],
  ["h6-interval", "input"],
  ["h6-combobox", "input"],
  ["h6-date-picker", "input"],
  ["h6-date-range-picker", "input"],
];

async function load(page, body, lang = "en-US") {
  await page.route(pageUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="${lang}"><body>${body}<script>window.submits = []; document.addEventListener('submit', event => { event.preventDefault(); submits.push(event.submitter?.name ?? null); });</script><script type="module" src="/dist/src/index.js"></script></body></html>`,
    }),
  );
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get("h6-field"));
}
const submits = (page) => page.evaluate(() => window.submits);
const entries = (page) => page.evaluate(() => [...new FormData(document.forms[0])]);

test.describe("implicit submission", () => {
  for (const [tag, editor] of editors) {
    test(`Enter in ${tag} activates the default button`, async ({ page }) => {
      await load(page, `<form><label>Field <${tag} name="field"></${tag}></label><button name="go">Go</button></form>`);
      await page.locator(`${tag} ${editor}`).first().press("Enter");
      await expect.poll(() => submits(page)).toEqual(["go"]);
    });
  }

  test("validation still blocks the submission and reveals the field", async ({ page }) => {
    await load(page, '<form><label>IBAN <h6-iban name="iban" required></h6-iban></label><button>Go</button></form>');
    const input = page.locator("h6-iban input");
    await input.press("Enter");
    await expect(page.locator("h6-iban")).toHaveAttribute("data-touched", "");
    expect(await submits(page)).toEqual([]);
  });

  test("change fires before submit, as with a native field", async ({ page }) => {
    await load(
      page,
      '<form><label>Duration <h6-duration name="duration"></h6-duration></label><button>Go</button></form>',
    );
    await page.evaluate(() => {
      window.order = [];
      for (const type of ["change", "submit"]) document.addEventListener(type, () => order.push(type));
    });
    const input = page.locator("h6-duration input");
    await input.fill("90m");
    await input.press("Enter");
    await expect.poll(() => page.evaluate(() => window.order)).toEqual(["change", "submit"]);
  });

  test("a disabled default button, preventDefault, and a second editor stop it like native forms", async ({ page }) => {
    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration><button disabled>Go</button></form>');
    await page.locator("h6-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration><button>Go</button></form>');
    await page.evaluate(() => document.addEventListener("keypress", (event) => event.preventDefault()));
    await page.locator("h6-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(
      page,
      '<form><h6-duration aria-label="Time" name="a"></h6-duration><input aria-label="Other" name="b"></form>',
    );
    await page.locator("h6-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration></form>');
    await page.locator("h6-duration input").press("Enter");
    await expect.poll(() => submits(page)).toEqual([null]);
  });

  test("Enter choosing a combobox option and Enter committing a tag do not submit", async ({ page }) => {
    await load(
      page,
      '<form><h6-combobox aria-label="Fruit" name="fruit"><option value="a">Apple</option></h6-combobox><h6-tags aria-label="Tags" name="tags"></h6-tags><button>Go</button></form>',
    );
    const combo = page.locator("h6-combobox input");
    await combo.pressSequentially("App");
    await combo.press("ArrowDown");
    await combo.press("Enter");
    await page.waitForTimeout(50);
    expect(await entries(page)).toEqual([["fruit", "a"]]);
    expect(await submits(page)).toEqual([]);

    const tags = page.locator("h6-tags input");
    await tags.fill("html");
    await tags.press("Enter");
    await page.waitForTimeout(50);
    expect(await entries(page)).toEqual([
      ["fruit", "a"],
      ["tags", "html"],
    ]);
    expect(await submits(page)).toEqual([]);
  });
});

test.describe("number input separators", () => {
  for (const [lang, text] of [
    ["en-US", "1,234"],
    ["en-US", "1,5"],
    ["de-DE", "1.5"],
    ["de-DE", "1.234"],
  ]) {
    test(`${lang} keeps ${text} as an invalid draft`, async ({ page }) => {
      await load(page, '<form><h6-number-input aria-label="Amount" name="amount"></h6-number-input></form>', lang);
      const input = page.locator("h6-number-input input");
      await input.pressSequentially(text);
      await expect(page.locator("h6-number-input")).toHaveJSProperty("value", "");
      await input.blur();
      await expect(input).toHaveValue(text);
      expect(await page.locator("h6-number-input").evaluate((host) => host.validity.badInput)).toBe(true);
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(false);
    });
  }

  test("localized decimals stay valid after blur", async ({ page }) => {
    await load(
      page,
      '<form><h6-number-input aria-label="Amount" name="amount" step="0.25"></h6-number-input></form>',
      "de-DE",
    );
    const input = page.locator("h6-number-input input");
    await input.pressSequentially("3,75");
    await input.blur();
    await expect(input).toHaveValue("3,75");
    expect(await entries(page)).toEqual([["amount", "3.75"]]);
  });
});

test.describe("inherited language", () => {
  for (const lang of ["de_DE", "x-foo"]) {
    test(`an unusable lang="${lang}" keeps date fields working`, async ({ page }) => {
      await load(
        page,
        '<form><h6-date-picker aria-label="Date" name="date" value="2028-02-29"></h6-date-picker><h6-date-range-picker aria-label="Range" name="range" value=\'["2028-02-28","2028-03-02"]\'></h6-date-range-picker></form>',
        lang,
      );
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(true);
      expect(await entries(page)).toEqual([
        ["date", "2028-02-29"],
        ["range.start", "2028-02-28"],
        ["range.end", "2028-03-02"],
      ]);
      await expect(page.locator("h6-date-picker [part=trigger]")).toBeEnabled();
    });
  }

  test("the nearest usable ancestor language wins", async ({ page }) => {
    await load(
      page,
      '<form><div lang="de_DE"><h6-date-picker aria-label="Date" name="date" value="2028-02-29"></h6-date-picker></div></form>',
      "de-DE",
    );
    await expect(page.locator("h6-date-picker input")).toHaveValue("29.02.2028");
  });

  test("a disconnected element still reads the document language", async ({ page }) => {
    await load(page, "<form></form>", "de-DE");
    expect(await page.evaluate(() => document.createElement("h6-date-picker").locale)).toBe("de-DE");
  });

  test("an invalid explicit locale remains a reported configuration error", async ({ page }) => {
    await load(
      page,
      '<form><h6-date-picker aria-label="Date" name="date" value="2028-02-29" locale="de_DE"></h6-date-picker></form>',
    );
    expect(await page.locator("h6-date-picker").evaluate((host) => host.validity.customError)).toBe(true);
  });
});

test("passwords stay out of session history while other fields are restored", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Only Chromium restores form-associated state under Playwright navigation.");
  await page.route(pageUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en-US"><body><form action="/next"><h6-password-input aria-label="Password" name="password"></h6-password-input><h6-duration aria-label="Time" name="time"></h6-duration><input aria-label="Native" type="password" name="native"></form><script type="module" src="/dist/src/index.js"></script></body></html>',
    }),
  );
  await page.route("http://127.0.0.1:48164/next", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Next</title>" }),
  );
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get("h6-field"));
  await page.locator("h6-password-input input").fill("s3cret");
  await page.locator("h6-duration input").fill("90m");
  await page.locator("input[name=native]").fill("s3cret");
  await page.goto("http://127.0.0.1:48164/next");
  await page.goBack();
  await page.waitForFunction(() => customElements.get("h6-field"));
  await expect(page.locator("h6-duration input")).toHaveValue("90m");
  await expect(page.locator("input[name=native]")).toHaveValue("");
  await expect(page.locator("h6-password-input input")).toHaveValue("");
  expect(await entries(page)).toEqual([
    ["password", ""],
    ["time", "5400"],
    ["native", ""],
  ]);
});

const fruit = '<option value="a">Apple</option><option value="b">Banana</option><option value="c">Cherry</option>';
const isDisplayed = (page, selector) =>
  page.locator(selector).evaluate((host) => host.shadowRoot.querySelectorAll('[aria-invalid="true"]').length > 0);

test.describe("properties assigned before upgrade", () => {
  const cases = [
    ["h6-iban", "", "'DE89370400440532013000'", [["field", "DE89370400440532013000"]]],
    ["h6-number-input", "", "5", [["field", "5"]]],
    ["h6-select", fruit, "'b'", [["field", "b"]]],
    ["h6-combobox", fruit, "'b'", [["field", "b"]]],
    ["h6-radio-group", fruit, "'b'", [["field", "b"]]],
    ["h6-segmented", fruit, "'b'", [["field", "b"]]],
    ["h6-toggle-group", fruit, "['b']", [["field", "b"]]],
    ["h6-tags", "", "['x']", [["field", "x"]]],
    ["h6-date-picker", "", "'2028-02-29'", [["field", "2028-02-29"]]],
    ["h6-rating", "", "3", [["field", "3"]]],
    ["h6-slider", "", "7", [["field", "7"]]],
  ];
  for (const [tag, inner, value, expected] of cases) {
    test(`${tag}.value reaches the setter`, async ({ page }) => {
      await load(
        page,
        `<form><${tag} id="control" name="field">${inner}</${tag}></form><script>document.getElementById('control').value = ${value};</script>`,
      );
      expect(await entries(page)).toEqual(expected);
      expect(await page.locator(tag).evaluate((host) => Object.hasOwn(host, "value"))).toBe(false);
    });
  }

  test("state properties and the visible editor follow too", async ({ page }) => {
    await load(
      page,
      `<form><h6-switch id="a" name="a"></h6-switch><h6-toggle id="b" name="b"></h6-toggle><h6-checkbox id="c" name="c"></h6-checkbox><h6-iban id="d" name="d"></h6-iban><h6-select id="e" name="e">${fruit}</h6-select></form>
      <script>a.checked = true; b.pressed = true; c.checked = true; d.value = 'de89370400440532013000'; e.value = 'b';</script>`,
    );
    expect(await entries(page)).toEqual([
      ["a", "on"],
      ["b", "on"],
      ["c", "on"],
      ["d", "DE89370400440532013000"],
      ["e", "b"],
    ]);
    await expect(page.locator("#d input")).toHaveValue("DE89 3704 0044 0532 0130 00");
    await expect(page.locator("#e [part=value-text]")).toHaveText("Banana");
  });
});

test.describe("field names", () => {
  for (const [tag, role] of [
    ["h6-select", "combobox"],
    ["h6-combobox", "combobox"],
    ["h6-radio-group", "radiogroup"],
  ]) {
    test(`a wrapping label excludes ${tag} option text`, async ({ page }) => {
      await load(page, `<form><label>Fruit <${tag} name="field">${fruit}</${tag}></label></form>`);
      await expect(page.getByRole(role, { name: "Fruit", exact: true })).toHaveCount(1);
    });
  }

  for (const [tag, role, inner] of [
    ["h6-iban", "textbox", ""],
    ["h6-tags", "textbox", ""],
    ["h6-select", "combobox", fruit],
    ["h6-number-input", "spinbutton", ""],
    ["h6-slider", "slider", ""],
    ["h6-toggle", "button", ""],
    ["h6-checkbox", "checkbox", ""],
  ]) {
    test(`${tag} follows label edits, sibling labels, and removal`, async ({ page }) => {
      await load(
        page,
        `<form><label id="label" for="control">Before</label><${tag} id="control" name="field">${inner}</${tag}></form>`,
      );
      await expect(page.getByRole(role, { name: "Before", exact: true })).toHaveCount(1);
      await page.locator("#label").evaluate((label) => {
        label.textContent = "After";
      });
      await expect(page.getByRole(role, { name: "After", exact: true })).toHaveCount(1);
      await page.locator("#label").evaluate((label) => label.remove());
      await expect(page.getByRole(role, { name: "After", exact: true })).toHaveCount(0);
      await page
        .locator("form")
        .evaluate((form) => form.insertAdjacentHTML("afterbegin", '<label for="control">Late</label>'));
      await expect(page.getByRole(role, { name: "Late", exact: true })).toHaveCount(1);
    });
  }

  test("a label added elsewhere is picked up on focus", async ({ page }) => {
    await load(page, '<div id="elsewhere"></div><form><h6-iban id="control" name="field"></h6-iban></form>');
    await page.locator("#elsewhere").evaluate((node) => {
      node.innerHTML = '<label for="control">Account</label>';
    });
    await page.locator("h6-iban input").focus();
    await expect(page.getByRole("textbox", { name: "Account", exact: true })).toBeFocused();
  });

  test("Tags, Interval, and text fields honor references, including late ones", async ({ page }) => {
    await load(
      page,
      '<form><span id="name">Named</span><span id="help">Helpful</span><h6-tags aria-labelledby="name" aria-describedby="help" name="tags"></h6-tags><h6-interval aria-labelledby="name" aria-describedby="help" name="range"></h6-interval><h6-iban id="late" name="iban"></h6-iban></form>',
    );
    await expect(page.locator("h6-tags input")).toHaveAttribute("aria-label", "Named");
    await expect(page.locator("h6-tags input")).toHaveAttribute("aria-description", "Helpful");
    await expect(page.locator("h6-interval input").first()).toHaveAttribute("aria-label", "Named: From");
    await expect(page.locator("h6-interval input").first()).toHaveAttribute("aria-description", "Helpful");
    await page.locator("#late").evaluate((host) => {
      host.setAttribute("aria-labelledby", "name");
      host.setAttribute("aria-describedby", "help");
    });
    await expect(page.locator("#late input")).toHaveAttribute("aria-label", "Named");
    await expect(page.locator("#late input")).toHaveAttribute("aria-description", "Helpful");
    await page.locator("#name").evaluate((node) => {
      node.textContent = "Renamed";
    });
    await expect(page.locator("#late input")).toHaveAttribute("aria-label", "Renamed");
    await expect(page.locator("h6-tags input")).toHaveAttribute("aria-label", "Renamed");
  });
});

test.describe('step="any"', () => {
  test("Number Input has no step constraint and steps by one", async ({ page }) => {
    await load(page, '<form><h6-number-input aria-label="Amount" name="amount" step="any"></h6-number-input></form>');
    const input = page.locator("h6-number-input input");
    await input.pressSequentially("1.5");
    await input.blur();
    expect(await page.locator("h6-number-input").evaluate((host) => [host.validity.valid, host.step])).toEqual([
      true,
      1,
    ]);
    expect(await entries(page)).toEqual([["amount", "1.5"]]);
    await input.press("ArrowUp");
    expect(await entries(page)).toEqual([["amount", "2.5"]]);
  });

  test("Slider keeps an unsnapped value and steps by one", async ({ page }) => {
    await load(page, '<form><h6-slider aria-label="Level" name="level" step="any" value="1.5"></h6-slider></form>');
    expect(await page.locator("h6-slider").evaluate((host) => [host.validity.valid, host.value, host.step])).toEqual([
      true,
      1.5,
      1,
    ]);
    expect(await entries(page)).toEqual([["level", "1.5"]]);
    await page.locator("h6-slider").evaluate((host) => {
      host.value = 2;
    });
    await page.getByRole("slider").press("ArrowRight");
    expect(await entries(page)).toEqual([["level", "3"]]);
  });
});

test.describe("invalid presentation waits until touched", () => {
  const required = [
    ["h6-iban", ""],
    ["h6-number-input", ""],
    ["h6-password-input", ""],
    ["h6-interval", ""],
    ["h6-tags", ""],
    ["h6-select", fruit],
    ["h6-combobox", fruit],
    ["h6-date-picker", ""],
    ["h6-date-range-picker", ""],
    ["h6-toggle", ""],
    ["h6-checkbox", ""],
    ["h6-radio-group", fruit],
    ["h6-toggle-group", fruit],
    ["h6-rating", ""],
  ];
  for (const [tag, inner] of required) {
    test(`${tag} marks itself after a failed submit and reset clears it`, async ({ page }) => {
      await load(
        page,
        `<form><${tag} aria-label="Field" name="field" required>${inner}</${tag}><button>Go</button></form>`,
      );
      expect(await isDisplayed(page, tag)).toBe(false);
      expect(await page.locator(tag).evaluate((host) => host.hasAttribute("data-touched"))).toBe(false);
      await page.locator("form > button").click();
      await expect.poll(() => isDisplayed(page, tag)).toBe(true);
      await expect(page.locator(tag)).toHaveAttribute("data-touched", "");
      await page.locator("form").evaluate((form) => form.reset());
      expect(await isDisplayed(page, tag)).toBe(false);
      expect(await page.locator(tag).evaluate((host) => host.hasAttribute("data-touched"))).toBe(false);
    });
  }

  test("leaving a control marks it, but moving inside it does not", async ({ page }) => {
    await load(
      page,
      '<form><h6-interval aria-label="Range" name="range" required></h6-interval><h6-tags aria-label="Tags" name="tags" required></h6-tags><button>Go</button></form>',
    );
    await page.locator("h6-interval input").first().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("h6-interval input").nth(1)).toBeFocused();
    expect(await isDisplayed(page, "h6-interval")).toBe(false);
    await page.keyboard.press("Tab");
    await expect.poll(() => isDisplayed(page, "h6-interval")).toBe(true);
    expect(await isDisplayed(page, "h6-tags")).toBe(false);
    await page.keyboard.press("Tab");
    await expect.poll(() => isDisplayed(page, "h6-tags")).toBe(true);
    await expect(page.locator("h6-tags")).toHaveAttribute("data-touched", "");
  });

  for (const [tag, part, property] of [
    ["h6-switch", "[part=track]", "borderTopColor"],
    ["h6-toggle", "button", "borderTopColor"],
    ["h6-rating", "[part=control]", "outlineStyle"],
    ["h6-tags", "[part=control]", "borderTopColor"],
  ]) {
    test(`${tag} has no destructive style until touched`, async ({ page }) => {
      await load(page, `<form><${tag} aria-label="Field" name="field" required></${tag}><button>Go</button></form>`);
      const read = () =>
        page
          .locator(tag)
          .evaluate(
            (host, [part, property]) => getComputedStyle(host.shadowRoot.querySelector(part))[property],
            [part, property],
          );
      const pristine = await read();
      await page.locator("form").evaluate((form) => form.checkValidity());
      await expect.poll(read).not.toBe(pristine);
    });
  }
});

test.describe("shared option policy", () => {
  for (const tag of ["h6-select", "h6-combobox", "h6-radio-group", "h6-segmented", "h6-toggle-group"]) {
    const assign = (host, value) => {
      host.value = host.localName === "h6-toggle-group" ? [value] : value;
    };
    const current = (host) => [host.value].flat()[0] ?? "";

    test(`${tag} applies native option defaults`, async ({ page }) => {
      await load(
        page,
        `<form><${tag} aria-label="Field" name="field"><option>Plain</option><option value="bare"></option><option value="plain2">First</option><option value="plain2">Second</option></${tag}></form>`,
      );
      for (const [value, entry] of [
        ["Plain", "Plain"],
        ["bare", "bare"],
        ["plain2", "plain2"],
      ]) {
        await page.locator(tag).evaluate(assign, value);
        expect(await entries(page)).toEqual([["field", entry]]);
      }
      const text = await page.locator(tag).evaluate((host) => host.shadowRoot.textContent);
      expect(text).toContain("bare");
      expect(text).toContain("First");
      expect(text).not.toContain("Second");
    });

    test(`${tag} keeps a disabled or removed selection until its option returns`, async ({ page }) => {
      await load(page, `<form><${tag} aria-label="Field" name="field">${fruit}</${tag}></form>`);
      const host = page.locator(tag),
        value = () => host.evaluate(current);
      await host.evaluate(assign, "b");
      await host.locator("option[value=b]").evaluate((option) => {
        option.disabled = true;
      });
      await expect.poll(value).toBe("");
      expect(await entries(page)).toEqual([]);
      await host.locator("option[value=b]").evaluate((option) => {
        option.disabled = false;
      });
      await expect.poll(value).toBe("b");
      expect(await entries(page)).toEqual([["field", "b"]]);
      await host.evaluate((element) => {
        element.innerHTML = "";
      });
      await expect.poll(value).toBe("");
      expect(await entries(page)).toEqual([]);
      await host.evaluate((element, options) => {
        element.innerHTML = options;
      }, fruit);
      await expect.poll(value).toBe("b");
      expect(await entries(page)).toEqual([["field", "b"]]);
    });
  }
});

test.describe("non-string assignment", () => {
  test("null and undefined empty the value; other values use String()", async ({ page }) => {
    await load(
      page,
      `<form><h6-iban id="iban"></h6-iban><h6-duration id="duration"></h6-duration><h6-number-input id="number"></h6-number-input><h6-date-picker id="date" value="2028-02-29"></h6-date-picker><h6-select id="select">${fruit}</h6-select><h6-segmented id="segmented">${fruit}</h6-segmented><h6-radio-group id="radio">${fruit}</h6-radio-group></form>`,
    );
    const assign = (selector, value) =>
      page.locator(selector).evaluate((host, value) => {
        host.value = value === "__undefined" ? undefined : value;
        return host.value;
      }, value);
    for (const empty of [null, "__undefined"]) {
      for (const selector of ["#iban", "#duration", "#number", "#date", "#select", "#segmented", "#radio"])
        expect(await assign(selector, empty)).toBe("");
    }
    expect(await assign("#number", 5)).toBe("5");
    expect(await page.locator("#number").evaluate((host) => host.displayValue)).toBe("5");
    expect(await assign("#duration", 90)).toBe("90");
    expect(
      await page.locator("#date").evaluate((host) => {
        try {
          host.value = "nope";
          return "set";
        } catch (error) {
          return error.name;
        }
      }),
    ).toBe("RangeError");
  });
});

test.describe("format validity states", () => {
  test("Duration bounds use range states and ignore empty attributes", async ({ page }) => {
    await load(
      page,
      '<form><h6-duration id="low" min="60" value="30"></h6-duration><h6-duration id="high" max="60" value="90"></h6-duration><h6-duration id="empty" min="" max="" value="90"></h6-duration><h6-duration id="bad" value="soon"></h6-duration></form>',
    );
    const validity = (selector) =>
      page.locator(selector).evaluate((host) => ({
        low: host.validity.rangeUnderflow,
        high: host.validity.rangeOverflow,
        bad: host.validity.badInput,
        custom: host.validity.customError,
        valid: host.validity.valid,
      }));
    expect(await validity("#low")).toEqual({ low: true, high: false, bad: false, custom: false, valid: false });
    expect(await validity("#high")).toEqual({ low: false, high: true, bad: false, custom: false, valid: false });
    expect(await validity("#empty")).toEqual({ low: false, high: false, bad: false, custom: false, valid: true });
    expect(await validity("#bad")).toEqual({ low: false, high: false, bad: true, custom: false, valid: false });
  });

  for (const [tag, value, message] of [
    ["h6-iban", "DE89370400440532013001", /check digits/],
    ["h6-bic", "DEUT12FF", /two-letter country code/],
  ]) {
    test(`${tag} format errors use patternMismatch and survive clearing custom errors`, async ({ page }) => {
      await load(page, `<form><${tag} value="${value}"></${tag}></form>`);
      const host = page.locator(tag),
        state = () =>
          host.evaluate((field) => [
            field.validity.patternMismatch,
            field.validity.customError,
            field.validationMessage,
          ]);
      const [pattern, custom, text] = await state();
      expect([pattern, custom]).toEqual([true, false]);
      expect(text).toMatch(message);
      await host.evaluate((field) => field.setCustomValidity("Taken"));
      expect((await state())[1]).toBe(true);
      expect((await state())[2]).toBe("Taken");
      await host.evaluate((field) => field.setCustomValidity(""));
      expect(await state()).toEqual([true, false, text]);
    });
  }
});

test.describe("editor and environment details", () => {
  test("IBAN maxlength limits the canonical value, not the grouped text", async ({ page }) => {
    await load(page, '<form><h6-iban aria-label="IBAN" name="iban" maxlength="22"></h6-iban></form>');
    const input = page.locator("h6-iban input");
    await input.pressSequentially("DE8937040044053201300099");
    await expect(input).toHaveValue("DE89 3704 0044 0532 0130 00");
    expect(await entries(page)).toEqual([["iban", "DE89370400440532013000"]]);
    expect(await page.locator("h6-iban").evaluate((host) => host.validity.valid)).toBe(true);
  });

  test("Number Input steppers control the actual editor", async ({ page }) => {
    await load(page, '<form><h6-number-input aria-label="Amount"></h6-number-input></form>');
    const resolved = await page
      .locator("h6-number-input")
      .evaluate((host) =>
        [...host.shadowRoot.querySelectorAll("[part$=-trigger]")].map(
          (button) => host.shadowRoot.getElementById(button.getAttribute("aria-controls")) === host.input,
        ),
      );
    expect(resolved).toEqual([true, true]);
  });

  test("Slider follows an ancestor direction change", async ({ page }) => {
    await load(
      page,
      '<form><div id="context"><h6-slider aria-label="Level" name="level" value="5"></h6-slider></div></form>',
    );
    await page.locator("#context").evaluate((node) => {
      node.dir = "rtl";
    });
    await expect(page.locator("h6-slider [part=root]")).toHaveAttribute("dir", "rtl");
    await page.getByRole("slider").press("ArrowRight");
    expect(await entries(page)).toEqual([["level", "4"]]);
  });

  test("visibilitychange stays on the Password Input host", async ({ page }) => {
    await load(page, '<form><h6-password-input aria-label="Password" name="secret"></h6-password-input></form>');
    await page.evaluate(() => {
      window.seen = [];
      document.addEventListener("visibilitychange", () => seen.push("document"));
      document
        .querySelector("h6-password-input")
        .addEventListener("visibilitychange", (event) => seen.push(event.detail.visible));
    });
    await page.getByRole("button", { name: "Show password" }).click();
    await expect.poll(() => page.evaluate(() => window.seen)).toEqual([true]);
  });

  for (const [tag, inner, act] of [
    [
      "h6-iban",
      "",
      async (host) => {
        await host.locator("input").fill("DE");
        await host.locator("input").blur();
      },
    ],
    [
      "h6-interval",
      "",
      async (host) => {
        await host.locator("input").first().fill("1");
        await host.locator("input").first().blur();
      },
    ],
    [
      "h6-segmented",
      fruit,
      async (host) => {
        await host.locator("[part=option]", { hasText: "Banana" }).click();
      },
    ],
    [
      "h6-tags",
      "",
      async (host) => {
        await host.locator("input").fill("x");
        await host.locator("input").press("Enter");
      },
    ],
    [
      "h6-switch",
      "",
      async (host) => {
        await host.click();
      },
    ],
  ]) {
    test(`${tag} change crosses an enclosing shadow root`, async ({ page }) => {
      await load(page, '<div id="outer"></div>');
      await page.evaluate(
        ([tag, inner]) => {
          window.changes = 0;
          document.addEventListener("change", () => {
            window.changes++;
          });
          const root = document.querySelector("#outer").attachShadow({ mode: "open" });
          root.innerHTML = `<${tag} aria-label="Field">${inner}</${tag}>`;
        },
        [tag, inner],
      );
      await act(page.locator(tag));
      await expect.poll(() => page.evaluate(() => window.changes)).toBe(1);
    });
  }

  test("only Toggle Group observes multiple", async ({ page }) => {
    await load(page, "<form></form>");
    const observes = (tag) =>
      page.evaluate((tag) => customElements.get(tag).observedAttributes.includes("multiple"), tag);
    expect(await observes("h6-radio-group")).toBe(false);
    expect(await observes("h6-toggle-group")).toBe(true);
  });

  for (const [lang, value] of [
    ["te", "2028-02-29"],
    ["ky", "2024-11-05"],
  ]) {
    test(`a ${lang} date survives an edit of its displayed text`, async ({ page }) => {
      await load(
        page,
        `<form><h6-date-picker aria-label="Date" name="date" value="${value}"></h6-date-picker></form>`,
        lang,
      );
      const input = page.locator("h6-date-picker input");
      await input.press("End");
      await input.pressSequentially(" ");
      await input.press("Backspace");
      expect(await entries(page)).toEqual([["date", value]]);
    });
  }
});

test("incompatible restoration state is ignored instead of throwing", async ({ page }) => {
  // Firefox restores state on reload and can hand a control a value it never saved.
  await load(page, "<form></form>");
  const failures = await page.evaluate(() => {
    const names = [
      "iban",
      "bic",
      "otp",
      "duration",
      "interval",
      "segmented",
      "tags",
      "switch",
      "toggle",
      "slider",
      "range-slider",
      "rating",
      "select",
      "combobox",
      "date-picker",
      "date-range-picker",
      "checkbox",
      "radio-group",
      "toggle-group",
      "number-input",
      "password-input",
    ];
    const form = document.forms[0];
    const result = [];
    for (const name of names) {
      const element = document.createElement(`h6-${name}`);
      form.append(element);
      for (const state of ["5400", "not a value", "{}", "[1]", '["a","b","c","d"]', "null", ""]) {
        try {
          element.formStateRestoreCallback(state);
        } catch (error) {
          result.push(`h6-${name} with ${state}: ${error.message}`);
        }
      }
    }
    return result;
  });
  expect(failures).toEqual([]);
});
