import { test, expect } from 'playwright/test';

const data = (page) => page.evaluate(() => [...new FormData(document.querySelector('#demo-form'))]);
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('21 entries', { exact: true })).toBeVisible();
});

test('duration preserves native notation while validating and submitting seconds', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Session duration', exact: true });
  await input.fill('01:30');
  await expect(input).toHaveValue('01:30');
  expect((await data(page)).find(([key]) => key === 'duration')?.[1]).toBe('5400');
  await input.fill('1.5h');
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByText('1 field needs attention', { exact: true })).toBeVisible();
  await input.fill('30s');
  expect(await page.locator('h6-duration').evaluate((field) => field.checkValidity())).toBe(false);
  await input.fill('90m');
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByRole('status')).toContainText('Captured 21 entries');
});

test('interval submits two explicit names and validates order, step, and missing boundaries', async ({ page }) => {
  const lower = page.getByRole('spinbutton', { name: 'Budget range (USD): From', exact: true });
  const upper = page.getByRole('spinbutton', { name: 'Budget range (USD): To', exact: true });
  await lower.fill('900');
  await upper.fill('800');
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByText('The lower boundary must not exceed the upper boundary.', { exact: true })).toBeVisible();
  await upper.fill('950');
  expect((await data(page)).filter(([key]) => key.startsWith('budget'))).toEqual([['budget_min', '900'], ['budget_max', '950']]);
  await upper.fill('951');
  expect(await page.locator('h6-interval').evaluate((field) => field.validity.stepMismatch)).toBe(true);
  await upper.fill('');
  expect(await page.locator('h6-interval').evaluate((field) => field.validity.valueMissing)).toBe(true);
  await page.locator('h6-interval').evaluate((field) => { field.required = false; });
  expect(await page.locator('h6-interval').evaluate((field) => field.checkValidity())).toBe(true);
  expect((await data(page)).filter(([key]) => key.startsWith('budget'))).toEqual([['budget_min', '900']]);
});

test('segmented choices use native radio keys and submit identifiers exactly once', async ({ page }) => {
  const standard = page.getByRole('radio', { name: 'Standard', exact: true });
  await page.getByText('Delivery speed', { exact: true }).click();
  await expect(standard).toBeFocused();
  await standard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Express', exact: true })).toBeChecked();
  expect((await data(page)).filter(([key]) => key === 'delivery')).toEqual([['delivery', 'express']]);
  await page.locator('h6-segmented').evaluate((field) => { field.value = ''; });
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByText('1 field needs attention', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Economy', exact: true }).check();
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByRole('status')).toContainText('Captured 21 entries');
});

test('extended fields reset, disable, restore state, and retain explicit errors', async ({ page }) => {
  const defaults = await data(page);
  const result = await page.evaluate(() => {
    const controls = ['h6-duration', 'h6-interval', 'h6-segmented'].map((name) => document.querySelector(name));
    controls[0].value = '5m'; controls[1].value = [100, 150]; controls[2].value = 'economy';
    for (const control of controls) control.setCustomValidity('Review this value.');
    document.querySelector('#demo-form').reset();
    const errors = controls.map((control) => control.validationMessage);
    for (const control of controls) control.setCustomValidity('');
    return errors;
  });
  expect(result).toEqual(['Review this value.', 'Review this value.', 'Review this value.']);
  expect(await data(page)).toEqual(defaults);
  await page.getByLabel('Disable the fieldset').check();
  await expect(page.getByRole('radio', { name: 'Standard', exact: true })).toBeDisabled();
  await expect(page.getByRole('spinbutton').first()).toBeDisabled();
  expect(await data(page)).toEqual([]);
  await page.getByLabel('Disable the fieldset').uncheck();
  const restored = await page.evaluate(() => {
    const duration = document.querySelector('h6-duration'); duration.formStateRestoreCallback('2h 5m');
    const interval = document.querySelector('h6-interval'); interval.formStateRestoreCallback('["400","600"]');
    const segmented = document.querySelector('h6-segmented'); segmented.formStateRestoreCallback('express');
    return [duration.value, duration.displayValue, interval.value, segmented.value];
  });
  expect(restored).toEqual(['7500', '2h 5m', [400, 600], 'express']);
});

test('option updates remain safe and programmatic assignment emits no user events', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const control = document.querySelector('h6-segmented');
    const counts = { input: 0, change: 0 };
    for (const type of ['input', 'change']) control.addEventListener(type, () => counts[type]++);
    control.value = 'express';
    const option = document.createElement('option'); option.value = 'custom'; option.textContent = '<b>Custom</b>';
    control.append(option);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    control.value = 'custom';
    return { counts, selected: new FormData(document.querySelector('#demo-form')).getAll('delivery') };
  });
  expect(result).toEqual({ counts: { input: 0, change: 0 }, selected: ['custom'] });
  await expect(page.getByRole('radio', { name: '<b>Custom</b>', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Economy', exact: true }).check();
  expect((await data(page)).filter(([key]) => key === 'delivery')).toEqual([['delivery', 'economy']]);
});
