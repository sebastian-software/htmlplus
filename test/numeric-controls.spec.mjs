import { test, expect } from 'playwright/test';

const markup=`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><script type="module" src="/dist/src/index.js"></script></head><body>
<form id="numeric-form"><fieldset id="fields">
<label for="level">Output level</label><h6-slider id="level" name="level" min="0" max="100" step="5" value="20"></h6-slider>
<label for="price">Price filter</label><h6-range-slider id="price" name="price" value="[20,80]" step="5"></h6-range-slider>
<label for="rating">Experience</label><h6-rating id="rating" name="rating" required></h6-rating>
</fieldset><button type="submit">Submit</button></form></body></html>`;
async function bare(page) {
 await page.route('**/numeric-controls', route=>route.fulfill({contentType:'text/html',body:markup}));
 await page.goto('/numeric-controls');
 await page.waitForFunction(()=>document.querySelector('h6-rating')?.shadowRoot?.querySelector('[role=radio]'));
 await page.evaluate(()=>{ window.events=[];window.submits=0;const form=document.querySelector('form');for(const type of ['input','change']) form.addEventListener(type,event=>window.events.push([event.target.id,type]));form.addEventListener('submit',event=>{event.preventDefault();window.submits++;}); });
}
const entries=page=>page.locator('#numeric-form').evaluate(form=>[...new FormData(form)]);
test.beforeEach(async({page})=>bare(page));

test('slider keys, programmatic snapping, dirty defaults, reset, and events keep a native form contract', async({page})=>{
 const control=page.locator('#level');const thumb=page.getByRole('slider',{name:'Output level',exact:true});
 await page.getByText('Output level',{exact:true}).click();await expect(thumb).toBeFocused();
 await thumb.press('ArrowRight');await expect(thumb).toHaveAttribute('aria-valuenow','25');
 expect((await entries(page)).find(([key])=>key==='level')).toEqual(['level','25']);
 await expect.poll(()=>page.evaluate(()=>window.events)).toEqual([['level','input'],['level','change']]);
 const result=await control.evaluate(host=>{host.value=32;host.defaultValue=10;return {value:host.value,default:host.defaultValue};});
 expect(result).toEqual({value:30,default:10});expect(await page.evaluate(()=>window.events.length)).toBe(2);
 await page.locator('#numeric-form').evaluate(form=>form.reset());await expect(thumb).toHaveAttribute('aria-valuenow','10');
 await thumb.press('End');await expect(thumb).toHaveAttribute('aria-valuenow','100');
 await thumb.press('Home');await expect(thumb).toHaveAttribute('aria-valuenow','0');
 await thumb.press('PageUp');await expect(thumb).toHaveAttribute('aria-valuenow','50');
 expect(await page.evaluate(()=>window.submits)).toBe(0);
});

test('range thumbs retain identities, stop at collision, and submit explicitly named boundaries',async({page})=>{
 const lower=page.getByRole('slider',{name:'Price filter: Minimum',exact:true}),upper=page.getByRole('slider',{name:'Price filter: Maximum',exact:true});
 await lower.focus();await lower.press('End');await expect(lower).toHaveAttribute('aria-valuenow','80');await expect(upper).toHaveAttribute('aria-valuenow','80');
 await lower.press('ArrowRight');expect(await page.locator('#price').evaluate(host=>host.value)).toEqual([80,80]);
 await upper.press('Home');await expect(upper).toHaveAttribute('aria-valuemin','80');
 const result=await page.locator('#price').evaluate(host=>{let rejected=false;try{host.value=[90,10];}catch{rejected=true;}host.value=[23,87];host.setAttribute('lower-name','from');host.setAttribute('upper-name','to');return {rejected,value:host.value};});
 expect(result).toEqual({rejected:true,value:[25,85]});
 expect((await entries(page)).filter(([key])=>['from','to'].includes(key))).toEqual([['from','25'],['to','85']]);
 await page.locator('#price').evaluate(host=>host.removeAttribute('name'));expect((await entries(page)).some(([key])=>['from','to'].includes(key))).toBe(false);
 expect(await page.locator('h6-slider input, h6-range-slider input, h6-rating input').count()).toBe(0);
});

