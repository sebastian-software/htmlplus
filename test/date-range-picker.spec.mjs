import { test, expect } from 'playwright/test';
const markup=`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/dist/src/index.js"></script><style>body{font:14px system-ui;margin:24px}form{max-width:360px}label{display:block;margin:12px 0}fieldset{border:0;padding:0;margin:0}#after{position:fixed;right:16px;top:16px}</style></head><body>
<form id="form"><fieldset id="fields"><label for="range">Travel period</label><p id="hint">Choose your travel dates.</p><h6-date-range-picker id="range" name="period" value='["2028-02-28","2028-03-02"]' min="2028-02-01" max="2028-12-31" required aria-describedby="hint"></h6-date-range-picker></fieldset><button id="after" type="button">After range</button><button id="submit">Submit</button></form><script>window.events=[];window.submits=0;for(const type of ['input','change'])document.querySelector('form').addEventListener(type,e=>events.push(type));document.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submits++});</script></body></html>`;
async function bare(page){await page.route('**/range-controls',route=>route.fulfill({contentType:'text/html',body:markup}));await page.goto('/range-controls');await expect(page.getByRole('textbox',{name:'Travel period: Start date',exact:true})).toHaveValue('02/28/2028');}
const entries=page=>page.locator('#form').evaluate(form=>[...new FormData(form)]);
const start=page=>page.getByRole('textbox',{name:'Travel period: Start date',exact:true});
const end=page=>page.getByRole('textbox',{name:'Travel period: End date',exact:true});
const day=(page,value)=>page.locator(`#range [part~=day][data-value="${value}"]`);
const open=page=>page.getByRole('button',{name:'Open calendar for Travel period',exact:true}).click();

test('two-step selection exposes the partial start, hover is a preview, and completion restores focus',async({page})=>{
 await bare(page);expect(await entries(page)).toEqual([['period.start','2028-02-28'],['period.end','2028-03-02']]);expect(await page.locator('h6-date-range-picker input[name],input[type=hidden]').count()).toBe(0);
 await open(page);await day(page,'2028-02-29').click();await expect(page.getByRole('dialog',{name:'Travel period calendar'})).toBeVisible();
 expect(await entries(page)).toEqual([['period.start','2028-02-29']]);expect(await page.locator('#range').evaluate(host=>host.validity.valueMissing)).toBe(true);expect(await page.evaluate(()=>events)).toEqual(['input','change']);
 await day(page,'2028-03-02').hover();await expect(day(page,'2028-03-01')).toHaveAttribute('part',/preview-day/);await expect(page.locator('#range [role=gridcell][data-value="2028-03-01"]')).toHaveAttribute('aria-selected','false');expect(await entries(page)).toEqual([['period.start','2028-02-29']]);expect(await page.evaluate(()=>events)).toEqual(['input','change']);
 await day(page,'2028-03-02').click();expect(await entries(page)).toEqual([['period.start','2028-02-29'],['period.end','2028-03-02']]);await expect(page.getByRole('dialog')).toBeHidden();
 await expect(page.getByRole('button',{name:'Open calendar for Travel period',exact:true})).toBeFocused();expect(await page.evaluate(()=>events)).toEqual(['input','change','input','change']);expect(await page.evaluate(()=>submits)).toBe(0);
 await open(page);await day(page,'2028-02-20').click();expect(await entries(page)).toEqual([['period.start','2028-02-20']]);await expect(day(page,'2028-02-20')).toBeFocused();await page.keyboard.press('ArrowRight');await expect(day(page,'2028-02-21')).toBeFocused();await page.keyboard.press('Enter');expect(await entries(page)).toEqual([['period.start','2028-02-20'],['period.end','2028-02-21']]);
});

