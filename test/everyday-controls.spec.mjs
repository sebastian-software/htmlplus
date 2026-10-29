import { test, expect } from 'playwright/test';

const data = page => page.locator('#demo-form').evaluate(form => [...new FormData(form)]);
const values = async (page, name) => (await data(page)).filter(([key]) => key === name).map(([, value]) => value);
test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.locator('#entry-count')).toHaveText('30 entries'); });

test('table selection derives mixed state and submits only selected row identifiers', async ({ page }) => {
  const all = page.getByRole('checkbox', { name: 'Select all examples', exact: true });
  await expect(all).toHaveAttribute('aria-checked', 'mixed');
  await all.click();
  expect(await values(page, 'selected')).toEqual(['profile', 'settings', 'filters']);
  await expect(all).toBeChecked(); await expect(all).toHaveAttribute('aria-checked', 'true');
  await all.press('Space'); expect(await values(page, 'selected')).toEqual([]);
  await page.getByRole('checkbox', { name: 'Select profile form', exact: true }).check();
  await expect(all).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.locator('#selection-feedback')).toContainText('1 of 3 selected');
  expect((await data(page)).some(([name]) => name === 'select-all')).toBe(false);
  await page.getByRole('button', { name: 'Reset form', exact: true }).click();
  expect(await values(page, 'selected')).toEqual(['profile', 'settings']);
  await expect(all).toHaveAttribute('aria-checked', 'mixed');
});

test('checkbox has independent checked/mixed states, one event pair, native labels, defaults, and restoration', async ({ page }) => {
  const host = page.locator('h6-checkbox[value=filters]');
  await host.evaluate(control => {
    window.controlEvents = []; for (const type of ['input', 'change']) control.addEventListener(type, event => window.controlEvents.push([type, event.target === control]));
    control.checked = true; control.indeterminate = true;
  });
  expect(await values(page, 'selected')).toContain('filters');
  expect(await page.evaluate(() => window.controlEvents)).toEqual([]);
  const input = host.getByRole('checkbox'); await input.click();
  expect(await host.evaluate(control => [control.checked, control.indeterminate])).toEqual([false, false]);
  expect(await page.evaluate(() => window.controlEvents)).toEqual([['input', true], ['change', true]]);
  await host.evaluate(control => { control.defaultChecked = true; control.defaultIndeterminate = true; control.required = true; control.checked = false; });
  expect(await host.evaluate(control => control.validity.valueMissing)).toBe(true);
  await host.evaluate(control => control.form.reset());
  expect(await host.evaluate(control => [control.checked, control.indeterminate])).toEqual([true, true]);
  await host.evaluate(control => control.formStateRestoreCallback('{"checked":false,"indeterminate":true}'));
  await expect(input).toHaveAttribute('aria-checked', 'mixed');
  await page.evaluate(() => {
    const label = document.createElement('label'); label.htmlFor = 'select-filters'; label.textContent = 'Choose filters';
    const control = document.querySelector('h6-checkbox[value=filters]'); control.id = label.htmlFor; document.body.append(label);
  });
  await page.locator('label[for=select-filters]').click(); await expect(input).toBeChecked();
});

test('radio group preserves native navigation, descriptions, disabled options, and one value/event pair', async ({ page }) => {
  const group = page.locator('#frequency-field');
  await group.evaluate(control => { window.groupEvents = []; for (const type of ['input','change']) control.addEventListener(type, () => window.groupEvents.push(type)); });
  await page.locator('label[for=frequency-field]').click();
  const weekly = group.getByRole('radio', { name: 'Weekly', exact: true }); await expect(weekly).toBeFocused();
  await weekly.press('ArrowDown');
  await expect(group.getByRole('radio', { name: 'Daily', exact: true })).toBeChecked();
  expect(await values(page, 'frequency')).toEqual(['daily']);
  expect(await page.evaluate(() => window.groupEvents)).toEqual(['input','change']);
  await expect(group.getByRole('radio', { name: 'Instant (unavailable)', exact: true })).toBeDisabled();
  await expect(weekly).toHaveAccessibleDescription('One digest each Friday.');
  await group.evaluate(control => control.value = 'unknown');
  expect(await values(page, 'frequency')).toEqual([]); expect(await group.evaluate(control => control.validity.valueMissing)).toBe(true);
});