test('rating separates unanswered, hover preview, committed score, clear, and required validation',async({page})=>{
 const host=page.locator('#rating'),group=page.getByRole('radiogroup',{name:'Experience',exact:true});
 await expect(group.locator('[aria-checked=true]')).toHaveCount(0);expect(await host.evaluate(host=>host.value)).toBe(null);
 await page.getByRole('radio',{name:'5 of 5',exact:true}).hover();expect(await host.evaluate(host=>host.value)).toBe(null);
 await expect(group.locator('[aria-checked=true]')).toHaveCount(0);expect((await entries(page)).some(([key])=>key==='rating')).toBe(false);
 await page.getByRole('button',{name:'Submit',exact:true}).click();expect(await page.evaluate(()=>window.submits)).toBe(0);
 await expect(page.getByRole('radio',{name:'1 of 5',exact:true})).toBeFocused();
 await page.getByRole('radio',{name:'3 of 5',exact:true}).click();await expect(group.locator('[aria-checked=true]')).toHaveAttribute('aria-label','3 of 5');
 // Keyboard works immediately after clicking, even while the pointer still hovers a star.
 await page.getByRole('radio',{name:'3 of 5',exact:true}).press('ArrowRight');expect(await host.evaluate(host=>host.value)).toBe(4);
 await page.getByRole('button',{name:'Clear Experience',exact:true}).click();expect(await host.evaluate(host=>host.value)).toBe(null);
 await expect(page.getByRole('radio',{name:'1 of 5',exact:true})).toBeFocused();
 expect(await host.evaluate(host=>host.validity.valueMissing)).toBe(true);await expect(group.locator('[aria-checked=true]')).toHaveCount(0);
 const result=await host.evaluate(host=>{host.value=2;host.defaultValue=1;return {current:host.value,default:host.defaultValue};});expect(result).toEqual({current:2,default:1});
 await page.locator('#numeric-form').evaluate(form=>form.reset());expect(await host.evaluate(host=>host.value)).toBe(1);
});

test('disabled fieldsets, readonly controls, external forms, restoration, and reconnects preserve values',async({page})=>{
 await page.locator('#rating').evaluate(host=>host.value=4);const before=await entries(page);
 await page.locator('#fields').evaluate(fieldset=>fieldset.disabled=true);expect(await entries(page)).toEqual([]);
 await expect(page.getByRole('radio',{name:'4 of 5',exact:true})).toBeDisabled();
 await page.locator('#fields').evaluate(fieldset=>fieldset.disabled=false);expect(await entries(page)).toEqual(before);
 await page.locator('#level').evaluate(host=>host.readOnly=true);await page.getByRole('slider',{name:'Output level',exact:true}).press('ArrowRight');expect(await page.locator('#level').evaluate(host=>host.value)).toBe(20);
 await page.locator('#rating').evaluate(host=>host.readOnly=true);await page.getByRole('radio',{name:'5 of 5',exact:true}).click();expect(await page.locator('#rating').evaluate(host=>host.value)).toBe(4);
 await page.evaluate(()=>{for(const tag of ['h6-slider','h6-range-slider','h6-rating']){const host=document.querySelector(tag);host.readOnly=false;host.remove();document.querySelector('#fields').append(host);}window.events=[];});
 await page.getByRole('slider',{name:'Output level',exact:true}).press('ArrowRight');await expect.poll(()=>page.evaluate(()=>window.events)).toEqual([['level','input'],['level','change']]);
 const restored=await page.evaluate(()=>{const level=document.querySelector('#level'),price=document.querySelector('#price'),rating=document.querySelector('#rating');level.formStateRestoreCallback('[45]');price.formStateRestoreCallback('[30,70]');rating.formStateRestoreCallback('3');return [level.value,price.value,rating.value];});expect(restored).toEqual([45,[30,70],3]);
 await page.locator('#level').evaluate(host=>{host.setAttribute('form','numeric-form');document.body.append(host);});
 expect((await entries(page)).find(([key])=>key==='level')).toEqual(['level','45']);
});

test('decimal bounds, invalid configurations, count changes, and custom errors behave deliberately',async({page})=>{
 const result=await page.locator('#level').evaluate(host=>{host.min=-1;host.max=1;host.step=.1;host.value=.26;let rejected=false;try{host.value=NaN;}catch{rejected=true;}return {value:host.value,rejected};});expect(result).toEqual({value:.3,rejected:true});
 await page.locator('#level').evaluate(host=>host.setAttribute('step','0'));expect(await page.locator('#level').evaluate(host=>host.validity.customError)).toBe(true);
 expect((await entries(page)).some(([key])=>key==='level')).toBe(false);
 await page.locator('#level').evaluate(host=>host.step=.1);expect(await page.locator('#level').evaluate(host=>host.validity.valid)).toBe(true);
 await page.locator('#level').evaluate(host=>{host.min=3;host.max=10;host.step=4;host.value=3;});
 const thumb=page.getByRole('slider',{name:'Output level',exact:true});await thumb.focus();await thumb.press('End');await expect(thumb).toHaveAttribute('aria-valuenow','7');
 expect((await entries(page)).find(([key])=>key==='level')).toEqual(['level','7']);
 await page.locator('#level').evaluate(host=>{host.step=20;host.value=3;});await thumb.press('End');await expect(thumb).toHaveAttribute('aria-valuenow','3');
 const rating=page.locator('#rating');await rating.evaluate(host=>{host.value=5;host.count=3;host.setCustomValidity('Already rated');});
 expect(await rating.evaluate(host=>host.value)).toBe(3);await expect(rating.locator('[role=radio]')).toHaveCount(3);
 expect(await rating.evaluate(host=>host.validationMessage)).toBe('Already rated');
 await rating.evaluate(host=>{host.value=2;host.setCustomValidity('');});expect(await rating.evaluate(host=>host.validity.valid)).toBe(true);
});