test('keyboard selection, reverse calendar picks, same-day ranges, and dismissal keep ordered date boundaries',async({page})=>{
 await bare(page);await start(page).press('Alt+ArrowDown');await expect(day(page,'2028-02-28')).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 expect(await entries(page)).toEqual([['period.start','2028-02-29']]);await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();expect(await entries(page)).toEqual([['period.start','2028-02-29']]);
 await open(page);await expect(day(page,'2028-02-29')).toBeFocused();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');expect(await entries(page)).toEqual([['period.start','2028-02-28'],['period.end','2028-02-29']]);
 await open(page);await day(page,'2028-02-28').click();await day(page,'2028-02-28').click();expect(await entries(page)).toEqual([['period.start','2028-02-28'],['period.end','2028-02-28']]);
 await open(page);await page.locator('#range [part=view-button]').click();await expect(page.locator('#range [part~=month]:visible')).toHaveCount(12);await page.locator('#range [part=view-button]').click();await expect(page.locator('#range [part~=year]:visible')).toHaveCount(10);await page.locator('#after').click();await expect(page.getByRole('dialog')).toBeHidden();
});

test('typing preserves drafts and inverted ranges, targets missing end on submit, and retains out-of-range ISO values',async({page})=>{
 await bare(page);await end(page).fill('02/30/2028');expect(await entries(page)).toEqual([['period.start','2028-02-28']]);expect(await page.locator('#range').evaluate(host=>host.validity.badInput)).toBe(true);await end(page).press('Tab');await expect(end(page)).toHaveValue('02/30/2028');
 await end(page).fill('');await page.locator('#submit').click();await expect(end(page)).toBeFocused();expect(await page.evaluate(()=>submits)).toBe(0);
 await end(page).fill('2028-02-27');expect(await entries(page)).toEqual([['period.start','2028-02-28'],['period.end','2028-02-27']]);expect(await page.locator('#range').evaluate(host=>host.validationMessage)).toContain('start date must not exceed');
 await open(page);await expect(page.locator('#range [part~=selected-day]')).toHaveCount(0);await page.keyboard.press('Escape');await expect(end(page)).toHaveValue('2028-02-27');
 await start(page).fill('2028-01-31');expect(await page.locator('#range').evaluate(host=>host.validity.rangeUnderflow)).toBe(true);expect(await entries(page)).toEqual([['period.start','2028-01-31'],['period.end','2028-02-27']]);
 await start(page).fill('2028-02-29');await end(page).fill('2029-01-01');expect(await page.locator('#range').evaluate(host=>host.validity.rangeOverflow)).toBe(true);
 await end(page).fill('2028-03-02');await end(page).press('Enter');await page.locator('#submit').click();expect(await page.evaluate(()=>submits)).toBe(1);await expect(start(page)).toHaveValue('2028-02-29');await expect(end(page)).toHaveValue('2028-03-02');
});

test('programmatic tuples, names, optional partials, reset, disabled fieldsets, readonly, and custom errors stay silent',async({page})=>{
 await bare(page);await page.locator('#range').evaluate(host=>{host.value=['2028-06-15','2028-06-20'];host.defaultValue=['2028-04-03','2028-04-05'];host.startName='arrival';host.endName='departure';});expect(await entries(page)).toEqual([['arrival','2028-06-15'],['departure','2028-06-20']]);expect(await page.evaluate(()=>events)).toEqual([]);
 const invalid=await page.locator('#range').evaluate(host=>{try{host.value=['2028-02-30',null];return false;}catch(e){return e instanceof RangeError;}});expect(invalid).toBe(true);
 await page.locator('#fields').evaluate(fields=>fields.disabled=true);await expect(start(page)).toBeDisabled();await expect(end(page)).toBeDisabled();expect(await entries(page)).toEqual([]);
 await page.locator('#fields').evaluate(fields=>fields.disabled=false);await page.locator('#range').evaluate(host=>host.readOnly=true);await open(page);await expect(page.getByRole('dialog')).toBeHidden();expect(await entries(page)).toEqual([['arrival','2028-06-15'],['departure','2028-06-20']]);
 await page.locator('#form').evaluate(form=>form.reset());expect(await entries(page)).toEqual([['arrival','2028-04-03'],['departure','2028-04-05']]);
 await page.locator('#range').evaluate(host=>{host.readOnly=false;host.setCustomValidity('Dates unavailable.');host.clear();});expect(await page.locator('#range').evaluate(host=>host.validationMessage)).toBe('Dates unavailable.');
 await page.locator('#range').evaluate(host=>{host.setCustomValidity('');host.required=false;});expect(await page.locator('#range').evaluate(host=>host.checkValidity())).toBe(true);
 await page.locator('#range').evaluate(host=>host.value=[null,'2028-04-05']);expect(await entries(page)).toEqual([['departure','2028-04-05']]);expect(await page.locator('#range').evaluate(host=>host.validity.valueMissing)).toBe(true);
 await page.locator('#range').evaluate(host=>host.name='');expect(await entries(page)).toEqual([]);expect(await page.evaluate(()=>events)).toEqual([]);
});

