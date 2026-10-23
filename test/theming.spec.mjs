import { test, expect } from 'playwright/test';

const markup = `<!doctype html><html lang="en"><head><script type="module" src="/dist/src/index.js"></script></head><body>
<form id="theme-form"><div id="scope">
<h6-iban name="iban" value="DE89370400440532013000" aria-label="IBAN"></h6-iban>
<h6-bic name="bic" value="COBADEFFXXX" aria-label="BIC"></h6-bic>
<h6-otp name="code" value="004271" aria-label="Code"></h6-otp>
<h6-duration name="duration" value="1h" aria-label="Duration"></h6-duration>
<h6-interval name="budget" value="[1,2]" aria-label="Budget"></h6-interval>
<h6-tags name="tags" value='["forms"]' aria-label="Tags"></h6-tags>
<h6-switch name="updates" checked aria-label="Updates"></h6-switch>
<h6-segmented name="delivery" value="a" aria-label="Delivery"><option value="a">A</option><option value="b">B</option></h6-segmented>
<h6-toggle name="priority" pressed>Priority</h6-toggle>
<h6-tabs aria-label="Profile"><section data-value="a" data-label="Profile"><input name="display_name" value="Ada" aria-label="Name"></section></h6-tabs>
<h6-accordion><section data-value="a" data-label="Details"><input name="note" value="Hello" aria-label="Note"></section></h6-accordion>
<div id="nested"><h6-iban id="nested-iban" aria-label="Nested IBAN"></h6-iban></div>
</div></form></body></html>`;
async function bare(page) {
  await page.route('**/theme-controls', route => route.fulfill({ contentType: 'text/html', body: markup }));
  await page.goto('/theme-controls');
  await page.waitForFunction(() => document.querySelector('h6-tabs')?.shadowRoot?.querySelector('[role=tab]'));
}
const data = page => page.locator('#theme-form').evaluate(form => [...new FormData(form)]);

test('public theme tokens inherit through every shadow root and allow nested and host overrides', async ({ page }) => {
  await bare(page);
  const before = await data(page);
  await page.addStyleTag({ content: ':root { --hp-foreground: #123456; --hp-background: #f1f5f9; --hp-radius: 20px; } #nested { --hp-background: #e0f2fe; --hp-radius: 10px; } #nested-iban { --hp-foreground: #0c4a6e; }' });
  for (const tag of ['iban', 'bic', 'otp', 'duration', 'interval', 'tags', 'switch', 'segmented', 'toggle', 'tabs', 'accordion']) {
    await expect(page.locator(`#scope > h6-${tag}`)).toHaveCSS('color', 'rgb(18, 52, 86)');
  }
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('background-color', 'rgb(241, 245, 249)');
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('border-radius', '16px');
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'rgb(224, 242, 254)');
  await expect(page.locator('#nested-iban input')).toHaveCSS('border-radius', '8px');
  await expect(page.locator('#nested-iban input')).toHaveCSS('color', 'rgb(12, 74, 110)');
  expect(await data(page)).toEqual(before);
});

test('primary, accent, secondary, input, border, ring, and destructive retain distinct roles', async ({ page }) => {
  await bare(page);
  await page.addStyleTag({ content: '#scope { --hp-primary:#065f46; --hp-primary-foreground:#ecfdf5; --hp-accent:#fef3c7; --hp-accent-foreground:#78350f; --hp-secondary:#dbeafe; --hp-secondary-foreground:#1e3a8a; --hp-border:#9333ea; --hp-input:#0369a1; --hp-ring:#c2410c; --hp-destructive:#be123c; }' });
  const button = page.locator('h6-toggle button');
  await expect(button).toHaveCSS('background-color', 'rgb(6, 95, 70)');
  await expect(button).toHaveCSS('color', 'rgb(236, 253, 245)');
  await expect(page.locator('h6-switch [part=track]')).toHaveCSS('background-color', 'rgb(6, 95, 70)');
  await expect(page.locator('h6-tags [part=tag]')).toHaveCSS('background-color', 'rgb(219, 234, 254)');
  await expect(page.locator('h6-tags [part=tag]')).toHaveCSS('color', 'rgb(30, 58, 138)');
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('border-color', 'rgb(3, 105, 161)');
  await expect(page.locator('h6-accordion [part=item]')).toHaveCSS('border-bottom-color', 'rgb(147, 51, 234)');
  await button.click(); await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(254, 243, 199)');
  await expect(button).toHaveCSS('color', 'rgb(120, 53, 15)');
  const editor = page.locator('#scope > h6-iban input');
  await editor.focus();
  await expect(editor).toHaveCSS('outline-color', 'rgb(194, 65, 12)');
  await page.locator('#scope > h6-iban').evaluate(host => { host.setCustomValidity('Account rejected'); host.reportValidity(); });
  await expect(editor).toHaveCSS('border-color', 'rgb(190, 18, 60)');
});

