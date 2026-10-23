import { test, expect } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('All fields valid', { exact: true })).toBeVisible();
});

const data = (page) => page.evaluate(() => [...new FormData(document.querySelector('#demo-form'))]);

test('live data retains repeated keys and reflects tag editing without proxy inputs', async ({ page }) => {
  await expect(page.getByRole('cell', { name: 'topics', exact: true })).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Topics', exact: true }).fill('accessibility');
  await page.getByRole('textbox', { name: 'Topics', exact: true }).press('Enter');
  await expect(page.getByRole('cell', { name: 'topics', exact: true })).toHaveCount(3);
  expect((await data(page)).filter(([name]) => name === 'topics').map(([, value]) => value)).toEqual(['html', 'web-components', 'accessibility']);
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const json = JSON.parse(await page.getByLabel('Current form data as JSON').innerText());
  expect(json.topics).toEqual(['html', 'web-components', 'accessibility']);
  expect(json.code).toBe('004271');
  await expect(page.locator('input[type=hidden]')).toHaveCount(0);
});

test('native enhanced fields normalize, retain leading zeros, and block invalid submission', async ({ page }) => {
  await page.getByRole('textbox', { name: 'IBAN', exact: true }).fill('de89 3704 0044 0532 0130 00');
  await expect(page.getByRole('textbox', { name: 'IBAN', exact: true })).toHaveValue('de89 3704 0044 0532 0130 00');
  expect((await data(page)).find(([name]) => name === 'iban')?.[1]).toBe('DE89370400440532013000');
  await page.getByRole('textbox', { name: 'BIC / SWIFT', exact: true }).fill('deutdeff');
  await expect(page.getByRole('textbox', { name: 'BIC / SWIFT', exact: true })).toHaveValue('deutdeff');
  expect((await data(page)).find(([name]) => name === 'bic')?.[1]).toBe('DEUTDEFF');
  await page.getByRole('textbox', { name: 'Verification code', exact: true }).fill('001234');
  await page.getByRole('textbox', { name: 'IBAN', exact: true }).fill('DE89370400440532013001');
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByText('1 field needs attention', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText('Captured');
  await page.getByRole('textbox', { name: 'IBAN', exact: true }).fill('DE89370400440532013000');
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByRole('status')).toContainText('Captured 10 entries locally. Nothing was sent.');
  expect((await data(page)).find(([name]) => name === 'code')?.[1]).toBe('001234');
});

test('switch labels and keyboard activation follow checkbox submission and fieldset disabling', async ({ page }) => {
  const control = page.locator('h6-switch');
  await page.getByText('Product updates', { exact: true }).click();
  expect((await data(page)).some(([name]) => name === 'updates')).toBe(false);
  await control.focus();
  await control.press('Space');
  await expect(page.getByRole('cell', { name: 'email', exact: true })).toBeVisible();
  await page.getByLabel('Disable the fieldset').check();
  await expect(page.getByText('0 entries', { exact: true })).toBeVisible();
  await expect(page.getByText('Fields disabled', { exact: true })).toBeVisible();
  expect(await control.evaluate((element) => element.matches(':disabled'))).toBe(true);
  await control.evaluate((element) => element.click());
  expect(await control.evaluate((element) => element.checked)).toBe(true);
  await page.getByLabel('Disable the fieldset').uncheck();
  await expect(page.getByText('10 entries', { exact: true })).toBeVisible();
});

test('native reset restores initial text values, switch state, and tag defaults', async ({ page }) => {
  await page.getByRole('textbox', { name: 'IBAN', exact: true }).fill('NL91ABNA0417164300');
  await page.getByRole('button', { name: 'Remove html', exact: true }).click();
  await page.locator('h6-switch').click();
  await page.getByRole('button', { name: 'Reset form', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'IBAN', exact: true })).toHaveValue('DE89370400440532013000');
  await expect(page.getByRole('button', { name: 'Remove html', exact: true })).toBeVisible();
  expect((await data(page)).filter(([name]) => name === 'topics').map(([, value]) => value)).toEqual(['html', 'web-components']);
  expect((await data(page)).find(([name]) => name === 'updates')?.[1]).toBe('email');
  await expect(page.getByText('All fields valid', { exact: true })).toBeVisible();
});

