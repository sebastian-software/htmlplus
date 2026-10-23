import { test, expect } from 'playwright/test';
const markup=`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/dist/src/index.js"></script><style>body{font:14px system-ui;margin:24px}form{max-width:340px}label{display:block;margin:12px 0}fieldset{border:0;padding:0;margin:0}</style></head><body>
<form id="form"><fieldset id="fields"><label for="date">Delivery date</label><p id="hint">Choose a delivery day.</p><h6-date-picker id="date" name="date" value="2028-02-29" min="2028-02-01" max="2028-12-31" required aria-describedby="hint"></h6-date-picker></fieldset><button id="after" type="button">After date</button><button id="submit">Submit</button></form><script>window.events=[];window.submits=0;for(const type of ['input','change'])document.querySelector('form').addEventListener(type,e=>events.push(type));document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits++});</script></body></html>`;
async function bare(page){await page.route('**/date-controls',route=>route.fulfill({contentType:'text/html',body:markup}));await page.goto('/date-controls');await expect(page.locator('#date input')).toHaveValue('02/29/2028');}
const entries=page=>page.locator('#form').evaluate(form=>[...new FormData(form)]);
const day=(page,value)=>page.locator(`#date [part~=day][data-value="${value}"]`);
const open=page=>page.getByRole('button',{name:'Open calendar for Delivery date',exact:true}).click();

test('calendar selection, keyboard days/months/years, clearing, and focus share one date-only form value',async({page})=>{
 await bare(page);expect(await entries(page)).toEqual([['date','2028-02-29']]);expect(await page.locator('h6-date-picker input[name],input[type=hidden]').count()).toBe(0);
 await open(page);await expect(page.getByRole('dialog',{name:'Delivery date calendar'})).toBeVisible();await expect(day(page,'2028-02-29')).toBeFocused();
 await page.keyboard.press('ArrowRight');await expect(day(page,'2028-03-01')).toBeFocused();await page.keyboard.press('Enter');
 expect(await entries(page)).toEqual([['date','2028-03-01']]);expect(await page.evaluate(()=>events)).toEqual(['input','change']);
 await expect(page.getByRole('button',{name:'Open calendar for Delivery date',exact:true})).toBeFocused();
 await open(page);await page.locator('#date [part=view-button]').click();await expect(page.locator('#date [part~=month]:visible')).toHaveCount(12);
 await page.locator('#date [part=view-button]').click();await expect(page.locator('#date [part~=year]:visible')).toHaveCount(10);
 await page.locator('#date [part~=year][data-value="2028"]').click();await page.locator('#date [part~=month][data-value="6"]').click();await day(page,'2028-06-15').click();
 expect(await entries(page)).toEqual([['date','2028-06-15']]);
 await page.getByRole('button',{name:'Clear Delivery date',exact:true}).click();await expect(page.locator('#date input')).toBeFocused();expect(await entries(page)).toEqual([]);
 expect(await page.locator('#date').evaluate(host=>host.validity.valueMissing)).toBe(true);expect(await page.evaluate(()=>submits)).toBe(0);
});

test('typing retains incomplete and invalid text, validates leap days and bounds, and commits on native change',async({page})=>{
 await bare(page);const input=page.locator('#date input');await input.fill('02/30/2028');expect(await entries(page)).toEqual([]);
 expect(await page.locator('#date').evaluate(host=>host.validity.badInput)).toBe(true);await input.press('Tab');await expect(input).toHaveValue('02/30/2028');expect(await page.evaluate(()=>events)).toEqual(['input','change']);
 await input.fill('02/');await page.locator('#submit').click();expect(await page.evaluate(()=>submits)).toBe(0);await expect(input).toHaveValue('02/');
 await input.fill('01/31/2028');expect(await entries(page)).toEqual([['date','2028-01-31']]);expect(await page.locator('#date').evaluate(host=>host.validity.rangeUnderflow)).toBe(true);
 await open(page);await expect(page.locator('#date [part~=selected-day]')).toHaveCount(0);await expect(day(page,'2028-02-01')).toBeFocused();await page.keyboard.press('Escape');await expect(input).toHaveValue('01/31/2028');
 await input.fill('2029-01-01');expect(await page.locator('#date').evaluate(host=>host.validity.rangeOverflow)).toBe(true);await input.press('Tab');await expect(input).toHaveValue('2029-01-01');
 await input.fill('2028-02-29');await page.locator('#submit').click();expect(await page.evaluate(()=>submits)).toBe(1);expect(await entries(page)).toEqual([['date','2028-02-29']]);await expect(input).toHaveValue('2028-02-29');
});