test('toggle group separates single and multiple selection, roving focus, and dynamic option reconciliation', async ({ page }) => {
  const group = page.locator('#formats-field'); const csv = group.getByRole('button', { name: 'CSV', exact: true });
  await csv.focus(); await csv.press('ArrowRight');
  await expect(group.getByRole('button', { name: 'JSON', exact: true })).toBeFocused();
  expect(await values(page, 'formats')).toEqual(['csv','json']);
  await group.getByRole('button', { name: 'XML', exact: true }).press('Space');
  expect(await values(page, 'formats')).toEqual(['csv','json','xml']);
  await group.evaluate(control => { control.multiple = false; control.value = ['xml']; });
  const singleCsv = group.getByRole('radio', { name: 'CSV', exact: true });
  await singleCsv.click(); expect(await values(page, 'formats')).toEqual(['csv']);
  await singleCsv.click(); expect(await values(page, 'formats')).toEqual([]);
  await group.evaluate(control => {
    window.originalToggle = control.shadowRoot.querySelector('button');
    control.querySelector('option[value=json]').disabled = true;
    const option = document.createElement('option'); option.value = 'yaml'; option.textContent = 'YAML'; control.append(option);
  });
  await expect(group.getByRole('radio', { name: 'JSON', exact: true })).toBeDisabled();
  await group.getByRole('radio', { name: 'YAML', exact: true }).click(); expect(await values(page, 'formats')).toEqual(['yaml']);
  expect(await group.evaluate(control => control.shadowRoot.querySelector('button') === window.originalToggle)).toBe(true);
  await group.evaluate(control => control.querySelector('option[value=yaml]').remove());
  await expect.poll(() => values(page, 'formats')).toEqual([]);
});

test('number editor retains native drafts, undo, canonical submission, and numeric validity', async ({ page }) => {
  const editor = page.getByRole('spinbutton', { name: 'Seats', exact: true }); const host = page.locator('#seats-field');
  await editor.focus(); await editor.press('ControlOrMeta+A'); await editor.pressSequentially('12');
  expect(await values(page, 'seats')).toEqual(['12']);
  for (let edit = 0; edit < 3 && await editor.inputValue() !== '3'; edit++) await editor.press('ControlOrMeta+Z');
  await expect(editor).toHaveValue('3');
  await editor.fill('-'); expect(await host.evaluate(control => control.validity.badInput)).toBe(true);
  await editor.fill('21'); expect(await host.evaluate(control => control.validity.rangeOverflow)).toBe(true);
  await expect(editor).toHaveValue('21');
  await editor.fill('2.5'); expect(await host.evaluate(control => control.validity.stepMismatch)).toBe(true);
  await editor.fill(''); expect(await host.evaluate(control => control.validity.valueMissing)).toBe(true);
  await editor.fill('7'); await editor.press('ArrowUp'); await expect(editor).toHaveValue('8');
  await page.getByRole('button', { name: 'Decrease value', exact: true }).click(); await expect(editor).toHaveValue('7');
  await host.evaluate(control => control.defaultValue = '4'); await expect(editor).toHaveValue('7');
  await host.evaluate(control => control.form.reset()); await expect(editor).toHaveValue('4');
});

test('localized numbers, silent property updates, constraints, and read-only stepping are consistent', async ({ page }) => {
  const host = page.locator('#seats-field');
  await host.evaluate(control => { control.locale = 'de-DE'; control.step = .5; control.value = '2.5'; window.numberEvents = []; for (const type of ['input','change']) control.addEventListener(type, () => window.numberEvents.push(type)); });
  const editor = page.getByRole('spinbutton', { name: 'Seats', exact: true }); await expect(editor).toHaveValue('2,5');
  expect(await values(page, 'seats')).toEqual(['2.5']);
  await host.evaluate(control => control.value = '3.5'); expect(await page.evaluate(() => window.numberEvents)).toEqual([]);
  await editor.fill('4,5'); expect(await values(page, 'seats')).toEqual(['4.5']);
  await editor.fill('4,50'); await page.locator('label[for=password-field]').click(); await expect(editor).toHaveValue('4,50');
  await editor.focus();
  await editor.press('ArrowUp'); await expect(editor).toHaveValue('5');
  await host.evaluate(control => control.readOnly = true); await editor.press('ArrowUp'); await expect(editor).toHaveValue('5');
  await expect(page.getByRole('button', { name: 'Increase value', exact: true })).toBeDisabled();
  await host.evaluate(control => { control.readOnly = false; control.step = 0; }); expect(await host.evaluate(control => control.validity.customError)).toBe(true);
});

test('password visibility works with keyboard without value events, preserves selection, and hides on submit/reset', async ({ page }) => {
  const host = page.locator('#password-field'); const input = host.locator('input');
  await host.evaluate(control => { window.passwordEvents = []; for (const type of ['input','change']) control.addEventListener(type, () => window.passwordEvents.push(type)); control.input.setSelectionRange(2,6); });
  const before = await values(page, 'password');
  const show = host.getByRole('button', { name: 'Show password', exact: true });
  await show.focus(); await show.press('Enter'); await expect(input).toHaveAttribute('type','text');
  expect(await input.evaluate(editor => [editor.selectionStart, editor.selectionEnd])).toEqual([2,6]);
  expect(await values(page, 'password')).toEqual(before); expect(await page.evaluate(() => window.passwordEvents)).toEqual([]);
  await host.getByRole('button', { name: 'Hide password', exact: true }).press('Space'); await expect(input).toHaveAttribute('type','password');
  await input.fill('Changed-demo-42!');
  await host.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(input).toHaveAttribute('type','text');
  await page.getByRole('button', { name: 'Submit demo', exact: true }).click(); await expect(input).toHaveAttribute('type','password');
  await page.getByRole('button', { name: 'Reset form', exact: true }).click(); await expect(input).toHaveValue('Demo-only-42!');
});

