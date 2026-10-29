import { test, expect } from 'playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.locator('#entry-count')).toHaveText('30 entries'); });
const entry = (page, name) => page.locator('#demo-form').evaluate((form, name) => new FormData(form).get(name), name);

test('IBAN groups defaults and assignments while keeping canonical submission and invalid characters', async ({ page }) => {
  const input = page.getByRole('textbox', { name:'IBAN',exact:true }); const host = page.locator('h6-iban');
  await expect(input).toHaveValue('DE89 3704 0044 0532 0130 00'); expect(await entry(page,'iban')).toBe('DE89370400440532013000');
  await host.evaluate(control => { window.ibanEvents = []; control.addEventListener('input', () => window.ibanEvents.push('input')); control.value = 'nl91 abna 0417 1643 00'; });
  await expect(input).toHaveValue('NL91 ABNA 0417 1643 00'); expect(await entry(page,'iban')).toBe('NL91ABNA0417164300'); expect(await page.evaluate(() => window.ibanEvents)).toEqual([]);
  await input.fill('de89!3704'); await expect(input).toHaveValue('DE89 !370 4'); expect(await host.evaluate(control => control.validity.valid)).toBe(false);
  await page.getByRole('button', { name:'Reset form',exact:true }).click(); await expect(input).toHaveValue('DE89 3704 0044 0532 0130 00');
});

test('IBAN native typing, separator deletion, middle edits, undo and redo retain one editor', async ({ page }) => {
  const input = page.getByRole('textbox', { name:'IBAN',exact:true });
  await input.focus(); await input.press('ControlOrMeta+A'); await input.pressSequentially('de893704');
  await expect(input).toHaveValue('DE89 3704'); expect(await entry(page,'iban')).toBe('DE893704');
  await input.press('ControlOrMeta+Z'); expect(await input.inputValue()).not.toBe('DE89 3704');
  await input.press('ControlOrMeta+Shift+Z'); await expect(input).toHaveValue('DE89 3704');
  await input.evaluate(editor => editor.setSelectionRange(4,5)); await input.press('Backspace'); await expect(input).toHaveValue('DE89 3704');
  await input.evaluate(editor => editor.setSelectionRange(5,5)); await input.press('Backspace');
  await expect(input).toHaveValue('DE83 704'); expect(await input.evaluate(editor => editor.selectionStart)).toBe(3);
  await input.evaluate(editor => editor.setSelectionRange(3,3)); await input.pressSequentially('9'); await expect(input).toHaveValue('DE89 3704');
  await expect(page.locator('h6-iban input')).toHaveCount(1);
});

test('OTP has one native editor, six aligned visual slots, native arrows, range selection, and deletion', async ({ page }) => {
  const host = page.locator('h6-otp'); const input = page.getByRole('textbox', { name:'Verification code',exact:true });
  await expect(host.locator('input')).toHaveCount(1); await expect(host.locator('[part~=slot]')).toHaveCount(6);
  await expect(input).toHaveValue('004271'); await expect(input).toHaveAttribute('autocomplete','one-time-code'); await expect(input).toHaveAttribute('inputmode','numeric');
  await input.focus(); await input.press('End'); await input.press('ArrowLeft');
  expect(await input.evaluate(editor => editor.selectionStart)).toBe(5); await expect(host.locator('[part~=active-slot]')).toHaveCount(1);
  await input.press('Shift+ArrowLeft'); await expect(host.locator('[part~=selected-slot]')).toHaveCount(1);
  await input.press('Backspace'); await expect(input).toHaveValue('00421'); expect(await entry(page,'code')).toBe('00421');
  await input.press('ControlOrMeta+A'); await input.pressSequentially('001234'); await expect(input).toHaveValue('001234');
  await input.press('ControlOrMeta+Z'); expect(await input.inputValue()).not.toBe('001234');
  await expect(input).toBeFocused(); await expect(page.getByRole('status')).not.toContainText('Captured');
});