test('locale changes, native undo and caret, composition, restoration, external form ownership, and reconnect preserve editors',async({page})=>{
 await bare(page);await end(page).focus();await end(page).press('End');await end(page).pressSequentially('x');await end(page).press('ControlOrMeta+z');await expect(end(page)).toHaveValue('03/02/2028');
 await end(page).evaluate(input=>input.setSelectionRange(3,5));await page.locator('#range').evaluate(host=>host.value=host.value);expect(await end(page).evaluate(input=>[input.selectionStart,input.selectionEnd])).toEqual([3,5]);
 await page.locator('#range').evaluate(host=>host.locale='de-DE');await expect(start(page)).toHaveValue('28.02.2028');await expect(end(page)).toHaveValue('02.03.2028');
 await end(page).fill('31.');await page.locator('#range').evaluate(host=>host.locale='en-US');await expect(end(page)).toHaveValue('31.');expect(await entries(page)).toEqual([['period.start','2028-02-28']]);
 await end(page).evaluate(input=>{input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value='日';input.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,isComposing:true}));});await expect(end(page)).toHaveValue('日');expect(await entries(page)).toEqual([['period.start','2028-02-28']]);await end(page).evaluate(input=>input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));
 await page.locator('#range').evaluate(host=>{host.formStateRestoreCallback('[["2028-02-28",null],["02/28/2028","03/"],"en-US"]');host.remove();document.querySelector('#fields').append(host);});await expect(end(page)).toHaveValue('03/');
 await page.locator('#range').evaluate(host=>{host.formStateRestoreCallback('[["2028-02-28","2028-03-02"],["28.02.2028","02.03.2028"],"de-DE"]');const form=document.createElement('form');form.id='external';document.body.append(form);host.setAttribute('form','external');});await expect(end(page)).toHaveValue('03/02/2028');expect(await entries(page)).toEqual([]);expect(await page.locator('#external').evaluate(form=>[...new FormData(form)])).toEqual([['period.start','2028-02-28'],['period.end','2028-03-02']]);
});

test('labels, inclusive bounds, invalid configuration, nested themes, clearing, and clipped mobile popups work',async({page})=>{
 await bare(page);await page.getByText('Travel period',{exact:true}).click();await expect(start(page)).toBeFocused();await expect(end(page)).toHaveAttribute('aria-description',/Choose your travel dates/);
 await page.addStyleTag({url:'/dist/shadcn.css'});await page.locator('#form').evaluate(form=>{form.classList.add('hp-shadcn');form.style.setProperty('--popover','#fef3c7');form.style.setProperty('--popover-foreground','#78350f');});
 await page.locator('#range').evaluate(host=>{host.min='2028-02-28';host.max='2028-03-02';});await open(page);await expect(day(page,'2028-02-27')).toHaveAttribute('aria-disabled','true');await day(page,'2028-02-27').dispatchEvent('click');expect(await entries(page)).toEqual([['period.start','2028-02-28'],['period.end','2028-03-02']]);await expect(page.locator('#range [part=content]')).toHaveCSS('background-color','rgb(254, 243, 199)');await expect(page.locator('#range [part=content]')).toHaveCSS('color','rgb(120, 53, 15)');await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:600});await page.locator('#form').evaluate(form=>{form.style.cssText='position:fixed;bottom:8px;left:16px;right:16px';form.querySelector('fieldset').style.cssText='height:180px;overflow:hidden';});await open(page);await expect.poll(()=>page.locator('#range [part=positioner]').evaluate(el=>el.matches(':popover-open'))).toBe(true);await day(page,'2028-02-28').click();await day(page,'2028-03-02').click();
 await page.getByRole('button',{name:'Clear Travel period',exact:true}).click();expect(await entries(page)).toEqual([]);await expect(start(page)).toBeFocused();
 await page.locator('#range').evaluate(host=>{host.min='2028-03-02';host.max='2028-02-01';});expect(await page.locator('#range').evaluate(host=>host.validity.customError)).toBe(true);await page.locator('#range').evaluate(host=>host.showPicker());await expect(page.getByRole('dialog')).toBeHidden();
});