test('required tags block submission and preserve deduplication and safe text rendering', async ({ page }) => {
  await page.getByRole('button', { name: 'Remove html', exact: true }).click();
  await page.getByRole('button', { name: 'Remove web-components', exact: true }).click();
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByText('1 field needs attention', { exact: true })).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Topics', exact: true });
  await input.fill('<script>example</script>');
  await input.press('Enter');
  await input.fill('<script>example</script>');
  await input.press('Enter');
  await expect(page.getByRole('cell', { name: 'topics', exact: true })).toHaveCount(1);
  expect((await data(page)).filter(([name]) => name === 'topics').map(([, value]) => value)).toEqual(['<script>example</script>']);
  await expect(page.getByText('All fields valid', { exact: true })).toBeVisible();
});

test('programmatic defaults and external form association keep native semantics', async ({ page }) => {
  const result = await page.evaluate(() => {
    const form = document.createElement('form'); form.id = 'external-form';
    const control = document.createElement('h6-switch');
    control.setAttribute('form', form.id); control.setAttribute('name', 'outside');
    document.body.append(form, control);
    control.checked = false;
    control.defaultChecked = true;
    const before = new FormData(form).has('outside');
    form.reset();
    const after = new FormData(form).get('outside');
    const tags = document.querySelector('h6-tags');
    tags.value = ['changed']; tags.defaultValue = ['new-default'];
    const current = tags.value;
    document.querySelector('#demo-form').reset();
    return { before, after, current, reset: tags.value };
  });
  expect(result).toEqual({ before: false, after: 'on', current: ['changed'], reset: ['new-default'] });
});

test('the mobile layout and alternate CSS theme preserve the same form values', async ({ page }) => {
  const before = await data(page);
  await page.screenshot({ path: test.info().outputPath('studio-desktop.png'), fullPage: true });
  await page.getByLabel('Appearance').selectOption('utility');
  expect(await data(page)).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('textbox', { name: 'IBAN', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live form data' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('utility-mobile.png'), fullPage: true });
});

test('custom errors persist until explicitly cleared and initialization can precede connection', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const iban = document.querySelector('h6-iban');
    const tags = document.querySelector('h6-tags');
    const toggle = document.querySelector('h6-switch');
    iban.setCustomValidity('Account needs review.');
    tags.setCustomValidity('Choose a different topic.');
    toggle.setCustomValidity('This preference needs review.');
    document.querySelector('#demo-form').reset();
    await Promise.resolve();
    const messages = [iban.validationMessage, tags.validationMessage, toggle.validationMessage];
    for (const control of [iban, tags, toggle]) control.setCustomValidity('');
    const detached = document.createElement('h6-iban');
    detached.value = 'nl91 abna 0417 1643 00';
    document.body.append(detached);
    return { messages, valid: [iban.checkValidity(), tags.checkValidity(), toggle.checkValidity()], initialized: detached.value };
  });
  expect(result).toEqual({ messages: ['Account needs review.', 'Choose a different topic.', 'This preference needs review.'], valid: [true, true, true], initialized: 'NL91ABNA0417164300' });
});

test('canonical serialization leaves native text editing and undo intact', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'IBAN', exact: true });
  await input.focus();
  await input.press('ControlOrMeta+A');
  await input.pressSequentially('de89');
  await expect(input).toHaveValue('de89');
  expect((await data(page)).find(([name]) => name === 'iban')?.[1]).toBe('DE89');
  // Browsers group keystrokes differently; all four native edits must remain undoable.
  for (let edit = 0; edit < 4 && await input.inputValue() !== 'DE89370400440532013000'; edit++) {
    await input.press('ControlOrMeta+Z');
  }
  await expect(input).toHaveValue('DE89370400440532013000');
});