test('formatted paste retains zeros and native undo without duplicate value events', async ({ page }) => {
  const input = page.getByRole('textbox', { name:'Verification code',exact:true });
  await input.focus(); await input.press('ControlOrMeta+A');
  await input.evaluate(editor => {
    window.codeEvents = []; const host = editor.getRootNode().host; host.addEventListener('input', () => window.codeEvents.push('input'));
    // Native editing commands need a user gesture in Firefox. Supply the test
    // paste payload during a real key event without reading the system clipboard.
    editor.addEventListener('keydown', event => {
      event.preventDefault();
      const clipboardData = new DataTransfer(); clipboardData.setData('text/plain','00 12 34');
      const paste = new ClipboardEvent('paste', { bubbles:true, cancelable:true, composed:true });
      // Firefox drops clipboardData passed to the constructor (Mozilla bug 2027025).
      // Provide the standard event payload explicitly for this synthetic event.
      Object.defineProperty(paste, 'clipboardData', { value:clipboardData });
      editor.dispatchEvent(paste);
    }, { once:true });
  });
  await input.press('F8');
  await expect(input).toHaveValue('001234'); expect(await entry(page,'code')).toBe('001234'); expect(await page.evaluate(() => window.codeEvents)).toEqual(['input']);
  await input.press('ControlOrMeta+Z'); await expect(input).toHaveValue('004271');
});

test('four-digit PIN layout, reset, disabled fieldset, and long programmatic drafts remain inspectable', async ({ page }) => {
  const host = page.locator('h6-otp'); const input = host.locator('input');
  await host.evaluate(control => { control.length = 4; control.removeAttribute('pattern'); control.value = '0042'; control.defaultValue = '0007'; });
  await expect(host.locator('[part~=slot]')).toHaveCount(4); expect(await host.evaluate(control => control.validity.valid)).toBe(true);
  await host.evaluate(control => control.form.reset()); await expect(input).toHaveValue('0007');
  await page.getByLabel('Disable the fieldset').check(); await expect(input).toBeDisabled(); expect(await entry(page,'code')).toBe(null);
  await page.getByLabel('Disable the fieldset').uncheck();
  await host.evaluate(control => control.value = '123456'); await expect(input).toHaveValue('123456'); expect(await host.evaluate(control => control.validity.valid)).toBe(false); await expect(host.locator('[part=control]')).toHaveAttribute('data-overflow','');
});

test('unavailable native formatting commands leave ordinary editing and canonical values usable', async ({ page }) => {
  await page.evaluate(() => { document.execCommand = () => false; });
  const input = page.getByRole('textbox', { name:'IBAN',exact:true });
  await input.focus(); await input.press('ControlOrMeta+A'); await input.pressSequentially('de89');
  await expect(input).toHaveValue('de89'); expect(await entry(page,'iban')).toBe('DE89');
  for (let edit = 0; edit < 4 && await input.inputValue() !== 'DE89 3704 0044 0532 0130 00'; edit++) await input.press('ControlOrMeta+Z');
  await expect(input).toHaveValue('DE89 3704 0044 0532 0130 00');
});

test('slot geometry adapts to mobile, text scaling, local styles, Light/Dark and forced colors', async ({ page }) => {
  await page.goto('/styling.html#h6-otp');
  await page.setViewportSize({ width:320,height:800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const base = page.getByRole('region', { name:'Base preview',exact:true });
  for (const appearance of ['dark','base']) {
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(appearance);
    const input = base.getByRole('textbox'); await input.focus(); await input.press('ArrowLeft'); await expect(base.locator('[part~=active-slot]')).toHaveCount(1);
    const geometry = await base.locator('[part=control]').evaluate(control => {
      const input = control.querySelector('input'), cells = [...control.querySelectorAll('[part~=slot]')], css=getComputedStyle(input);
      const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
      context.font = `${css.fontSize} ${css.fontFamily}`;
      return { pitch: parseFloat(css.letterSpacing) + context.measureText('0').width, cellPitch:cells[1].getBoundingClientRect().x-cells[0].getBoundingClientRect().x, height:cells[0].getBoundingClientRect().height };
    });
    expect(Math.abs(geometry.pitch-geometry.cellPitch)).toBeLessThan(1); expect(geometry.height).toBe(40);
  }
  await page.evaluate(() => document.documentElement.style.fontSize='200%');
  expect(await base.locator('[part~=slot]').first().evaluate(cell => cell.getBoundingClientRect().height)).toBe(80);
  await page.emulateMedia({ forcedColors:'active',reducedMotion:'reduce' }); await expect(base.locator('[part~=active-slot]')).toHaveCSS('outline-style','solid');
});