test('range recipes and live playground expose two ISO entries in Light/Dark without theme-induced value changes',async({page})=>{
 await page.goto('/styling.html#h6-date-range-picker');const before=await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]));expect(before[0]).toEqual([['period.start','2026-10-28'],['period.end','2026-11-03']]);
 for(const mode of ['base','dark']){await page.getByLabel('Appearance').selectOption(mode);await page.getByLabel('Palette').selectOption('blue');for(const name of ['Base preview','Outlined range preview']){const preview=page.getByRole('region',{name,exact:true});await preview.getByRole('button',{name:'Open calendar for Travel period',exact:true}).click();await expect(preview.getByRole('dialog')).toBeVisible();await expect(preview.locator('[part~=range-start]')).toHaveCount(1);await expect(preview.locator('[part~=in-range]')).toHaveCount(7);await page.keyboard.press('Escape');}expect(await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]))).toEqual(before);}
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:test.info().outputPath('date-range-dark-blue-mobile.png'),fullPage:true});
 await page.goto('/#date-range-example');await expect(page.getByText('23 entries',{exact:true})).toBeVisible();await page.locator('#date-range-field [part~=end-input]').fill('11/');await expect(page.getByText('22 entries',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Load example',exact:true}).click();await expect(page.getByText('23 entries',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Submit demo',exact:true}).click();await expect(page.locator('#submission-status')).toContainText('Captured 23 entries');
});

test('date-only ranges cross DST without shifting boundaries in opposite time zones',async({browser})=>{
 for(const timezoneId of ['America/Los_Angeles','Pacific/Kiritimati']){const context=await browser.newContext({timezoneId});try{const page=await context.newPage();await bare(page);await page.locator('#range').evaluate(host=>host.value=['2028-03-11','2028-03-13']);await open(page);await expect(day(page,'2028-03-11')).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await expect(day(page,'2028-03-13')).toBeFocused();await page.keyboard.press('Enter');expect(await entries(page)).toEqual([['period.start','2028-03-12'],['period.end','2028-03-13']]);}finally{await context.close();}}
});


test('clearing a partial range restarts at the start, and invalid end dates reveal their containing tab',async({page})=>{
 await bare(page);await open(page);await day(page,'2028-02-20').click();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Clear Travel period',exact:true}).click();await open(page);await day(page,'2028-02-10').click();expect(await entries(page)).toEqual([['period.start','2028-02-10']]);await page.keyboard.press('Escape');
 await page.locator('#form').evaluate(form=>{const tabs=document.createElement('h6-tabs');tabs.setAttribute('aria-label','Travel details');tabs.innerHTML='<section data-value="first" data-label="Overview">Overview</section><section data-value="dates" data-label="Dates"></section>';tabs.children[1].append(form.querySelector('h6-date-range-picker'));form.prepend(tabs);});
 await page.locator('#submit').click();await expect(page.getByRole('tab',{name:'Dates',exact:true})).toHaveAttribute('aria-selected','true');await expect(end(page)).toBeFocused();
});
