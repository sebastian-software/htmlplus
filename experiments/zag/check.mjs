import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

await build({ entryPoints: ['probe.js'], bundle: true, format: 'esm', minify: true, outfile: 'probe.bundle.js', define: { 'process.env.NODE_ENV': '"production"' } });
const bundle = await readFile('probe.bundle.js');
const html = `<!doctype html><meta charset="utf-8"><title>Zag FACE compatibility probe</title>
<style>body { padding: 24px; } fieldset { margin-bottom: 160px; }</style>
<form><fieldset><probe-combobox name="country" required></probe-combobox>
<probe-combobox name="secondary" value="NL"></probe-combobox></fieldset>
<button id="reset" type="reset">Reset</button><button id="outside" type="button">Outside</button></form>
<script type="module" src="/probe.js"></script>`;
const server = createServer((req, res) => { res.setHeader('Content-Type', req.url === '/probe.js' ? 'text/javascript' : 'text/html'); res.end(req.url === '/probe.js' ? bundle : html); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  for (const [name, engine] of Object.entries({ chromium, webkit })) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(() => window.ready === true);
      const field = page.locator('probe-combobox').first();
      const input = field.locator('input');
      const entries = () => page.evaluate(() => [...new FormData(document.querySelector('form'))]);
      const valid = () => page.evaluate(() => document.querySelector('form').checkValidity());
      assert.deepEqual(await entries(), [['secondary', 'NL']]);
      assert.equal(await valid(), false);
      await input.fill('Ger');
      await page.waitForFunction(() => document.querySelector('probe-combobox').machine.prop('collection').items.length === 1);
      await input.press('ArrowDown');
      await input.press('Enter');
      await page.waitForFunction(() => document.querySelector('probe-combobox').value === 'DE');
      assert.deepEqual(await entries(), [['country', 'DE'], ['secondary', 'NL']]);
      assert.equal(await input.inputValue(), 'Germany');
      assert.equal(await valid(), true);
      assert.equal(await field.locator('input[type=hidden],select').count(), 0);
      assert.equal(await page.locator('input[type=hidden],select').count(), 0);
      const ids = await page.evaluate(() => [...document.querySelectorAll('probe-combobox')].map(host => host.root.querySelector('input').id));
      assert.notEqual(ids[0], ids[1]);
      await input.press('ArrowDown');
      await input.press('Escape');
      assert.equal(await input.getAttribute('aria-expanded'), 'false');
      await input.press('ArrowDown');
      await page.locator('#outside').click();
      await page.waitForFunction(() => document.querySelector('probe-combobox').root.querySelector('input').getAttribute('aria-expanded') === 'false');
      await page.evaluate(() => document.querySelector('fieldset').disabled = true);
      assert.deepEqual(await entries(), []);
      assert.equal(await input.isDisabled(), true);
      await page.evaluate(() => document.querySelector('fieldset').disabled = false);
      assert.equal(await input.isEnabled(), true);
      await page.locator('#reset').click();
      assert.deepEqual(await entries(), [['secondary', 'NL']]);
      assert.equal(await valid(), false);
      await page.evaluate(() => { const host = document.querySelector('probe-combobox'); host.remove(); document.querySelector('fieldset').prepend(host); });
      await input.fill('Aus');
      await page.waitForFunction(() => document.querySelector('probe-combobox').machine.prop('collection').items.length === 1);
      await input.press('ArrowDown');
      await input.press('Enter');
      await page.waitForFunction(() => document.querySelector('probe-combobox').value === 'AT');
      assert.deepEqual(await entries(), [['country', 'AT'], ['secondary', 'NL']]);
      assert.deepEqual(errors, []);
      console.log(`${name}: shadow-root lookup, filtered keyboard selection, canonical FormData, required validity, Escape, outside click, two instances, fieldset disable/reset, reconnect: PASS`);
    } finally { await browser.close(); }
  }
  console.log(JSON.stringify({ bundleBytes: bundle.length, gzipBytes: gzipSync(bundle).length, zagVersion: '1.46.0', scope: 'Isolated combobox + vanilla adapter + fixture; not a complete html6 build' }));
} finally { server.close(); }
