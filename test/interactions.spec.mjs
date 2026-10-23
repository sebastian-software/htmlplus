import { test, expect } from 'playwright/test';

const data = (page) => page.locator('#demo-form').evaluate((form) => [...new FormData(form)]);
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('18 entries', { exact: true })).toBeVisible();
});

test('toggle uses a native pressed button and submits one value with one user event pair', async ({ page }) => {
  const toggle = page.locator('#priority-field');
  const button = toggle.getByRole('button', { name: 'Priority handling', exact: true });
  await toggle.evaluate((host) => { window.toggleEvents = []; for (const type of ['input', 'change']) host.addEventListener(type, (event) => window.toggleEvents.push([event.type, event.target === host])); });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect((await data(page)).filter(([key]) => key === 'priority')).toEqual([['priority', 'yes']]);
  expect(await page.evaluate(() => window.toggleEvents)).toEqual([['input', true], ['change', true]]);
  await expect(page.getByRole('status')).toHaveText('Sample values stay in this browser.');
  await button.press('Space');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await toggle.evaluate((host) => { window.toggleEvents = []; host.pressed = false; host.value = 'rush'; });
  expect(await page.evaluate(() => window.toggleEvents)).toEqual([]);
  await page.getByLabel('Disable the fieldset').check();
  await expect(button).toBeDisabled();
  await toggle.evaluate((host) => host.click());
  expect(await page.evaluate(() => window.toggleEvents)).toEqual([]);
  await page.getByLabel('Disable the fieldset').uncheck();
  await button.click();
  expect((await data(page)).filter(([key]) => key === 'priority')).toEqual([['priority', 'rush']]);
  await page.getByRole('button', { name: 'Reset form', exact: true }).click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect((await data(page)).some(([key]) => key === 'priority')).toBe(false);
});

test('toggle retains defaults, custom errors, external labels, form association, and lifecycle', async ({ page }) => {
  await page.evaluate(() => {
    const form = document.createElement('form'); form.id = 'toggle-form';
    const label = document.createElement('label'); label.htmlFor = 'contract-toggle'; label.textContent = 'Pin item';
    const host = document.createElement('h6-toggle'); host.id = 'contract-toggle'; host.name = 'pin'; host.value = 'yes'; host.pressed = true; host.required = true; host.textContent = 'Pin item'; host.setAttribute('form', form.id);
    document.body.append(form, label, host);
    window.contractEvents = []; window.contractClicks = 0; host.addEventListener('change', () => window.contractEvents.push('change')); host.addEventListener('click', () => window.contractClicks++);
  });
  const host = page.locator('#contract-toggle');
  const button = host.getByRole('button', { name: 'Pin item', exact: true });
  const entries = () => page.locator('#toggle-form').evaluate((form) => [...new FormData(form)]);
  expect(await entries()).toEqual([['pin', 'yes']]);
  await page.locator('label[for=contract-toggle]').click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.contractClicks)).toBe(1);
  expect(await host.evaluate((control) => control.validity.valueMissing)).toBe(true);
  await host.evaluate((control) => { control.defaultPressed = true; control.setCustomValidity('Server error'); document.querySelector('#toggle-form').reset(); });
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(await host.evaluate((control) => control.validationMessage)).toBe('Server error');
  await host.evaluate((control) => { control.setCustomValidity(''); control.remove(); document.body.append(control); });
  await button.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.contractEvents)).toEqual(['change', 'change']);
  await host.evaluate((control) => control.formStateRestoreCallback('pressed'));
  expect(await entries()).toEqual([['pin', 'yes']]);
});

test('accordion keyboard behavior changes visibility while its light-DOM fields keep submitting', async ({ page }) => {
  const accordion = page.locator('#delivery-accordion');
  const before = await data(page);
  await accordion.evaluate((host) => { host.setAttribute('name', 'sections'); window.sectionChanges = []; host.addEventListener('valuechange', (event) => window.sectionChanges.push(event.detail.value)); });
  const delivery = accordion.getByRole('button', { name: 'Delivery', exact: true });
  const gift = accordion.getByRole('button', { name: 'Gift', exact: true });
  await delivery.focus();
  await delivery.press('ArrowDown');
  await expect(gift).toBeFocused();
  await gift.press('Space');
  await expect(gift).toHaveAttribute('aria-expanded', 'true');
  await expect(delivery).toHaveAttribute('aria-expanded', 'false');
  await expect(accordion.locator('input[name=delivery_note]')).toBeHidden();
  expect(await data(page)).toEqual(before);
  expect(await page.evaluate(() => window.sectionChanges)).toEqual([['gift']]);
  expect(await gift.evaluate((button) => button.getRootNode().getElementById(button.getAttribute('aria-controls')).getAttribute('aria-labelledby'))).toBe(await gift.getAttribute('id'));
  await accordion.evaluate((host) => { host.multiple = true; host.value = ['delivery', 'gift']; });
  await expect(delivery).toHaveAttribute('aria-expanded', 'true');
  await expect(gift).toHaveAttribute('aria-expanded', 'true');
  await accordion.evaluate((host) => host.querySelector('[data-value=gift]').setAttribute('data-disabled', ''));
  await expect(gift).toBeDisabled();
  await delivery.focus(); await delivery.press('End');
  await expect(delivery).toBeFocused();
  expect(await data(page)).toEqual(before);
});

