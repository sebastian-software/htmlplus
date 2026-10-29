import { test, expect } from 'playwright/test';

const bareMarkup = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/dist/src/index.js"></script></head><body>
<form id="bare-form">
<label for="bare-iban">IBAN</label><h6-iban id="bare-iban" name="iban" value="DE89370400440532013000"></h6-iban>
<label for="bare-bic">BIC</label><h6-bic id="bare-bic" name="bic" value="COBADEFFXXX"></h6-bic>
<label for="bare-otp">Code</label><h6-otp id="bare-otp" name="code" value="004271"></h6-otp>
<label for="bare-duration">Duration</label><h6-duration id="bare-duration" name="duration" value="1h 30m"></h6-duration>
<label for="bare-interval">Budget</label><h6-interval id="bare-interval" name="budget" value="[200,800]"></h6-interval>
<label for="bare-tags">Topics</label><h6-tags id="bare-tags" name="topics" value='["Ag","gyp","HTML"]'></h6-tags>
<label for="bare-segmented">Delivery</label><h6-segmented id="bare-segmented" name="delivery" value="standard"><option value="economy">Economy</option><option value="standard">Standard</option></h6-segmented>
<label for="bare-switch">Updates</label><h6-switch id="bare-switch" name="updates" checked></h6-switch>
</form></body></html>`;

test.beforeEach(async ({ page }) => {
  await page.route('**/bare-controls', (route) => route.fulfill({ contentType: 'text/html', body: bareMarkup }));
  await page.goto('/bare-controls');
  await page.waitForFunction(() => customElements.get('h6-tags') && document.querySelector('h6-tags').shadowRoot);
});

test('all elements provide their base typography and sizes without a document stylesheet', async ({ page }) => {
  expect(await page.evaluate(() => document.querySelectorAll('link[rel=stylesheet], style, .hp-shadcn').length)).toBe(0);
  const editors = page.locator('h6-iban input, h6-bic input, h6-duration input, h6-interval input');
  for (const editor of await editors.all()) {
    const metrics = await editor.evaluate((element) => { const css = getComputedStyle(element); return { fontSize: css.fontSize, lineHeight: css.lineHeight, height: element.getBoundingClientRect().height }; });
    expect(metrics).toEqual({ fontSize: '14px', lineHeight: '20px', height: 40 });
  }
  for (const selector of ['h6-tags [part=control]', 'h6-segmented [part=control]']) expect(await page.locator(selector).evaluate((element) => element.getBoundingClientRect().height)).toBe(40);
  expect(await page.locator('h6-switch [part=track]').evaluate((element) => element.getBoundingClientRect().height)).toBe(24);
});

test('tag text, SVG, and native editor align and the remove button stays operable', async ({ page }) => {
  const metrics = await page.locator('h6-tags [part=tag]').first().evaluate((tag) => {
    const label = tag.querySelector('[part=tag-label]'); const button = tag.querySelector('button'); const icon = button.querySelector('svg');
    const center = (element) => { const box = element.getBoundingClientRect(); return box.y + box.height / 2; };
    const css = getComputedStyle(label);
    return { labelCenter: center(label), buttonCenter: center(button), iconCenter: center(icon), buttonWidth: button.getBoundingClientRect().width, iconWidth: icon.getBoundingClientRect().width, fontSize: css.fontSize, lineHeight: css.lineHeight, hidden: icon.getAttribute('aria-hidden') };
  });
  expect(Math.abs(metrics.labelCenter - metrics.iconCenter)).toBeLessThan(0.5);
  expect(Math.abs(metrics.buttonCenter - metrics.iconCenter)).toBeLessThan(0.5);
  expect(metrics).toMatchObject({ buttonWidth: 24, iconWidth: 12, fontSize: '12px', lineHeight: '16px', hidden: 'true' });
  await page.getByRole('button', { name: 'Remove gyp', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect(await page.locator('h6-tags').evaluate((element) => element.value)).toEqual(['Ag', 'HTML']);
  await expect(page.getByRole('textbox', { name: 'Topics', exact: true })).toBeFocused();
});

test('default tags wrap long content and scale at 200 percent text size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    document.querySelector('h6-tags').value = ['accessibility-with-a-very-long-label-and-no-spaces', '日本語', 'Ag'];
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const button = page.getByRole('button', { name: 'Remove Ag', exact: true });
  await expect(button).toHaveCSS('width', '48px');
  await expect(button).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('built-in-tags-mobile-200.png'), fullPage: true });
});

test('public tokens and parts override the built-in base without an adapter class', async ({ page }) => {
  await page.addStyleTag({ content: 'h6-iban { --hp-control-height: 3rem; --hp-font-size: 1rem; --hp-radius: 0; } h6-tags::part(remove-icon) { width: 1rem; height: 1rem; stroke-width: 3; }' });
  expect(await page.locator('h6-iban input').evaluate((input) => { const css = getComputedStyle(input); return { height: css.height, fontSize: css.fontSize, radius: css.borderRadius }; })).toEqual({ height: '48px', fontSize: '16px', radius: '0px' });
  expect(await page.locator('h6-tags [part=remove-icon]').first().evaluate((icon) => getComputedStyle(icon).width)).toBe('16px');
  expect(await page.locator('#bare-form').evaluate((form) => new FormData(form).get('iban'))).toBe('DE89370400440532013000');
});