test('all five controls retain errors, external form ownership, reset, fieldset disabling, and reconnects', async ({ page }) => {
  const tags = ['h6-checkbox','h6-radio-group','h6-toggle-group','h6-number-input','h6-password-input'];
  const before = await data(page);
  await page.getByLabel('Disable the fieldset').check(); expect(await data(page)).toEqual([]);
  for (const tag of tags) expect(await page.locator(`#demo-fields ${tag}`).first().evaluate(control => control.matches(':disabled'))).toBe(true);
  await page.getByLabel('Disable the fieldset').uncheck(); expect(await data(page)).toEqual(before);
  const result = await page.evaluate(tags => {
    const form = document.createElement('form'); form.id = 'external-small'; document.body.append(form);
    const controls = tags.map((tag, index) => {
      const original = document.querySelector(`#demo-fields ${tag}`); const control = original.cloneNode(true); control.id = `external-${index}`; control.name = `field${index}`; control.setAttribute('form', form.id); document.body.append(control);
      control.setCustomValidity('Review this value.'); return control;
    });
    form.reset(); const messages = controls.map(control => control.validationMessage);
    controls.forEach(control => { control.setCustomValidity(''); control.remove(); document.body.append(control); });
    return { messages, formIds: controls.map(control => control.form.id), values: [...new FormData(form)] };
  }, tags);
  expect(result.messages).toEqual(tags.map(() => 'Review this value.'));
  expect(result.formIds).toEqual(tags.map(() => 'external-small'));
  expect(result.values).toContainEqual(['field1','weekly']); expect(result.values).toContainEqual(['field3','3']); expect(result.values).toContainEqual(['field4','Demo-only-42!']);
});

test('native button stylesheet preserves submitter values, validation, external association, and reset without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.route('**/native-button-fixture', route => route.fulfill({ contentType: 'text/html', body: '<link rel="stylesheet" href="/dist/native.css"><form id="native" action="/saved"><input name="title" value="Example" required><button class="hp-button" name="action" value="save">Save</button><button class="hp-button" type="reset">Reset native</button></form><button class="hp-button" form="native" name="action" value="publish">Publish</button>' }));
  await page.route('**/saved?*', route => route.fulfill({ contentType:'text/html', body:'Saved' }));
  await page.goto('/native-button-fixture');
  const input = page.locator('input'); await input.fill(''); await page.getByRole('button', { name:'Save',exact:true }).click(); expect(page.url()).toContain('native-button-fixture');
  await input.fill('Changed'); await page.getByRole('button', { name:'Reset native',exact:true }).click(); await expect(input).toHaveValue('Example');
  await expect(page.getByRole('button',{name:'Save',exact:true})).toHaveCSS('min-height','40px');
  await page.getByRole('button', { name:'Publish',exact:true }).click(); await expect(page).toHaveURL(/saved\?title=Example&action=publish$/);
  await context.close();
});

test('new recipes support light/dark, local tokens, mobile, text scaling, and both surfaces', async ({ page }) => {
  for (const element of ['h6-checkbox','h6-radio-group','h6-number-input','h6-password-input','h6-toggle-group','button']) {
    await page.goto(`/styling.html#${element}`); await expect(page.locator('.recipe-preview')).toHaveCount(2);
    const before = await page.locator('.recipe-form').evaluateAll(forms => forms.map(form => [...new FormData(form)]));
    for (const mode of ['dark','base']) {
      await page.getByRole('combobox', { name:'Appearance',exact:true }).selectOption(mode);
      for (const surface of ['flat','layered']) {
        await page.getByRole('combobox', { name:'Surface',exact:true }).selectOption(surface);
        expect(await page.locator('.recipe-form').evaluateAll(forms => forms.map(form => [...new FormData(form)]))).toEqual(before);
      }
    }
    await page.setViewportSize({ width:390,height:844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/'); await page.evaluate(() => { document.querySelectorAll('link[rel=stylesheet]').forEach(link => link.remove()); document.documentElement.style.fontSize = '200%'; });
  expect(await page.locator('#select-all [part=control]').evaluate(control => control.getBoundingClientRect().width)).toBe(32);
  expect(await page.locator('#password-field [part=visibility-trigger] svg').evaluate(icon => icon.getBoundingClientRect().width)).toBe(32);
  await page.locator('#formats-field').evaluate(control => control.style.setProperty('--hp-primary','#065f46'));
  await expect(page.locator('#formats-field [part~=selected-option]').first()).toHaveCSS('background-color','rgb(6, 95, 70)');
});
