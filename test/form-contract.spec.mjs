import { test, expect } from "playwright/test";

const pageUrl = "http://127.0.0.1:48164/contract";
const editors = [
  ["hplus-iban", "input"],
  ["hplus-bic", "input"],
  ["hplus-otp", "input"],
  ["hplus-duration", "input"],
  ["hplus-password-input", "input"],
  ["hplus-number-input", "input"],
  ["hplus-interval", "input"],
  ["hplus-combobox", "input"],
  ["hplus-date-picker", "input"],
  ["hplus-date-range-picker", "input"],
];

async function load(page, body, lang = "en-US") {
  await page.route(pageUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="${lang}"><body>${body}<script>window.submits = []; document.addEventListener('submit', event => { event.preventDefault(); submits.push(event.submitter?.name ?? null); });</script><script type="module" src="/dist/src/index.js"></script></body></html>`,
    }),
  );
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get("hplus-field"));
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
    await load(
      page,
      '<form><label>IBAN <hplus-iban name="iban" required></hplus-iban></label><button>Go</button></form>',
    );
    const input = page.locator("hplus-iban input");
    await input.press("Enter");
    await expect(page.locator("hplus-iban")).toHaveAttribute("data-touched", "");
    expect(await submits(page)).toEqual([]);
  });

  test("change fires before submit, as with a native field", async ({ page }) => {
    await load(
      page,
      '<form><label>Duration <hplus-duration name="duration"></hplus-duration></label><button>Go</button></form>',
    );
    await page.evaluate(() => {
      window.order = [];
      for (const type of ["change", "submit"]) document.addEventListener(type, () => order.push(type));
    });
    const input = page.locator("hplus-duration input");
    await input.fill("90m");
    await input.press("Enter");
    await expect.poll(() => page.evaluate(() => window.order)).toEqual(["change", "submit"]);
  });

  test("a disabled default button, preventDefault, and a second editor stop it like native forms", async ({ page }) => {
    await load(
      page,
      '<form><hplus-duration aria-label="Time" name="a"></hplus-duration><button disabled>Go</button></form>',
    );
    await page.locator("hplus-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><hplus-duration aria-label="Time" name="a"></hplus-duration><button>Go</button></form>');
    await page.evaluate(() => document.addEventListener("keypress", (event) => event.preventDefault()));
    await page.locator("hplus-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(
      page,
      '<form><hplus-duration aria-label="Time" name="a"></hplus-duration><input aria-label="Other" name="b"></form>',
    );
    await page.locator("hplus-duration input").press("Enter");
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><hplus-duration aria-label="Time" name="a"></hplus-duration></form>');
    await page.locator("hplus-duration input").press("Enter");
    await expect.poll(() => submits(page)).toEqual([null]);
  });

  test("Enter choosing a combobox option and Enter committing a tag do not submit", async ({ page }) => {
    await load(
      page,
      '<form><hplus-combobox aria-label="Fruit" name="fruit"><option value="a">Apple</option></hplus-combobox><hplus-tags aria-label="Tags" name="tags"></hplus-tags><button>Go</button></form>',
    );
    const combo = page.locator("hplus-combobox input");
    await combo.pressSequentially("App");
    await combo.press("ArrowDown");
    await combo.press("Enter");
    await page.waitForTimeout(50);
    expect(await entries(page)).toEqual([["fruit", "a"]]);
    expect(await submits(page)).toEqual([]);

    const tags = page.locator("hplus-tags input");
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
      await load(
        page,
        '<form><hplus-number-input aria-label="Amount" name="amount"></hplus-number-input></form>',
        lang,
      );
      const input = page.locator("hplus-number-input input");
      await input.pressSequentially(text);
      await expect(page.locator("hplus-number-input")).toHaveJSProperty("value", "");
      await input.blur();
      await expect(input).toHaveValue(text);
      expect(await page.locator("hplus-number-input").evaluate((host) => host.validity.badInput)).toBe(true);
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(false);
    });
  }

  test("localized decimals stay valid after blur", async ({ page }) => {
    await load(
      page,
      '<form><hplus-number-input aria-label="Amount" name="amount" step="0.25"></hplus-number-input></form>',
      "de-DE",
    );
    const input = page.locator("hplus-number-input input");
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
        '<form><hplus-date-picker aria-label="Date" name="date" value="2028-02-29"></hplus-date-picker><hplus-date-range-picker aria-label="Range" name="range" value=\'["2028-02-28","2028-03-02"]\'></hplus-date-range-picker></form>',
        lang,
      );
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(true);
      expect(await entries(page)).toEqual([
        ["date", "2028-02-29"],
        ["range.start", "2028-02-28"],
        ["range.end", "2028-03-02"],
      ]);
      await expect(page.locator("hplus-date-picker [part=trigger]")).toBeEnabled();
    });
  }

  test("the nearest usable ancestor language wins", async ({ page }) => {
    await load(
      page,
      '<form><div lang="de_DE"><hplus-date-picker aria-label="Date" name="date" value="2028-02-29"></hplus-date-picker></div></form>',
      "de-DE",
    );
    await expect(page.locator("hplus-date-picker input")).toHaveValue("29.02.2028");
  });

  test("a disconnected element still reads the document language", async ({ page }) => {
    await load(page, "<form></form>", "de-DE");
    expect(await page.evaluate(() => document.createElement("hplus-date-picker").locale)).toBe("de-DE");
  });

  test("an invalid explicit locale remains a reported configuration error", async ({ page }) => {
    await load(
      page,
      '<form><hplus-date-picker aria-label="Date" name="date" value="2028-02-29" locale="de_DE"></hplus-date-picker></form>',
    );
    expect(await page.locator("hplus-date-picker").evaluate((host) => host.validity.customError)).toBe(true);
  });
});

test("passwords stay out of session history while other fields are restored", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Only Chromium restores form-associated state under Playwright navigation.");
  await page.route(pageUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en-US"><body><form action="/next"><hplus-password-input aria-label="Password" name="password"></hplus-password-input><hplus-duration aria-label="Time" name="time"></hplus-duration><input aria-label="Native" type="password" name="native"></form><script type="module" src="/dist/src/index.js"></script></body></html>',
    }),
  );
  await page.route("http://127.0.0.1:48164/next", (route) =>
    route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Next</title>" }),
  );
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get("hplus-field"));
  await page.locator("hplus-password-input input").fill("s3cret");
  await page.locator("hplus-duration input").fill("90m");
  await page.locator("input[name=native]").fill("s3cret");
  await page.goto("http://127.0.0.1:48164/next");
  await page.goBack();
  await page.waitForFunction(() => customElements.get("hplus-field"));
  await expect(page.locator("hplus-duration input")).toHaveValue("90m");
  await expect(page.locator("input[name=native]")).toHaveValue("");
  await expect(page.locator("hplus-password-input input")).toHaveValue("");
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
    ["hplus-iban", "", "'DE89370400440532013000'", [["field", "DE89370400440532013000"]]],
    ["hplus-number-input", "", "5", [["field", "5"]]],
    ["hplus-select", fruit, "'b'", [["field", "b"]]],
    ["hplus-combobox", fruit, "'b'", [["field", "b"]]],
    ["hplus-radio-group", fruit, "'b'", [["field", "b"]]],
    ["hplus-segmented", fruit, "'b'", [["field", "b"]]],
    ["hplus-toggle-group", fruit, "['b']", [["field", "b"]]],
    ["hplus-tags", "", "['x']", [["field", "x"]]],
    ["hplus-date-picker", "", "'2028-02-29'", [["field", "2028-02-29"]]],
    ["hplus-rating", "", "3", [["field", "3"]]],
    ["hplus-slider", "", "7", [["field", "7"]]],
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
      `<form><hplus-switch id="a" name="a"></hplus-switch><hplus-toggle id="b" name="b"></hplus-toggle><hplus-checkbox id="c" name="c"></hplus-checkbox><hplus-iban id="d" name="d"></hplus-iban><hplus-select id="e" name="e">${fruit}</hplus-select></form>
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
    ["hplus-select", "combobox"],
    ["hplus-combobox", "combobox"],
    ["hplus-radio-group", "radiogroup"],
  ]) {
    test(`a wrapping label excludes ${tag} option text`, async ({ page }) => {
      await load(page, `<form><label>Fruit <${tag} name="field">${fruit}</${tag}></label></form>`);
      await expect(page.getByRole(role, { name: "Fruit", exact: true })).toHaveCount(1);
    });
  }

  for (const [tag, role, inner] of [
    ["hplus-iban", "textbox", ""],
    ["hplus-tags", "textbox", ""],
    ["hplus-select", "combobox", fruit],
    ["hplus-number-input", "spinbutton", ""],
    ["hplus-slider", "slider", ""],
    ["hplus-toggle", "button", ""],
    ["hplus-checkbox", "checkbox", ""],
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
    await load(page, '<div id="elsewhere"></div><form><hplus-iban id="control" name="field"></hplus-iban></form>');
    await page.locator("#elsewhere").evaluate((node) => {
      node.innerHTML = '<label for="control">Account</label>';
    });
    await page.locator("hplus-iban input").focus();
    await expect(page.getByRole("textbox", { name: "Account", exact: true })).toBeFocused();
  });

  test("Tags, Interval, and text fields honor references, including late ones", async ({ page }) => {
    await load(
      page,
      '<form><span id="name">Named</span><span id="help">Helpful</span><hplus-tags aria-labelledby="name" aria-describedby="help" name="tags"></hplus-tags><hplus-interval aria-labelledby="name" aria-describedby="help" name="range"></hplus-interval><hplus-iban id="late" name="iban"></hplus-iban></form>',
    );
    await expect(page.locator("hplus-tags input")).toHaveAttribute("aria-label", "Named");
    await expect(page.locator("hplus-tags input")).toHaveAttribute("aria-description", "Helpful");
    await expect(page.locator("hplus-interval input").first()).toHaveAttribute("aria-label", "Named: From");
    await expect(page.locator("hplus-interval input").first()).toHaveAttribute("aria-description", "Helpful");
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
    await expect(page.locator("hplus-tags input")).toHaveAttribute("aria-label", "Renamed");
  });
});

