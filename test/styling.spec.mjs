import { test, expect } from 'playwright/test';

test('every element has two working previews, matching form values, and its own CSS', async ({ page }) => {
  await page.goto('/styling.html');
  const navigation = page.getByRole('navigation', { name: 'Components' });
  const names = ['IBAN', 'BIC / SWIFT', 'Verification code', 'Duration', 'Numeric interval', 'Tags', 'Switch', 'Segmented choice', 'Toggle', 'Accordion', 'Tabs'];
  await expect(navigation.getByRole('link')).toHaveCount(names.length);
  for (const name of names) {
    await navigation.getByRole('link', { name, exact: true }).click();
    await expect(page.locator('#recipe-heading')).toHaveText(name);
    await expect(page.locator('.recipe-preview form')).toHaveCount(2);
    const values = await page.locator('.recipe-preview form').evaluateAll((forms) => forms.map((form) => [...new FormData(form)]));
    expect(values[0]).toEqual(values[1]);
    expect(values[0].length).toBeGreaterThan(0);
    expect(await page.locator('#recipe-code').innerText()).toContain('::part(');
    await expect(navigation.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
  }
});

test('deep links expose copyable HTML, actual preview CSS, and the shared base stylesheet', async ({ page, request }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedRecipe = text; } } }));
  await page.goto('/styling.html#h6-duration');
  await expect(page.locator('#recipe-heading')).toHaveText('Duration');
  await page.getByRole('button', { name: 'Copy CSS', exact: true }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copied to clipboard.');
  expect(await page.evaluate(() => window.copiedRecipe)).toBe(await page.locator('#recipe-code').innerText());
  expect(await page.evaluate(() => [...document.querySelectorAll('style')].some((style) => style.textContent === window.copiedRecipe))).toBe(true);
  await page.getByRole('button', { name: 'HTML', exact: true }).click();
  await expect(page.locator('#recipe-code')).toContainText('<form>');
  await expect(page.locator('#recipe-code')).toContainText('class="duration-tabular"');
  await page.getByRole('button', { name: 'Theme CSS', exact: true }).click();
  await expect(page.locator('#recipe-code')).toContainText('--h6-accent: var(--primary)');
  const response = await request.get('/demo/base.css');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toBe(await page.locator('#recipe-code').textContent());
});

test('copy failure leaves selectable source and a useful status', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.goto('/styling.html#h6-tags');
  await page.getByRole('button', { name: 'Copy CSS', exact: true }).click();
  await expect(page.locator('#copy-status')).toHaveText('Copy unavailable. Select and copy the code above.');
  await expect(page.locator('#recipe-code')).toContainText('h6-tags.tags-outlined::part(tag)');
});

test('selected option styling follows keyboard selection without changing the value contract', async ({ page }) => {
  await page.goto('/styling.html#h6-segmented');
  const variant = page.getByRole('region', { name: 'Outlined choices preview', exact: true });
  await variant.getByRole('radio', { name: 'Standard', exact: true }).focus();
  await variant.getByRole('radio', { name: 'Standard', exact: true }).press('ArrowRight');
  await expect(variant.getByRole('radio', { name: 'Express', exact: true })).toBeChecked();
  await expect(variant.locator('[part~=selected-option]')).toHaveCount(1);
  await expect(variant.locator('[part~=selected-option]')).toHaveText('Express');
  await expect(variant.getByLabel('Outlined choices form data')).toContainText('express');
  const color = await variant.locator('[part~=selected-option]').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(color).toBe('rgb(23, 23, 23)');
  expect(await variant.locator('[part~=selected-option]').evaluate((element) => getComputedStyle(element).display)).toBe('flex');
});

test('neutral defaults, focus, and recipe layout work on desktop and mobile', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.primary-button').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(23, 23, 23)');
  const before = await page.locator('#demo-form').evaluate((form) => [...new FormData(form)]);
  await page.getByRole('link', { name: 'Style h6-tags', exact: true }).click();
  await expect(page.locator('#recipe-heading')).toHaveText('Tags');
  await page.screenshot({ path: test.info().outputPath('styling-desktop.png'), fullPage: true });
  await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'IBAN', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Bank account', exact: true }).first();
  await input.focus();
  expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('styling-mobile.png'), fullPage: true });
  await page.getByRole('link', { name: 'Form playground' }).click();
  await expect(page.getByText('14 entries', { exact: true })).toBeVisible();
  expect(await page.locator('#demo-form').evaluate((form) => [...new FormData(form)])).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