test('explicit locale changes preserve calendar dates and do not reinterpret an invalid draft',async({page})=>{
 await bare(page);await page.locator('#date').evaluate(host=>host.locale='de-DE');await expect(page.locator('#date input')).toHaveValue('29.02.2028');
 await page.locator('#date input').fill('03.04.2028');expect(await entries(page)).toEqual([['date','2028-04-03']]);
 await page.locator('#date').evaluate(host=>host.locale='en-GB');await expect(page.locator('#date input')).toHaveValue('03/04/2028');
 await page.locator('#date input').fill('31/');await page.locator('#date').evaluate(host=>host.locale='en-US');await expect(page.locator('#date input')).toHaveValue('31/');expect(await entries(page)).toEqual([]);
 await page.locator('#date').evaluate(host=>host.value='2028-04-03');await expect(page.locator('#date input')).toHaveValue('04/03/2028');
 const result=await page.locator('#date').evaluate(host=>{try{host.value='2028-02-30';return false;}catch(error){return error instanceof RangeError;}});expect(result).toBe(true);
 await page.locator('#date').evaluate(host=>host.locale='not_a_locale');expect(await entries(page)).toEqual([]);expect(await page.locator('#date').evaluate(host=>host.validity.customError)).toBe(true);
});

test('defaults, external forms, readonly, disabled fieldsets, custom errors, restoration, and reconnect are silent',async({page})=>{
 await bare(page);await page.locator('#date').evaluate(host=>{host.value='2028-06-15';host.defaultValue='2028-04-03';});expect(await entries(page)).toEqual([['date','2028-06-15']]);expect(await page.evaluate(()=>events)).toEqual([]);
 await page.locator('#fields').evaluate(fields=>fields.disabled=true);expect(await entries(page)).toEqual([]);await expect(page.locator('#date input')).toBeDisabled();
 await page.locator('#fields').evaluate(fields=>fields.disabled=false);await page.locator('#date').evaluate(host=>host.readOnly=true);await open(page);await expect(page.getByRole('dialog')).toBeHidden();expect(await entries(page)).toEqual([['date','2028-06-15']]);
 await page.locator('#form').evaluate(form=>form.reset());expect(await entries(page)).toEqual([['date','2028-04-03']]);
 await page.locator('#date').evaluate(host=>{host.readOnly=false;host.setCustomValidity('Date unavailable.');host.value='2028-05-01';});expect(await page.locator('#date').evaluate(host=>host.validationMessage)).toBe('Date unavailable.');
 await page.locator('#date').evaluate(host=>{host.setCustomValidity('');host.formStateRestoreCallback('["","02/","en-US"]');host.remove();document.querySelector('#fields').append(host);});await expect(page.locator('#date input')).toHaveValue('02/');expect(await entries(page)).toEqual([]);
 await page.locator('#date').evaluate(host=>{host.formStateRestoreCallback('["2028-02-29","02/29/2028","en-US"]');const form=document.createElement('form');form.id='external';document.body.append(form);host.setAttribute('form','external');});expect(await entries(page)).toEqual([]);expect(await page.locator('#external').evaluate(form=>[...new FormData(form)])).toEqual([['date','2028-02-29']]);
 await open(page);await day(page,'2028-02-15').click();expect(await page.evaluate(()=>events)).toEqual(['input','change']);
});

test('raw native editing keeps undo, caret, and composition without stale form values',async({page})=>{
 await bare(page);const input=page.locator('#date input');await input.focus();await input.press('End');await input.pressSequentially('x');await expect(input).toHaveValue('02/29/2028x');expect(await entries(page)).toEqual([]);
 await input.press('ControlOrMeta+z');await expect(input).toHaveValue('02/29/2028');expect(await entries(page)).toEqual([['date','2028-02-29']]);
 await input.evaluate(input=>{input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value='日';input.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,isComposing:true,data:'日'}));});await expect(input).toHaveValue('日');expect(await entries(page)).toEqual([]);
 await input.evaluate(input=>input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'日'})));await input.press('Tab');await expect(input).toHaveValue('日');
});