test('tabs support automatic/manual activation, RTL and vertical keys, and linked panels', async ({ page }) => {
  const tabs = page.locator('#contact-tabs');
  const profile = tabs.getByRole('tab', { name: 'Profile', exact: true });
  const receipts = tabs.getByRole('tab', { name: 'Receipts', exact: true });
  const before = await data(page);
  await profile.focus(); await profile.press('ArrowRight');
  await expect(receipts).toBeFocused(); await expect(receipts).toHaveAttribute('aria-selected', 'true');
  expect(await data(page)).toEqual(before);
  expect(await receipts.evaluate((tab) => tab.getRootNode().getElementById(tab.getAttribute('aria-controls')).getAttribute('aria-labelledby'))).toBe(await receipts.getAttribute('id'));
  await tabs.evaluate((host) => { host.activationMode = 'manual'; host.value = 'profile'; });
  await profile.focus(); await profile.press('ArrowRight');
  await expect(receipts).toBeFocused(); await expect(profile).toHaveAttribute('aria-selected', 'true');
  await receipts.press('Enter'); await expect(receipts).toHaveAttribute('aria-selected', 'true');
  await tabs.evaluate((host) => { host.activationMode = 'automatic'; host.dir = 'rtl'; host.value = 'profile'; });
  await profile.focus(); await profile.press('ArrowLeft');
  await expect(receipts).toHaveAttribute('aria-selected', 'true');
  await tabs.evaluate((host) => { host.orientation = 'vertical'; host.value = 'profile'; });
  await profile.focus(); await profile.press('ArrowDown');
  await expect(receipts).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  expect(await data(page)).toEqual(before);
});

