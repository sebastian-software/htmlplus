import { test, expect } from 'playwright/test';

const pageUrl = 'http://127.0.0.1:48164/contract';
const editors = [
  ['h6-iban', 'input'], ['h6-bic', 'input'], ['h6-otp', 'input'], ['h6-duration', 'input'],
  ['h6-password-input', 'input'], ['h6-number-input', 'input'], ['h6-interval', 'input'],
  ['h6-combobox', 'input'], ['h6-date-picker', 'input'], ['h6-date-range-picker', 'input'],
];

async function load(page, body, lang = 'en-US') {
  await page.route(pageUrl, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="${lang}"><body>${body}<script>window.submits = []; document.addEventListener('submit', event => { event.preventDefault(); submits.push(event.submitter?.name ?? null); });</script><script type="module" src="/dist/src/index.js"></script></body></html>`,
  }));
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get('h6-field'));
}
const submits = page => page.evaluate(() => window.submits);
const entries = page => page.evaluate(() => [...new FormData(document.forms[0])]);

test.describe('implicit submission', () => {
  for (const [tag, editor] of editors) {
    test(`Enter in ${tag} activates the default button`, async ({ page }) => {
      await load(page, `<form><label>Field <${tag} name="field"></${tag}></label><button name="go">Go</button></form>`);
      await page.locator(`${tag} ${editor}`).first().press('Enter');
      await expect.poll(() => submits(page)).toEqual(['go']);
    });
  }

  test('validation still blocks the submission and reveals the field', async ({ page }) => {
    await load(page, '<form><label>IBAN <h6-iban name="iban" required></h6-iban></label><button>Go</button></form>');
    const input = page.locator('h6-iban input');
    await input.press('Enter');
    await expect(page.locator('h6-iban')).toHaveAttribute('data-touched', '');
    expect(await submits(page)).toEqual([]);
  });

  test('change fires before submit, as with a native field', async ({ page }) => {
    await load(page, '<form><label>Duration <h6-duration name="duration"></h6-duration></label><button>Go</button></form>');
    await page.evaluate(() => { window.order = []; for (const type of ['change', 'submit']) document.addEventListener(type, () => order.push(type)); });
    const input = page.locator('h6-duration input');
    await input.fill('90m');
    await input.press('Enter');
    await expect.poll(() => page.evaluate(() => window.order)).toEqual(['change', 'submit']);
  });

  test('a disabled default button, preventDefault, and a second editor stop it like native forms', async ({ page }) => {
    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration><button disabled>Go</button></form>');
    await page.locator('h6-duration input').press('Enter');
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration><button>Go</button></form>');
    await page.evaluate(() => document.addEventListener('keypress', event => event.preventDefault()));
    await page.locator('h6-duration input').press('Enter');
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration><input aria-label="Other" name="b"></form>');
    await page.locator('h6-duration input').press('Enter');
    await page.waitForTimeout(50);
    expect(await submits(page)).toEqual([]);

    await load(page, '<form><h6-duration aria-label="Time" name="a"></h6-duration></form>');
    await page.locator('h6-duration input').press('Enter');
    await expect.poll(() => submits(page)).toEqual([null]);
  });

  test('Enter choosing a combobox option and Enter committing a tag do not submit', async ({ page }) => {
    await load(page, '<form><h6-combobox aria-label="Fruit" name="fruit"><option value="a">Apple</option></h6-combobox><h6-tags aria-label="Tags" name="tags"></h6-tags><button>Go</button></form>');
    const combo = page.locator('h6-combobox input');
    await combo.pressSequentially('App');
    await combo.press('ArrowDown');
    await combo.press('Enter');
    await page.waitForTimeout(50);
    expect(await entries(page)).toEqual([['fruit', 'a']]);
    expect(await submits(page)).toEqual([]);

    const tags = page.locator('h6-tags input');
    await tags.fill('html');
    await tags.press('Enter');
    await page.waitForTimeout(50);
    expect(await entries(page)).toEqual([['fruit', 'a'], ['tags', 'html']]);
    expect(await submits(page)).toEqual([]);
  });
});

test.describe('number input separators', () => {
  for (const [lang, text] of [['en-US', '1,234'], ['en-US', '1,5'], ['de-DE', '1.5'], ['de-DE', '1.234']]) {
    test(`${lang} keeps ${text} as an invalid draft`, async ({ page }) => {
      await load(page, '<form><h6-number-input aria-label="Amount" name="amount"></h6-number-input></form>', lang);
      const input = page.locator('h6-number-input input');
      await input.pressSequentially(text);
      await expect(page.locator('h6-number-input')).toHaveJSProperty('value', '');
      await input.blur();
      await expect(input).toHaveValue(text);
      expect(await page.locator('h6-number-input').evaluate(host => host.validity.badInput)).toBe(true);
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(false);
    });
  }

  test('localized decimals stay valid after blur', async ({ page }) => {
    await load(page, '<form><h6-number-input aria-label="Amount" name="amount" step="0.25"></h6-number-input></form>', 'de-DE');
    const input = page.locator('h6-number-input input');
    await input.pressSequentially('3,75');
    await input.blur();
    await expect(input).toHaveValue('3,75');
    expect(await entries(page)).toEqual([['amount', '3.75']]);
  });
});

test.describe('inherited language', () => {
  for (const lang of ['de_DE', 'x-foo']) {
    test(`an unusable lang="${lang}" keeps date fields working`, async ({ page }) => {
      await load(page, '<form><h6-date-picker aria-label="Date" name="date" value="2028-02-29"></h6-date-picker><h6-date-range-picker aria-label="Range" name="range" value=\'["2028-02-28","2028-03-02"]\'></h6-date-range-picker></form>', lang);
      expect(await page.evaluate(() => document.forms[0].checkValidity())).toBe(true);
      expect(await entries(page)).toEqual([['date', '2028-02-29'], ['range.start', '2028-02-28'], ['range.end', '2028-03-02']]);
      await expect(page.locator('h6-date-picker [part=trigger]')).toBeEnabled();
    });
  }

  test('the nearest usable ancestor language wins', async ({ page }) => {
    await load(page, '<form><div lang="de_DE"><h6-date-picker aria-label="Date" name="date" value="2028-02-29"></h6-date-picker></div></form>', 'de-DE');
    await expect(page.locator('h6-date-picker input')).toHaveValue('29.02.2028');
  });

  test('a disconnected element still reads the document language', async ({ page }) => {
    await load(page, '<form></form>', 'de-DE');
    expect(await page.evaluate(() => document.createElement('h6-date-picker').locale)).toBe('de-DE');
  });

  test('an invalid explicit locale remains a reported configuration error', async ({ page }) => {
    await load(page, '<form><h6-date-picker aria-label="Date" name="date" value="2028-02-29" locale="de_DE"></h6-date-picker></form>');
    expect(await page.locator('h6-date-picker').evaluate(host => host.validity.customError)).toBe(true);
  });
});

test('passwords stay out of session history while other fields are restored', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only Chromium restores form-associated state under Playwright navigation.');
  await page.route(pageUrl, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html lang="en-US"><body><form action="/next"><h6-password-input aria-label="Password" name="password"></h6-password-input><h6-duration aria-label="Time" name="time"></h6-duration><input aria-label="Native" type="password" name="native"></form><script type="module" src="/dist/src/index.js"></script></body></html>',
  }));
  await page.route('http://127.0.0.1:48164/next', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Next</title>' }));
  await page.goto(pageUrl);
  await page.waitForFunction(() => customElements.get('h6-field'));
  await page.locator('h6-password-input input').fill('s3cret');
  await page.locator('h6-duration input').fill('90m');
  await page.locator('input[name=native]').fill('s3cret');
  await page.goto('http://127.0.0.1:48164/next');
  await page.goBack();
  await page.waitForFunction(() => customElements.get('h6-field'));
  await expect(page.locator('h6-duration input')).toHaveValue('90m');
  await expect(page.locator('input[name=native]')).toHaveValue('');
  await expect(page.locator('h6-password-input input')).toHaveValue('');
  expect(await entries(page)).toEqual([['password', ''], ['time', '5400'], ['native', '']]);
});
