import { test, expect } from 'playwright/test';

const markup = (css = false) => `<!doctype html><html lang="en-US"><head><meta name="viewport" content="width=device-width,initial-scale=1">${css ? '<link rel="stylesheet" href="/dist/native.css">' : '<script type="module" src="/dist/src/index.js"></script>'}</head><body>
<form id="form"><fieldset id="fields"><label for="email">Email</label><h6-field id="email-wrap"><input id="email" name="email" type="email" value="ada@example.test" placeholder="Email address" autocomplete="email" required></h6-field>
<label for="note">Note</label><h6-field><textarea id="note" name="note" rows="3">Keep this draft.</textarea></h6-field>
<label for="choice">Choice</label><h6-field><select id="choice" name="choice"><option value="a" selected>First option</option><option value="b">Second option</option></select></h6-field>
<h6-field hidden><input name="hidden-wrapper" value="retained"></h6-field><h6-field><input id="hidden-control" name="hidden-control" value="retained" hidden></h6-field>
</fieldset><button id="submit">Submit</button><button type="reset">Reset</button></form>
<input id="unwrapped" aria-label="Unwrapped"><form id="external"></form><h6-field><input id="outside" name="outside" value="external" form="external" aria-label="Outside"></h6-field>
<script>window.submissions=0;document.querySelector('#form').addEventListener('submit',event=>{event.preventDefault();submissions++});</script></body></html>`;
async function fixture(page, css = false) {
  await page.route('**/native-fields', route => route.fulfill({contentType:'text/html',body:markup(css)}));
  await page.goto('/native-fields'); if (!css) await page.waitForFunction(() => customElements.get('h6-field'));
}
const entries = page => page.locator('#form').evaluate(form => [...new FormData(form)]);

test('native fields keep their original nodes, labels, form owners, validation, native undo, and reset', async ({page}) => {
  await fixture(page); const before = await entries(page);
  expect(await page.locator('#form').evaluate(form => [...form.elements].some(element => element.localName === 'h6-field'))).toBe(false);
  expect(await page.locator('#email-wrap').evaluate(wrapper => wrapper.shadowRoot.querySelectorAll('input,textarea,select').length)).toBe(0);
  await page.getByText('Email',{exact:true}).click(); await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email-wrap').evaluate(wrapper => { window.originalEmail = wrapper.querySelector('input'); });
  await page.locator('#email').press('End'); await page.locator('#email').pressSequentially('x'); await page.locator('#email').press('ControlOrMeta+Z'); await expect(page.locator('#email')).toHaveValue('ada@example.test');
  await page.locator('#email').fill('invalid'); await page.locator('#submit').click(); expect(await page.evaluate(() => submissions)).toBe(0); await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('grace@example.test'); await page.locator('#note').fill('Edited draft'); await page.locator('#choice').selectOption('b');
  expect(await entries(page)).toContainEqual(['note','Edited draft']); expect(await entries(page)).toContainEqual(['choice','b']);
  await page.getByRole('button',{name:'Reset',exact:true}).click(); expect(await entries(page)).toEqual(before);
  expect(await page.locator('#email-wrap').evaluate(wrapper => wrapper.querySelector('input') === window.originalEmail)).toBe(true);
  await page.locator('#fields').evaluate(fields => fields.disabled=true); expect(await entries(page)).toEqual([]); await expect(page.locator('#note')).toBeDisabled();
  expect(await page.locator('#external').evaluate(form => [...new FormData(form)])).toEqual([['outside','external']]);
  await expect(page.locator('#hidden-control')).toBeHidden(); await expect(page.locator('h6-field[hidden]')).toBeHidden();
});