test.describe('step="any"', () => {
  test("Number Input has no step constraint and steps by one", async ({ page }) => {
    await load(
      page,
      '<form><hplus-number-input aria-label="Amount" name="amount" step="any"></hplus-number-input></form>',
    );
    const input = page.locator("hplus-number-input input");
    await input.pressSequentially("1.5");
    await input.blur();
    expect(await page.locator("hplus-number-input").evaluate((host) => [host.validity.valid, host.step])).toEqual([
      true,
      1,
    ]);
    expect(await entries(page)).toEqual([["amount", "1.5"]]);
    await input.press("ArrowUp");
    expect(await entries(page)).toEqual([["amount", "2.5"]]);
  });

  test("Slider keeps an unsnapped value and steps by one", async ({ page }) => {
    await load(
      page,
      '<form><hplus-slider aria-label="Level" name="level" step="any" value="1.5"></hplus-slider></form>',
    );
    expect(await page.locator("hplus-slider").evaluate((host) => [host.validity.valid, host.value, host.step])).toEqual(
      [true, 1.5, 1],
    );
    expect(await entries(page)).toEqual([["level", "1.5"]]);
    await page.locator("hplus-slider").evaluate((host) => {
      host.value = 2;
    });
    await page.getByRole("slider").press("ArrowRight");
    expect(await entries(page)).toEqual([["level", "3"]]);
  });
});