test('invalid fields reveal their panels before native focus and preserve the first invalid target', async ({ page }) => {
  const errors = []; page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.locator('#contact-tabs').evaluate((host) => { host.querySelector('[name=receipt_email]').value = ''; host.value = 'profile'; });
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByLabel('Receipt email', { exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Receipts', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Receipt email', { exact: true }).fill('ada@example.test');
  await page.locator('#delivery-accordion').evaluate((host) => { host.querySelector('[name=delivery_note]').value = ''; host.value = []; });
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByRole('textbox', { name: 'Delivery note', exact: true })).toBeFocused();
  await page.getByRole('textbox', { name: 'Delivery note', exact: true }).fill('Use the side door');
  await page.locator('#contact-tabs').evaluate((host) => { host.querySelectorAll('input').forEach((input) => input.value = ''); host.value = 'receipts'; });
  await page.getByRole('button', { name: 'Submit demo' }).click();
  await expect(page.getByLabel('Display name', { exact: true })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Profile', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});

test('section updates and reconnects preserve editor nodes and clean up machine listeners', async ({ page }) => {
  const tabs = page.locator('#contact-tabs');
  await tabs.evaluate((host) => {
    window.originalEditor = host.querySelector('input');
    window.tabChanges = []; host.addEventListener('valuechange', (event) => window.tabChanges.push(event.detail.value));
    host.querySelector('[data-value=receipts]').dataset.label = 'Billing';
    const section = document.createElement('section'); section.dataset.value = 'extra value'; section.dataset.label = 'Extra'; section.innerHTML = '<label>Extra note<input name="extra_note" value="Keep me"></label>'; host.append(section);
  });
  await expect(tabs.getByRole('tab', { name: 'Billing', exact: true })).toBeVisible();
  await tabs.getByRole('tab', { name: 'Extra', exact: true }).click();
  await expect(tabs.getByRole('tab', { name: 'Extra', exact: true })).toHaveAttribute('aria-selected', 'true');
  await tabs.evaluate((host) => { host.querySelector('[data-value="extra value"]').remove(); host.remove(); document.querySelector('#demo-fields').prepend(host); });
  await expect(tabs.getByRole('tab', { name: 'Profile', exact: true })).toHaveAttribute('aria-selected', 'true');
  expect(await tabs.evaluate((host) => host.querySelector('input') === window.originalEditor)).toBe(true);
  await tabs.getByRole('tab', { name: 'Billing', exact: true }).click();
  expect(await page.evaluate(() => window.tabChanges)).toEqual(['extra value', 'receipts']);
  await expect(tabs.locator('[part~=selected-tab]')).toHaveCount(1);
  await tabs.evaluate((host) => host.querySelector('[data-value=profile]').dataset.label = 'Personal');
  await expect(tabs.getByRole('tab', { name: 'Personal', exact: true })).toHaveAttribute('aria-selected', 'false');
  await expect(tabs.locator('[part~=selected-tab]')).toHaveCount(1);
});

test('nested closed sections reveal a form-associated field and preserve native editor history', async ({ page }) => {
  await page.evaluate(() => {
    const form = document.createElement('form'); form.id = 'nested-form';
    form.innerHTML = `<h6-tabs id="nested-tabs" aria-label="Nested example">
      <section data-value="first" data-label="First"><p>Overview</p></section>
      <section data-value="second" data-label="Second"><h6-accordion id="nested-accordion">
        <section data-value="code" data-label="Code"><label for="nested-code">Nested code</label><h6-otp id="nested-code" name="nested_code" required></h6-otp></section>
      </h6-accordion></section>
    </h6-tabs><button>Check nested</button>`;
    form.addEventListener('submit', (event) => event.preventDefault()); document.body.append(form);
  });
  await page.getByRole('button', { name: 'Check nested', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nested code', exact: true })).toBeFocused();
  expect(await page.locator('#nested-tabs').evaluate((host) => host.value)).toBe('second');
  expect(await page.locator('#nested-accordion').evaluate((host) => host.value)).toEqual(['code']);
  await page.getByRole('textbox', { name: 'Display name', exact: true }).focus();
  const editor = page.getByRole('textbox', { name: 'Display name', exact: true });
  await editor.evaluate((input) => input.setSelectionRange(input.value.length, input.value.length));
  await editor.pressSequentially(' Jr');
  await expect(editor).toHaveValue('Ada Lovelace Jr');
  await page.locator('#contact-tabs').getByRole('tab', { name: 'Receipts', exact: true }).click();
  await page.locator('#contact-tabs').getByRole('tab', { name: 'Profile', exact: true }).click();
  await editor.focus();
  // Native undo may group the space and the following word into separate edits.
  for (let edit = 0; edit < 3 && await editor.inputValue() !== 'Ada Lovelace'; edit++) await editor.press('ControlOrMeta+Z');
  await expect(editor).toHaveValue('Ada Lovelace');
});

test('interaction base styles and icon metrics work without an application stylesheet', async ({ page }) => {
  await page.evaluate(() => document.querySelectorAll('link[rel=stylesheet]').forEach((link) => link.remove()));
  const toggle = page.locator('#priority-field button');
  expect(await toggle.evaluate((button) => { const css = getComputedStyle(button); return [css.fontSize, css.lineHeight, button.getBoundingClientRect().height]; })).toEqual(['14px', '20px', 40]);
  expect(await page.locator('#contact-tabs [part=list]').evaluate((list) => list.getBoundingClientRect().height)).toBe(40);
  const arrow = page.locator('#delivery-accordion [part=indicator]').first();
  expect(await arrow.evaluate((svg) => { const css = getComputedStyle(svg); return [css.width, css.height]; })).toEqual(['16px', '16px']);
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  expect(await toggle.evaluate((button) => button.getBoundingClientRect().height)).toBe(80);
  expect(await arrow.evaluate((svg) => { const css = getComputedStyle(svg); return [css.width, css.height]; })).toEqual(['32px', '32px']);
});

test('new styling recipes use their displayed overrides and retain their form contracts on mobile', async ({ page }) => {
  await page.goto('/styling.html#h6-tabs');
  const variant = page.getByRole('region', { name: 'Underline preview', exact: true });
  await variant.getByRole('tab', { name: 'Receipts', exact: true }).click();
  const selected = variant.locator('[part~=selected-tab]');
  expect(await selected.evaluate((element) => getComputedStyle(element).borderBottomWidth)).toBe('2px');
  await expect(variant.getByLabel('Underline form data')).toContainText('display_name');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [element, title] of [['h6-toggle', 'Toggle'], ['h6-accordion', 'Accordion'], ['h6-tabs', 'Tabs']]) {
    await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: title, exact: true }).click();
    await expect(page.locator('#recipe-element')).toHaveText(`<${element}>`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: test.info().outputPath('zag-styling-mobile.png'), fullPage: true });
});