test('built-in base, scoped overrides, placeholders, and shadcn tokens work without a page reset', async ({page}) => {
  await fixture(page);
  await expect(page.locator('#email')).toHaveCSS('font-size','14px'); await expect(page.locator('#email')).toHaveCSS('height','40px'); await expect(page.locator('#choice')).toHaveCSS('height','40px');
  expect(await page.locator('#email').evaluate(input => getComputedStyle(input,'::placeholder').color)).toBe('rgb(115, 115, 115)');
  const unwrapped = await page.locator('#unwrapped').evaluate(input => ({height:input.getBoundingClientRect().height,padding:getComputedStyle(input).padding}));
  await page.locator('#email-wrap').evaluate(wrapper => { wrapper.style.setProperty('--hp-background','#eff6ff'); wrapper.style.setProperty('--hp-radius','20px'); });
  await expect(page.locator('#email')).toHaveCSS('background-color','rgb(239, 246, 255)'); await expect(page.locator('#email')).toHaveCSS('border-radius','16px');
  await page.addStyleTag({content:'h6-field > input { border-radius: 2px; }'}); await expect(page.locator('#email')).toHaveCSS('border-radius','2px');
  expect(await page.locator('#unwrapped').evaluate(input => ({height:input.getBoundingClientRect().height,padding:getComputedStyle(input).padding}))).toEqual(unwrapped);
  await page.addStyleTag({url:'/dist/shadcn.css'});
  await page.locator('#form').evaluate(form => { form.classList.add('hp-shadcn'); form.style.setProperty('--background','#fef3c7'); form.style.setProperty('--foreground','#78350f'); });
  await expect(page.locator('#note')).toHaveCSS('background-color','rgb(254, 243, 199)'); await expect(page.locator('#note')).toHaveCSS('color','rgb(120, 53, 15)');
  await page.locator('#note').evaluate(input => input.style.setProperty('--background','#dcfce7')); await expect(page.locator('#note')).toHaveCSS('background-color','rgb(220, 252, 231)');
});

test('the opt-in stylesheet styles native fields and preserves their form behavior without JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  try {
    const page = await context.newPage(); await fixture(page,true); const before = await entries(page);
    await expect(page.locator('#email')).toHaveCSS('height','40px'); await expect(page.locator('#email')).toHaveCSS('font-size','14px');
    await page.locator('#email').fill('grace@example.test'); await page.locator('#note').fill('Native draft'); await page.locator('#choice').selectOption('b');
    expect(await entries(page)).toContainEqual(['email','grace@example.test']); expect(await entries(page)).toContainEqual(['choice','b']);
    await page.getByRole('button',{name:'Reset',exact:true}).click(); expect(await entries(page)).toEqual(before);
    await expect(page.locator('#hidden-control')).toBeHidden(); await expect(page.locator('h6-field[hidden]')).toBeHidden();
    expect(await page.locator('#unwrapped').evaluate(input => input.getBoundingClientRect().height)).not.toBe(40);
  } finally { await context.close(); }
});

test('native recipes support light/dark, mobile, text scaling, focus, and forced colors', async ({page}) => {
  await page.goto('/styling.html#h6-field');
  const base = page.getByRole('region',{name:'Base preview',exact:true}); const variant = page.getByRole('region',{name:'Underlined fields preview',exact:true});
  const before = await base.locator('form').evaluate(form => [...new FormData(form)]);
  for (const theme of ['dark','base']) {
    await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(theme);
    await expect(base.getByRole('textbox',{name:'Text field',exact:true})).toHaveCSS('color',theme === 'dark' ? 'rgb(250, 250, 250)' : 'rgb(23, 23, 23)');
    expect(await base.locator('form').evaluate(form => [...new FormData(form)])).toEqual(before);
  }
  await expect(variant.getByRole('textbox',{name:'Text field',exact:true})).toHaveCSS('border-radius','0px');
  await page.setViewportSize({width:320,height:800}); await page.evaluate(() => document.documentElement.style.fontSize='200%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await expect(base.getByRole('textbox',{name:'Text field',exact:true})).toHaveCSS('height','80px');
  await page.emulateMedia({forcedColors:'active'}); await base.getByRole('textbox',{name:'Text field',exact:true}).focus();
  await expect(base.getByRole('textbox',{name:'Text field',exact:true})).toHaveCSS('outline-style','solid');
  await expect(base.getByRole('textbox',{name:'Text field',exact:true})).toHaveCSS('box-shadow','none');
});

test('the live playground submits wrapped native values and the fieldset controls them normally', async ({page}) => {
  await page.goto('/#native-fields'); await expect(page.locator('#entry-count')).toHaveText('33 entries');
  await page.getByRole('textbox',{name:'Reference',exact:true}).fill('REF-42'); await page.getByRole('textbox',{name:'Message',exact:true}).fill('A native text area.'); await page.getByRole('combobox',{name:'Reply via',exact:true}).selectOption('phone');
  const data = await page.locator('#demo-form').evaluate(form => [...new FormData(form)]);
  expect(data.filter(([name]) => ['reference','message','reply_via'].includes(name))).toEqual([['reference','REF-42'],['message','A native text area.'],['reply_via','phone']]);
  await page.getByLabel('Disable the fieldset').check(); await expect(page.locator('#message')).toBeDisabled(); await expect(page.locator('#entry-count')).toHaveText('0 entries');
  await page.getByLabel('Disable the fieldset').uncheck(); await page.getByRole('button',{name:'Reset form',exact:true}).click(); await expect(page.locator('#reference')).toHaveValue('ORDER-1042');
});