test('pointer dragging commits once, track taps work, and RTL and vertical keys use Zag geometry',async({page,browser})=>{
 await page.locator('#level').evaluate(host=>host.addEventListener('input',()=>{host.value=host.value;}));
 const thumb=page.getByRole('slider',{name:'Output level',exact:true});const box=await thumb.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+250,box.y+box.height/2,{steps:5});await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>window.events.filter(([key,type])=>key==='level'&&type==='change').length)).toBe(1);
 expect(await page.locator('#level').evaluate(host=>host.value)).toBeGreaterThan(20);
 await page.locator('#level').evaluate(host=>{host.value=50;host.setAttribute('dir','rtl');});await thumb.focus();await thumb.press('ArrowLeft');await expect(thumb).toHaveAttribute('aria-valuenow','55');
 await page.locator('#level').evaluate(host=>{host.setAttribute('dir','ltr');host.orientation='vertical';});await thumb.press('ArrowUp');await expect(thumb).toHaveAttribute('aria-valuenow','60');
 const touchContext=await browser.newContext({hasTouch:true,viewport:{width:390,height:844},baseURL:'http://127.0.0.1:48164'});const touchPage=await touchContext.newPage();
 try {await bare(touchPage);const control=await touchPage.locator('#level [part=control]').boundingBox();await touchPage.touchscreen.tap(control.x+control.width*.75,control.y+control.height/2);expect(await touchPage.locator('#level').evaluate(host=>host.value)).toBeGreaterThanOrEqual(70);}finally{await touchContext.close();}
});

test('numeric defaults include usable styles, scale with text, and support nested hp themes and shadcn',async({page})=>{
 for(const selector of ['#level [part~=thumb]','#price [part~=thumb]','#rating [part~=item]']) await expect(page.locator(selector).first()).toHaveCSS('font-size','14px');
 await page.addStyleTag({url:'/dist/shadcn.css'});await page.locator('#fields').evaluate(host=>{host.classList.add('hp-shadcn');host.style.setProperty('--primary','#166534');host.style.setProperty('--hp-ring','#c2410c');});
 const accent=await page.locator('#level [part=range]').evaluate(element=>getComputedStyle(element).backgroundColor);expect(accent).not.toBe('rgb(23, 23, 23)');
 await page.getByRole('radio',{name:'4 of 5',exact:true}).click();await expect(page.locator('#rating [data-checked]')).toHaveCSS('color',accent);
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await expect(page.locator('#level [part~=thumb]')).toHaveCSS('width','48px');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('all palette and appearance combinations preserve form values and style new recipes on mobile',async({page})=>{
 await page.goto('/');const before=await page.locator('#demo-form').evaluate(form=>[...new FormData(form)]);const colors=new Set();
 for(const mode of ['base','dark']) {
  await page.getByLabel('Appearance').selectOption(mode);
  for(const palette of ['neutral','blue','green','orange','rose','utility']) {
   await page.getByLabel('Palette').selectOption(palette);
   await expect(page.locator('html')).toHaveCSS('color-scheme',mode==='dark'?'dark':'light');
   const color=await page.locator('h6-slider [part=range]').evaluate(element=>getComputedStyle(element).backgroundColor);if(mode==='base')colors.add(color);
   const ratios=await page.locator('h6-slider [part=range]').evaluate(element=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
    const luminance=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);const rgb=[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
    const ratio=(a,b)=>{a=luminance(a);b=luminance(b);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
    const color=getComputedStyle(element).backgroundColor,track=getComputedStyle(element.parentElement).backgroundColor,host=getComputedStyle(element.getRootNode().host);
    return[ratio(color,track),ratio(color,host.getPropertyValue('--hp-background'))];
   });
   for(const ratio of ratios)expect(ratio).toBeGreaterThanOrEqual(3);
   expect(await page.locator('#demo-form').evaluate(form=>[...new FormData(form)])).toEqual(before);
  }
 }
 expect(colors.size).toBe(6);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/styling.html#h6-slider');await page.getByLabel('Appearance').selectOption('dark');await page.getByLabel('Palette').selectOption('green');
 for(const name of ['Slider','Range Slider','Rating']){await page.getByRole('navigation',{name:'Components'}).getByRole('link',{name,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const values=await page.locator('.recipe-preview form').evaluateAll(forms=>forms.map(form=>[...new FormData(form)]));expect(values[0]).toEqual(values[1]);}
 await page.screenshot({path:test.info().outputPath('numeric-recipes-dark-green-mobile.png'),fullPage:true});
});
