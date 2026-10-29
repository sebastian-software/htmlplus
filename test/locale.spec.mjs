import { test, expect } from 'playwright/test';

const values = page => page.locator('form').first().evaluate(form => [...new FormData(form)]);
async function fixture(page) {
  await page.route('**/locale-fields', route => route.fulfill({ contentType:'text/html', body:`<!doctype html><html lang="de-DE"><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/dist/src/index.js"></script></head><body><form><div id="scope">
    <h6-date-picker name="date" value="2028-02-29" aria-label="Date"></h6-date-picker>
    <h6-date-range-picker name="period" value='["2028-02-29","2028-03-02"]' aria-label="Period"></h6-date-range-picker>
    <h6-number-input name="number" value="3.5" step="0.1" aria-label="Number"></h6-number-input>
    </div></form></body></html>` }));
  await page.goto('/locale-fields'); await expect(page.locator('h6-date-picker input')).toHaveValue('29.02.2028');
  await page.locator('form').evaluate(form => { window.valueEvents = []; for (const type of ['input','change']) form.addEventListener(type, () => window.valueEvents.push(type)); });
}
const input = (page, tag) => page.locator(`${tag} input`).first();

test('date and number fields inherit dynamic HTML language and honor nearest lang and explicit locale', async ({ page }) => {
  await fixture(page); const before = await values(page);
  await expect(input(page,'h6-number-input')).toHaveValue('3,5');
  await page.evaluate(() => document.documentElement.lang = 'en-GB');
  await expect(input(page,'h6-date-picker')).toHaveValue('29/02/2028'); await expect(input(page,'h6-date-range-picker')).toHaveValue('29/02/2028'); await expect(input(page,'h6-number-input')).toHaveValue('3.5');
  await page.locator('#scope').evaluate(scope => scope.lang = 'ja-JP');
  await expect(input(page,'h6-date-picker')).toHaveValue('2028/02/29');
  await page.locator('h6-date-picker').evaluate(field => { field.lang = 'fr-FR'; field.locale = 'en-US'; });
  await expect(input(page,'h6-date-picker')).toHaveValue('02/29/2028');
  await page.locator('h6-date-picker').evaluate(field => field.removeAttribute('locale'));
  await expect(input(page,'h6-date-picker')).toHaveValue('29/02/2028');
  await page.locator('h6-date-picker').evaluate(field => field.removeAttribute('lang'));
  await expect(input(page,'h6-date-picker')).toHaveValue('2028/02/29');
  expect(await values(page)).toEqual(before); expect(await page.evaluate(() => window.valueEvents)).toEqual([]);
});

test('calendar week order, names, digits, and year view follow locale, including the week-info fallback', async ({ page }) => {
  await fixture(page);
  for (const tag of ['h6-date-picker','h6-date-range-picker']) {
    const field = page.locator(tag);
    for (const [locale,firstDay] of [['en-US','Sunday'],['de-DE','Monday'],['ja-JP','Sunday'],['ar-EG','Saturday']]) {
      await field.evaluate((field, locale) => field.locale = locale, locale);
      await field.locator('[part=trigger]').click();
      const expected = await page.evaluate(({locale,firstDay}) => {
        const days = {Sunday:'2028-02-27',Monday:'2028-02-28',Saturday:'2028-02-26'};
        return { weekday:new Intl.DateTimeFormat(locale,{timeZone:'UTC',weekday:'long'}).format(new Date(days[firstDay]+'T12:00:00Z')), digit:new Intl.NumberFormat(locale,{useGrouping:false}).format(29) };
      }, {locale,firstDay});
      await expect(field.locator('[part=weekday]').first()).toHaveAttribute('aria-label', expected.weekday);
      await expect(field.locator('[part~=day][data-value="2028-02-29"]')).toHaveText(expected.digit);
      await field.locator('[part=view-button]').click(); await field.locator('[part=view-button]').click();
      await expect(field.locator('[part~=year][data-value="2028"]')).toHaveText(await page.evaluate(locale => new Intl.NumberFormat(locale,{useGrouping:false}).format(2028), locale));
      await page.keyboard.press('Escape');
    }
  }
  await page.evaluate(() => {
    delete Intl.Locale.prototype.getWeekInfo;
    delete Intl.Locale.prototype.weekInfo;
  });
  await page.locator('h6-date-picker').evaluate(field => field.locale = 'de-DE');
  await page.locator('h6-date-picker [part=trigger]').click();
  await expect(page.locator('h6-date-picker [part=weekday]').first()).toHaveAttribute('aria-label','Montag');
  expect(await values(page)).toEqual([['date','2028-02-29'],['period.start','2028-02-29'],['period.end','2028-03-02'],['number','3.5']]);
});

