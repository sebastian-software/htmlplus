import { test, expect } from 'playwright/test';

const options = `<option value="AT">Austria</option><option value="DE">Germany</option><option value="NL">Netherlands</option><option value="US">United States</option><option value="XX" disabled>Unavailable</option>`;
const fixture = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><script type="module" src="/dist/src/index.js"></script><style>body{font:14px system-ui;margin:24px}form{max-width:340px}label{display:block;margin-block:16px 8px}fieldset{border:0;padding:0;margin:0}button{margin-block:8px}</style></head><body>
<form id="form"><fieldset id="fields"><label for="select">Delivery country</label><h6-select id="select" name="select" value="DE" required>${options}</h6-select><label for="combo">Search country</label><p id="help">Choose a supplied country.</p><h6-combobox id="combo" name="combo" value="DE" required aria-describedby="help">${options}</h6-combobox></fieldset><button id="after" type="button">After fields</button><button id="submit">Submit</button></form>
<script>window.events=[];document.querySelector('form').addEventListener('input', e=>events.push([e.target.id,'input']));document.querySelector('form').addEventListener('change',e=>events.push([e.target.id,'change']));document.querySelector('form').addEventListener('submit',e=>e.preventDefault());</script></body></html>`;
const entries = page => page.locator('#form').evaluate(form => [...new FormData(form)]);
async function bare(page) {
  await page.route('**/selection-controls', route => route.fulfill({contentType:'text/html',body:fixture}));
  await page.goto('/selection-controls');
  await expect(page.locator('#combo input')).toHaveValue('Germany');
}

test('select commits a supplied identifier once, supports keyboard and clearing, and owns submission', async ({page}) => {
  await bare(page);
  expect(await entries(page)).toEqual([['select','DE'],['combo','DE']]);
  expect(await page.locator('h6-select input, h6-select select, input[type=hidden], h6-combobox input[name]').count()).toBe(0);
  const control=page.getByRole('combobox',{name:'Delivery country',exact:true});
  await control.click();
  await expect(page.getByRole('listbox',{name:'Delivery country options'})).toBeVisible();
  await expect(page.locator('#select [part=positioner]')).toHaveJSProperty('popover','manual');
  await expect(page.getByRole('option',{name:'Unavailable',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.getByRole('option',{name:'Netherlands',exact:true}).click();
  await expect(control).toBeFocused();
  expect(await entries(page)).toEqual([['select','NL'],['combo','DE']]);
  expect(await page.evaluate(()=>events)).toEqual([['select','input'],['select','change']]);
  await control.press('Enter');
  await expect(page.getByRole('listbox',{name:'Delivery country options'})).toBeFocused();
  await page.keyboard.press('Home');await page.keyboard.press('Enter');
  await expect.poll(()=>page.locator('#select').evaluate(host=>host.value)).toBe('AT');
  await page.getByRole('button',{name:'Clear Delivery country',exact:true}).click();
  expect(await page.locator('#select').evaluate(host=>[host.value,host.validity.valueMissing])).toEqual(['',true]);
});

test('combobox search invalidates the old identifier, filters, selects, and never submits free text', async ({page}) => {
  await bare(page);
  const input=page.getByRole('combobox',{name:'Search country',exact:true});
  await input.fill('net');
  expect(await entries(page)).toEqual([['select','DE']]);
  expect(await page.evaluate(()=>events)).toEqual([['combo','input'],['combo','change']]);
  await expect(page.getByRole('option',{name:'Netherlands',exact:true})).toBeVisible();
  await expect(page.locator('#combo [part~=option]:visible')).toHaveCount(1);
  await input.press('ArrowDown');await input.press('Enter');
  await expect(input).toHaveValue('Netherlands');
  expect(await entries(page)).toEqual([['select','DE'],['combo','NL']]);
  await expect(input).toBeFocused();
  await input.fill('nowhere');
  await expect(page.getByRole('status')).toHaveText('No options found.');
  await input.press('Enter');await input.press('Escape');
  await expect(input).toHaveValue('nowhere');
  expect(await page.locator('#combo').evaluate(host=>[host.value,host.query,host.validity.valueMissing])).toEqual(['','nowhere',true]);
  await input.fill('Germany');await input.press('Tab');
  expect(await entries(page)).toEqual([['select','DE']]);
});

test('programmatic values, dirty defaults, reset, restore, fieldsets, readonly, and reconnect are silent', async ({page}) => {
  await bare(page);
  await page.evaluate(()=>{for(const host of document.querySelectorAll('h6-select,h6-combobox')){host.value='NL';host.defaultValue='AT';}});
  expect(await entries(page)).toEqual([['select','NL'],['combo','NL']]);
  expect(await page.evaluate(()=>events)).toEqual([]);
  await page.locator('#fields').evaluate(fieldset=>fieldset.disabled=true);
  expect(await entries(page)).toEqual([]);await expect(page.locator('#combo input')).toBeDisabled();
  await page.locator('#fields').evaluate(fieldset=>fieldset.disabled=false);
  await page.evaluate(()=>{for(const host of document.querySelectorAll('h6-select,h6-combobox'))host.readOnly=true;});
  await page.locator('#select [part=trigger]').click();await page.locator('#combo input').press('ArrowDown');
  await expect(page.locator('[part=positioner]:visible')).toHaveCount(0);
  expect(await entries(page)).toEqual([['select','NL'],['combo','NL']]);
  await page.locator('#form').evaluate(form=>form.reset());
  expect(await entries(page)).toEqual([['select','AT'],['combo','AT']]);
  await page.evaluate(()=>{for(const host of document.querySelectorAll('h6-select,h6-combobox')){host.readOnly=false;host.formStateRestoreCallback('["US","United States"]');host.remove();document.querySelector('#fields').append(host);}});
  expect(await entries(page)).toEqual([['select','US'],['combo','US']]);
  await page.locator('#select [part=trigger]').click();await page.getByRole('option',{name:'Germany',exact:true}).click();
  expect(await page.evaluate(()=>events)).toEqual([['select','input'],['select','change']]);
  await page.locator('#combo').evaluate(host=>host.setCustomValidity('Choose an eligible destination.'));
  expect(await page.locator('#combo').evaluate(host=>[host.validity.customError,host.validationMessage])).toEqual([true,'Choose an eligible destination.']);
  await page.locator('#combo').evaluate(host=>{host.value='DE';host.setCustomValidity('');});
  expect(await page.locator('#combo').evaluate(host=>host.validity.valid)).toBe(true);
});

test('labels, descriptions, option changes, separate instances, and external forms stay scoped', async ({page}) => {
  await bare(page);
  await page.getByText('Search country',{exact:true}).click();await expect(page.locator('#combo input')).toBeFocused();
  await expect(page.locator('#combo input')).toHaveAttribute('aria-description','Choose a supplied country.');
  await page.locator('#combo').evaluate(host=>{host.query='ger';host.setAttribute('form','external');const form=document.createElement('form');form.id='external';document.body.append(form);});
  expect(await entries(page)).toEqual([['select','DE']]);
  await page.locator('#combo').evaluate(host=>host.value='US');
  expect(await page.locator('#external').evaluate(form=>[...new FormData(form)])).toEqual([['combo','US']]);
  await page.locator('#combo option[value=US]').evaluate(option=>option.disabled=true);
  await expect.poll(()=>page.locator('#combo').evaluate(host=>host.value)).toBe('');
  expect(await page.locator('#external').evaluate(form=>[...new FormData(form)])).toEqual([]);
  await page.locator('#select option[value=DE]').evaluate(option=>option.label='Deutschland');
  await expect(page.locator('#select [part=value-text]')).toHaveText('Deutschland');
  await page.locator('#select').evaluate(host=>{host.insertAdjacentHTML('beforeend','<option value="DE">Duplicate</option><option value="JP">Japan</option>');});
  await page.locator('#select [part=trigger]').click();await expect(page.locator('#select [part~=option][data-value=DE]')).toHaveCount(1);
  await page.getByRole('option',{name:'Japan',exact:true}).click();
  expect(await entries(page)).toEqual([['select','JP']]);
  await page.locator('#select option[value=JP]').evaluate(option=>option.disabled=true);
  await expect(page.getByRole('button',{name:'Clear Delivery country',exact:true})).toBeHidden();
  expect(await entries(page)).toEqual([]);
  await page.locator('#select option[value=JP]').evaluate(option=>option.disabled=false);
  expect(await page.locator('#select').evaluate(host=>host.value)).toBe('');
});

test('native query editing retains undo and composition while the committed selection stays separate', async ({page}) => {
  await bare(page);
  const input=page.locator('#combo input');
  await input.focus();await expect(page.locator('#combo [part=control]')).toHaveCSS('outline-style','solid');await input.press('End');await input.pressSequentially('x');
  await expect(input).toHaveValue('Germanyx');
  await input.press('ControlOrMeta+z');await expect(input).toHaveValue('Germany');
  expect(await page.locator('#combo').evaluate(host=>host.value)).toBe('');
  await input.evaluate(input=>{input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));input.value='日本';input.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,isComposing:true,data:'日本'}));});
  await expect(input).toHaveValue('日本');
  expect(await entries(page)).toEqual([['select','DE']]);
  await input.evaluate(input=>input.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'日本'})));
  await expect(input).toHaveValue('日本');
  await expect(page.getByRole('status')).toHaveText('No options found.');
});

test('top-layer popups escape clipping, flip at viewport edges, dismiss, and preserve focus order', async ({page}) => {
  await bare(page);await page.setViewportSize({width:390,height:600});
  await page.locator('#form').evaluate(form=>{form.style.cssText='max-width:340px;position:fixed;bottom:8px;left:16px;right:16px';const fields=form.querySelector('fieldset');fields.style.cssText='height:190px;overflow:hidden';});
  const select=page.locator('#select [part=trigger]');await select.click();
  const popup=page.locator('#select [part=positioner]');
  await expect.poll(()=>popup.evaluate(el=>el.matches(':popover-open'))).toBe(true);
  await expect.poll(()=>popup.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight-4)).toBe(true);
  await page.getByRole('option',{name:'Austria',exact:true}).click();
  await expect(select).toBeFocused();
  await select.click();await page.keyboard.press('Escape');await expect(select).toBeFocused();await expect(popup).toBeHidden();
  await select.click();await page.getByRole('button',{name:'After fields',exact:true}).click();await expect(popup).toBeHidden();
  await page.locator('#combo input').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
  await expect(page.locator('#combo [part=positioner]')).toBeHidden();
});

test('both recipes theme open popups in light and dark, retain values, and fit mobile', async ({page}) => {
  for(const [tag,label] of [['select','Shipping method'],['combobox','Destination country']]) {
    await page.goto(`/styling.html#h6-${tag}`);
    const before=await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]));
    for(const mode of ['base','dark']) {
      await page.getByLabel('Appearance').selectOption(mode);await page.getByLabel('Palette').selectOption('blue');
      const base=page.getByRole('region',{name:'Base preview',exact:true});
      const control=base.getByRole('combobox',{name:label,exact:true});await control.click();
      if(tag==='combobox')await base.getByRole('button',{name:`Show options for ${label}`,exact:true}).click();
      const popup=base.locator('[part=content]');await expect(popup).toBeVisible();
      const colors=await popup.evaluate(el=>{const css=getComputedStyle(el);return [css.backgroundColor,css.color]});
      expect(colors[0]).not.toBe(colors[1]);
      await page.keyboard.press('Escape');
      expect(await page.locator('.recipe-form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]))).toEqual(before);
    }
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:test.info().outputPath(`${tag}-dark-blue-mobile.png`),fullPage:true});
  }
});


