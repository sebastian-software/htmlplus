import { test, expect } from 'playwright/test';

test('the exported Pages artifact works under a repository subpath', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:48165/htmlplus/');
  await expect(page.getByText('All fields valid', { exact: true })).toBeVisible();
  await expect(page.getByText('10 entries', { exact: true })).toBeVisible();
  expect(await page.locator('h6-interval').evaluate((control) => control.value)).toEqual([200, 800]);
  expect(await page.locator('.inspector').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await page.getByRole('link', { name: 'html plus home' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:48165/htmlplus/');
  expect((await request.get('http://127.0.0.1:48165/htmlplus/package.json')).status()).toBe(404);
  await page.getByRole('link', { name: 'Style h6-switch', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:48165/htmlplus/styling.html#h6-switch');
  await expect(page.locator('#recipe-heading')).toHaveText('Switch');
  await page.getByRole('button', { name: 'Theme CSS', exact: true }).click();
  await expect(page.locator('#recipe-code')).toContainText('--h6-accent: var(--primary)');
  expect(errors).toEqual([]);
});