test.describe("invalid presentation waits until touched", () => {
  const required = [
    ["hplus-iban", ""],
    ["hplus-number-input", ""],
    ["hplus-password-input", ""],
    ["hplus-interval", ""],
    ["hplus-tags", ""],
    ["hplus-select", fruit],
    ["hplus-combobox", fruit],
    ["hplus-date-picker", ""],
    ["hplus-date-range-picker", ""],
    ["hplus-toggle", ""],
    ["hplus-checkbox", ""],
    ["hplus-radio-group", fruit],
    ["hplus-toggle-group", fruit],
    ["hplus-rating", ""],
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
      '<form><hplus-interval aria-label="Range" name="range" required></hplus-interval><hplus-tags aria-label="Tags" name="tags" required></hplus-tags><button>Go</button></form>',
    );
    await page.locator("hplus-interval input").first().focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("hplus-interval input").nth(1)).toBeFocused();
    expect(await isDisplayed(page, "hplus-interval")).toBe(false);
    await page.keyboard.press("Tab");
    await expect.poll(() => isDisplayed(page, "hplus-interval")).toBe(true);
    expect(await isDisplayed(page, "hplus-tags")).toBe(false);
    await page.keyboard.press("Tab");
    await expect.poll(() => isDisplayed(page, "hplus-tags")).toBe(true);
    await expect(page.locator("hplus-tags")).toHaveAttribute("data-touched", "");
  });

  for (const [tag, part, property] of [
    ["hplus-switch", "[part=track]", "borderTopColor"],
    ["hplus-toggle", "button", "borderTopColor"],
    ["hplus-rating", "[part=control]", "outlineStyle"],
    ["hplus-tags", "[part=control]", "borderTopColor"],
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
  for (const tag of ["hplus-select", "hplus-combobox", "hplus-radio-group", "hplus-segmented", "hplus-toggle-group"]) {
    const assign = (host, value) => {
      host.value = host.localName === "hplus-toggle-group" ? [value] : value;
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
      `<form><hplus-iban id="iban"></hplus-iban><hplus-duration id="duration"></hplus-duration><hplus-number-input id="number"></hplus-number-input><hplus-date-picker id="date" value="2028-02-29"></hplus-date-picker><hplus-select id="select">${fruit}</hplus-select><hplus-segmented id="segmented">${fruit}</hplus-segmented><hplus-radio-group id="radio">${fruit}</hplus-radio-group></form>`,
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
      '<form><hplus-duration id="low" min="60" value="30"></hplus-duration><hplus-duration id="high" max="60" value="90"></hplus-duration><hplus-duration id="empty" min="" max="" value="90"></hplus-duration><hplus-duration id="bad" value="soon"></hplus-duration></form>',
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
    ["hplus-iban", "DE89370400440532013001", /check digits/],
    ["hplus-bic", "DEUT12FF", /two-letter country code/],
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
    await load(page, '<form><hplus-iban aria-label="IBAN" name="iban" maxlength="22"></hplus-iban></form>');
    const input = page.locator("hplus-iban input");
    await input.pressSequentially("DE8937040044053201300099");
    await expect(input).toHaveValue("DE89 3704 0044 0532 0130 00");
    expect(await entries(page)).toEqual([["iban", "DE89370400440532013000"]]);
    expect(await page.locator("hplus-iban").evaluate((host) => host.validity.valid)).toBe(true);
  });

  test("Number Input steppers control the actual editor", async ({ page }) => {
    await load(page, '<form><hplus-number-input aria-label="Amount"></hplus-number-input></form>');
    const resolved = await page
      .locator("hplus-number-input")
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
      '<form><div id="context"><hplus-slider aria-label="Level" name="level" value="5"></hplus-slider></div></form>',
    );
    await page.locator("#context").evaluate((node) => {
      node.dir = "rtl";
    });
    await expect(page.locator("hplus-slider [part=root]")).toHaveAttribute("dir", "rtl");
    await page.getByRole("slider").press("ArrowRight");
    expect(await entries(page)).toEqual([["level", "4"]]);
  });

  test("visibilitychange stays on the Password Input host", async ({ page }) => {
    await load(page, '<form><hplus-password-input aria-label="Password" name="secret"></hplus-password-input></form>');
    await page.evaluate(() => {
      window.seen = [];
      document.addEventListener("visibilitychange", () => seen.push("document"));
      document
        .querySelector("hplus-password-input")
        .addEventListener("visibilitychange", (event) => seen.push(event.detail.visible));
    });
    await page.getByRole("button", { name: "Show password" }).click();
    await expect.poll(() => page.evaluate(() => window.seen)).toEqual([true]);
  });

  for (const [tag, inner, act] of [
    [
      "hplus-iban",
      "",
      async (host) => {
        await host.locator("input").fill("DE");
        await host.locator("input").blur();
      },
    ],
    [
      "hplus-interval",
      "",
      async (host) => {
        await host.locator("input").first().fill("1");
        await host.locator("input").first().blur();
      },
    ],
    [
      "hplus-segmented",
      fruit,
      async (host) => {
        await host.locator("[part=option]", { hasText: "Banana" }).click();
      },
    ],
    [
      "hplus-tags",
      "",
      async (host) => {
        await host.locator("input").fill("x");
        await host.locator("input").press("Enter");
      },
    ],
    [
      "hplus-switch",
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
    expect(await observes("hplus-radio-group")).toBe(false);
    expect(await observes("hplus-toggle-group")).toBe(true);
  });

  for (const [lang, value] of [
    ["te", "2028-02-29"],
    ["ky", "2024-11-05"],
  ]) {
    test(`a ${lang} date survives an edit of its displayed text`, async ({ page }) => {
      await load(
        page,
        `<form><hplus-date-picker aria-label="Date" name="date" value="${value}"></hplus-date-picker></form>`,
        lang,
      );
      const input = page.locator("hplus-date-picker input");
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
      const element = document.createElement(`hplus-${name}`);
      form.append(element);
      for (const state of ["5400", "not a value", "{}", "[1]", '["a","b","c","d"]', "null", ""]) {
        try {
          element.formStateRestoreCallback(state);
        } catch (error) {
          result.push(`hplus-${name} with ${state}: ${error.message}`);
        }
      }
    }
    return result;
  });
  expect(failures).toEqual([]);
});