test('new controls honor native invalid-field revelation and local shadcn popup tokens', async ({page}) => {
  await bare(page);
  await page.addStyleTag({url:'/dist/shadcn.css'});
  await page.locator('#form').evaluate(form=>{
    form.classList.add('hp-shadcn');
    form.style.setProperty('--popover','#fef3c7');form.style.setProperty('--popover-foreground','#78350f');
    const tabs=document.createElement('h6-tabs');tabs.id='tabs';tabs.setAttribute('aria-label','Destinations');
    tabs.innerHTML='<section data-value="a" data-label="First"><input name="ordinary" value="kept"></section><section data-value="b" data-label="Second"></section>';
    const select=form.querySelector('h6-select');select.value='';tabs.children[1].append(select);form.prepend(tabs);
  });
  await page.locator('#submit').click();
  await expect(page.getByRole('tab',{name:'Second',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#select [part=trigger]')).toBeFocused();
  await page.locator('#select [part=trigger]').click();
  await expect(page.locator('#select [part=content]')).toHaveCSS('background-color','rgb(254, 243, 199)');
  await expect(page.locator('#select [part=content]')).toHaveCSS('color','rgb(120, 53, 15)');
  await page.keyboard.press('Escape');
  await page.locator('#select').evaluate(host=>{host.style.setProperty('--popover','#172554');host.style.setProperty('--popover-foreground','#eff6ff');});
  await page.locator('#select [part=trigger]').click();
  await expect(page.locator('#select [part=content]')).toHaveCSS('background-color','rgb(23, 37, 84)');
  await page.getByRole('option',{name:'Netherlands',exact:true}).click();
  expect((await entries(page)).filter(([name])=>name==='select')).toEqual([['select','NL']]);
  await page.locator('#combo').evaluate(host=>{host.query='no match';host.formStateRestoreCallback('["","unanswered query"]');});
  await expect(page.locator('#combo input')).toHaveValue('unanswered query');
  expect((await entries(page)).some(([name])=>name==='combo')).toBe(false);
});