test('shadcn adapter resolves nested generic themes locally and preserves prefixed overrides', async ({ page }) => {
  await bare(page);
  await page.addStyleTag({ url: '/dist/shadcn.css' });
  await page.locator('#scope').evaluate(scope => scope.classList.add('hp-shadcn'));
  // An absent application token must leave the component fallback usable.
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.addStyleTag({ content: ':root { --background:#ffffff; --foreground:#171717; --primary:#166534; --radius:10px; } #nested { --background:oklch(0.205 0 0); --foreground:#fafafa; --radius:20px; }' });
  await expect(page.locator('h6-toggle button')).toHaveCSS('background-color', 'rgb(22, 101, 52)');
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'oklch(0.205 0 0)');
  await expect(page.locator('#nested-iban input')).toHaveCSS('color', 'rgb(250, 250, 250)');
  await expect(page.locator('#nested-iban input')).toHaveCSS('border-radius', '16px');
  await page.locator('#nested-iban').evaluate(host => host.style.setProperty('--background', '#262626'));
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'rgb(38, 38, 38)');
  await page.locator('#scope').evaluate(scope => scope.style.setProperty('--hp-background', '#fefce8'));
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'rgb(254, 252, 232)');
  await page.locator('#nested-iban').evaluate(host => host.style.setProperty('--hp-background', '#f0fdf4'));
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'rgb(240, 253, 244)');
  // Attaching the adapter directly to an element also works.
  await page.locator('#scope').evaluate(scope => scope.classList.remove('hp-shadcn'));
  await page.locator('#nested-iban').evaluate(host => { host.classList.add('hp-shadcn'); host.style.removeProperty('--hp-background'); });
  await page.locator('#scope').evaluate(scope => scope.style.removeProperty('--hp-background'));
  await expect(page.locator('#nested-iban input')).toHaveCSS('background-color', 'rgb(38, 38, 38)');
});

test('radius scales derive from local bases and allow zero and explicit size overrides', async ({ page }) => {
  await bare(page);
  await page.addStyleTag({ url: '/dist/shadcn.css' });
  await page.locator('#scope').evaluate(scope => { scope.classList.add('hp-shadcn'); scope.style.setProperty('--radius','10px'); scope.style.setProperty('--radius-md','99px'); });
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('border-radius', '8px');
  await expect(page.locator('h6-tabs [part=list]')).toHaveCSS('border-radius', '10px');
  await expect(page.locator('h6-tabs [part~=tab]')).toHaveCSS('border-radius', '6px');
  await page.locator('#scope').evaluate(scope => scope.style.setProperty('--hp-radius','20px'));
  await expect(page.locator('#scope > h6-iban input')).toHaveCSS('border-radius', '16px');
  await expect(page.locator('h6-tags [part=tag]')).toHaveCSS('border-radius', '12px');
  await page.locator('#scope').evaluate(scope => scope.style.setProperty('--hp-radius','0px'));
  await expect(page.locator('h6-tags [part=tag]')).toHaveCSS('border-radius', '0px');
  await page.locator('h6-tags').evaluate(host => host.style.setProperty('--hp-radius-sm','3px'));
  await expect(page.locator('h6-tags [part=tag]')).toHaveCSS('border-radius', '3px');
  await expect(page.locator('h6-tags [part=control]')).toHaveCSS('border-radius', '0px');
});

test('light, dark, and utility examples preserve edited form data and work on mobile', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name:'Verification code', exact:true }).fill('001234');
  await page.getByRole('button', { name:'Priority handling', exact:true }).click();
  const before = await page.locator('#demo-form').evaluate(form => [...new FormData(form)]);
  for (const mode of ['dark','utility','base']) {
    await page.getByLabel('Appearance').selectOption(mode);
    await expect(page.locator('html')).toHaveCSS('color-scheme', mode==='dark' ? 'dark' : 'light');
    await expect(page.locator('h6-otp input')).toHaveValue('001234');
    expect(await page.locator('#demo-form').evaluate(form => [...new FormData(form)])).toEqual(before);
    await expect(page.locator('h6-toggle button')).toHaveAttribute('aria-pressed','true');
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('.theme-source summary').click();
  await expect(page.locator('#theme-code')).toContainText('.hp-dark');
  expect(await page.locator('#theme-code').textContent()).toBe(await (await request.get('/demo/themes.css')).text());
  await page.goto('/styling.html#h6-tags');
  await page.getByLabel('Appearance').selectOption('dark');
  await expect(page.locator('.recipe-preview').first().locator('[part=control]')).toHaveCSS('background-color','rgb(23, 23, 23)');
  await expect(page.getByLabel('Base form data')).toContainText('html');
});

test('neutral light and dark palettes keep readable text and visible keyboard focus, including forced colors', async ({ page }) => {
  await page.goto('/');
  for (const mode of ['base','dark']) {
    await page.getByLabel('Appearance').selectOption(mode);
    const editor=page.getByRole('textbox', {name:'IBAN',exact:true});
    await editor.focus();
    const ratios=await editor.evaluate(input => {
      const css=getComputedStyle(input), placeholder=getComputedStyle(input,'::placeholder');
      const luminance=value => { const rgb=value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}); return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722; };
      const ratio=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
      return { text:ratio(css.color,css.backgroundColor), placeholder:ratio(placeholder.color,css.backgroundColor), focus:ratio(css.outlineColor,css.backgroundColor), outline:css.outlineStyle };
    });
    expect(ratios.text).toBeGreaterThanOrEqual(4.5);expect(ratios.placeholder).toBeGreaterThanOrEqual(4.5);expect(ratios.focus).toBeGreaterThanOrEqual(3);expect(ratios.outline).toBe('solid');
  }
  await page.emulateMedia({forcedColors:'active'});
  const toggle=page.getByRole('button',{name:'Priority handling',exact:true});
  await toggle.focus();await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(toggle).toHaveCSS('outline-style','solid');
});