test('popup keyboard entry, boundaries, clipping, dismissal, and labels stay scoped',async({page})=>{
 await bare(page);await page.getByText('Delivery date',{exact:true}).click();await expect(page.locator('#date input')).toBeFocused();await page.locator('#date input').press('Alt+ArrowDown');await expect(day(page,'2028-02-29')).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();
 await page.locator('#date').evaluate(host=>{host.min='2028-02-28';host.max='2028-03-02';});await open(page);await expect(day(page,'2028-02-27')).toHaveAttribute('aria-disabled','true');await day(page,'2028-02-27').dispatchEvent('click');expect(await entries(page)).toEqual([['date','2028-02-29']]);
 await page.locator('#after').evaluate(button=>button.style.cssText='position:fixed;right:16px;top:16px');await page.locator('#after').click();await expect(page.getByRole('dialog')).toBeHidden();
 await page.setViewportSize({width:390,height:600});await page.locator('#form').evaluate(form=>{form.style.cssText='position:fixed;bottom:8px;left:16px;right:16px';form.querySelector('fieldset').style.cssText='height:160px;overflow:hidden';});await open(page);
 await expect.poll(()=>page.locator('#date [part=positioner]').evaluate(el=>el.matches(':popover-open'))).toBe(true);await day(page,'2028-02-28').click();expect(await entries(page)).toEqual([['date','2028-02-28']]);
 await page.locator('#date').evaluate(host=>{host.min='2028-03-02';host.max='2028-02-01';});expect(await entries(page)).toEqual([]);expect(await page.locator('#date').evaluate(host=>host.validity.customError)).toBe(true);
});

test('recipes theme the calendar in light and dark, preserve form data, and fit mobile',async({page})=>{
 await page.goto('/styling.html#h6-date-picker');const before=await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]));
 for(const mode of ['base','dark']){await page.getByLabel('Appearance').selectOption(mode);await page.getByLabel('Palette').selectOption('blue');const base=page.getByRole('region',{name:'Base preview',exact:true});await base.getByRole('button',{name:'Open calendar for Delivery date',exact:true}).click();await expect(base.getByRole('dialog')).toBeVisible();await expect(base.locator('[part~=selected-day]')).toHaveCount(1);await page.keyboard.press('Escape');expect(await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]))).toEqual(before);}
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:test.info().outputPath('date-picker-dark-blue-mobile.png'),fullPage:true});
});

test('date-only submission and calendar navigation are stable across time zones and DST',async({browser})=>{
 for(const timezoneId of ['America/Los_Angeles','Pacific/Kiritimati']){
  const context=await browser.newContext({timezoneId});try{const page=await context.newPage();await bare(page);await page.locator('#date').evaluate(host=>host.value='2028-03-12');await expect(page.locator('#date input')).toHaveValue('03/12/2028');await open(page);await expect(day(page,'2028-03-12')).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');expect(await entries(page)).toEqual([['date','2028-03-13']]);}finally{await context.close();}
 }
});

test('invalid-field revelation and nested shadcn popup themes preserve native form ownership',async({page})=>{
 await bare(page);await page.addStyleTag({url:'/dist/shadcn.css'});
 await page.locator('#form').evaluate(form=>{form.classList.add('hp-shadcn');form.style.setProperty('--popover','#fef3c7');form.style.setProperty('--popover-foreground','#78350f');const tabs=document.createElement('h6-tabs');tabs.setAttribute('aria-label','Delivery details');tabs.innerHTML='<section data-value="first" data-label="Overview">Overview</section><section data-value="second" data-label="Schedule"></section>';const date=form.querySelector('h6-date-picker');date.clear();tabs.children[1].append(date);form.prepend(tabs);});
 await page.locator('#submit').click();await expect(page.getByRole('tab',{name:'Schedule',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('#date input')).toBeFocused();
 await page.locator('#date').evaluate(host=>host.value='2028-02-29');await open(page);await expect(page.locator('#date [part=content]')).toHaveCSS('background-color','rgb(254, 243, 199)');await expect(page.locator('#date [part=content]')).toHaveCSS('color','rgb(120, 53, 15)');
 await page.keyboard.press('Escape');await page.locator('#date').evaluate(host=>host.style.setProperty('--hp-popover','#eff6ff'));await open(page);await expect(page.locator('#date [part=content]')).toHaveCSS('background-color','rgb(239, 246, 255)');expect(await entries(page)).toEqual([['date','2028-02-29']]);
});