test('locale switches preserve invalid drafts, canonical numbers, reset, and reconnected shadow language context', async ({ page }) => {
  await fixture(page);
  await input(page,'h6-date-picker').fill('31.'); await page.locator('h6-date-range-picker input').nth(1).fill('31.');
  await input(page,'h6-number-input').fill('3,75');
  await page.evaluate(() => document.documentElement.lang = 'en-US');
  await expect(input(page,'h6-date-picker')).toHaveValue('31.'); await expect(page.locator('h6-date-range-picker input').nth(1)).toHaveValue('31.');
  await expect(input(page,'h6-number-input')).toHaveValue('3.75');
  expect(await values(page)).toEqual([['period.start','2028-02-29'],['number','3.75']]);
  await input(page,'h6-number-input').fill('oops'); await page.evaluate(() => document.documentElement.lang = 'de-DE');
  await expect(input(page,'h6-number-input')).toHaveValue('oops'); expect(await page.locator('h6-number-input').evaluate(field => field.validity.badInput)).toBe(true);
  await page.locator('h6-number-input').evaluate(field => field.formStateRestoreCallback('3,5'));
  expect(await page.locator('h6-number-input').evaluate(field => field.value)).toBe('3.5');
  await page.locator('form').evaluate(form => form.reset()); await expect(input(page,'h6-number-input')).toHaveValue('3,5');
  await page.locator('h6-date-picker').evaluate(field => {
    const wrapper = document.createElement('div'); wrapper.id = 'shadow-context'; wrapper.lang = 'ja-JP'; document.querySelector('form').append(wrapper);
    const root = wrapper.attachShadow({mode:'open'}); field.remove(); root.append(field);
  });
  await expect(input(page,'h6-date-picker')).toHaveValue('2028/02/29');
  await page.locator('#shadow-context').evaluate(wrapper => wrapper.lang = 'de-DE'); await expect(input(page,'h6-date-picker')).toHaveValue('29.02.2028');
  await page.locator('#shadow-context').evaluate(wrapper => {
    const field = wrapper.shadowRoot.querySelector('h6-date-picker'); wrapper.append(field);
    wrapper.shadowRoot.innerHTML = '<section lang="en-GB"><slot name="first"></slot></section><section lang="ja-JP"><slot name="second"></slot></section>';
    field.slot = 'first';
  });
  await expect(input(page,'h6-date-picker')).toHaveValue('29/02/2028');
  await page.locator('h6-date-picker').evaluate(field => field.slot = 'second'); await expect(input(page,'h6-date-picker')).toHaveValue('2028/02/29');
});

test('playground and recipes offer functional locales without translating labels or changing form data', async ({ page }) => {
  await page.goto('/'); const before = await page.locator('#demo-form').evaluate(form => [...new FormData(form)]);
  for (const [locale,display] of [['en-GB','28/10/2026'],['de-DE','28.10.2026'],['ja-JP','2026/10/28'],['ar-EG','٢٨/١٠/٢٠٢٦']]) {
    await page.getByRole('combobox',{name:'Locale',exact:true}).selectOption(locale);
    await expect(page.getByRole('textbox',{name:'Delivery date',exact:true})).toHaveValue(display);
    expect(await page.locator('#demo-form').evaluate(form => [...new FormData(form)])).toEqual(before);
    await expect(page.getByRole('button',{name:'Submit demo',exact:true})).toBeVisible();
  }
  await page.getByRole('combobox',{name:'Locale',exact:true}).selectOption('de-DE');
  await page.goto('/styling.html#h6-date-range-picker');
  await expect(page.getByRole('combobox',{name:'Locale',exact:true})).toHaveValue('de-DE');
  await expect(page.getByRole('region',{name:'Base preview',exact:true}).getByRole('textbox').first()).toHaveValue('28.10.2026');
  await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption('dark');
  await page.setViewportSize({width:320,height:800}); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('combobox',{name:'Locale',exact:true}).selectOption('en-GB');
  await expect(page.getByRole('region',{name:'Base preview',exact:true}).getByRole('textbox').first()).toHaveValue('28/10/2026');
  await page.getByRole('button',{name:'HTML',exact:true}).click(); await expect(page.getByLabel('Example code',{exact:true})).toContainText('lang="en-GB"');
  await page.getByRole('combobox',{name:'Locale',exact:true}).selectOption('ar-EG');
  const base = page.getByRole('region',{name:'Base preview',exact:true});
  await expect(base.locator('h6-date-range-picker')).toHaveAttribute('dir','rtl');
  await base.getByRole('button',{name:'Open calendar for Travel period',exact:true}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const cells = await base.locator('[part=weekday]').evaluateAll(cells => cells.map(cell => ({label:cell.textContent,width:cell.getBoundingClientRect().width,content:cell.scrollWidth})));
  expect(cells).toHaveLength(7); expect(cells.every(cell => cell.content <= cell.width + 1)).toBe(true);
});
