// Reads each element's public surface from the running browser modules, so the reference cannot drift.
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const check = process.argv.includes("--check");
const port = 48166;

const options = '<option value="a">One</option><option value="b">Two</option>';
const elements = {
  "h6-field": {
    summary: "Shared base styling around a real light-DOM input, textarea, or select.",
    guide: "NATIVE-FIELDS.md",
    markup: "<input>",
  },
  "h6-switch": {
    summary: "On/off setting with a checkbox-like form value.",
    guide: "../README.md#current-value-contract",
  },
  "h6-iban": {
    summary: "IBAN editor with readable groups, canonical submission, and format checks.",
    guide: "FORMATTED-FIELDS.md",
  },
  "h6-bic": {
    summary: "BIC/SWIFT editor with uppercase submission and structure checks.",
    guide: "../README.md#current-value-contract",
  },
  "h6-otp": {
    summary: "One native verification-code editor with visual character slots.",
    guide: "FORMATTED-FIELDS.md",
  },
  "h6-duration": {
    summary: "Elapsed-time notation that submits whole seconds.",
    guide: "../README.md#additional-value-contracts",
  },
  "h6-interval": {
    summary: "Two numeric boundaries with explicit form names and optional open ends.",
    guide: "../README.md#additional-value-contracts",
  },
  "h6-segmented": {
    summary: "Compact single selection using native radio inputs.",
    guide: "../README.md#additional-value-contracts",
    markup: options,
  },
  "h6-tags": {
    summary: "Add and remove tags that submit as repeated entries.",
    guide: "../README.md#current-value-contract",
  },
  "h6-toggle": { summary: "Persistent pressed button with a checkbox-like form value.", guide: "INTERACTIONS.md" },
  "h6-accordion": {
    summary: "Disclosure sections around ordinary form fields.",
    guide: "INTERACTIONS.md",
    markup: '<section data-value="one" data-label="One"><p>Content</p></section>',
  },
  "h6-tabs": {
    summary: "Tabbed panels around ordinary form fields.",
    guide: "INTERACTIONS.md",
    markup: '<section data-value="one" data-label="One"><p>Content</p></section>',
  },
  "h6-slider": { summary: "One bounded number chosen by pointer or keyboard.", guide: "NUMERIC-CHOICES.md" },
  "h6-range-slider": {
    summary: "Two ordered boundaries with explicitly named form entries.",
    guide: "NUMERIC-CHOICES.md",
  },
  "h6-rating": { summary: "Clearable whole score with a separate hover preview.", guide: "NUMERIC-CHOICES.md" },
  "h6-select": {
    summary: "Single selection from supplied options in a top-layer listbox.",
    guide: "SELECTION-CONTROLS.md",
    markup: options,
    attributes: 'value="a"',
  },
  "h6-combobox": {
    summary: "Searchable selection that keeps query and selected identifier apart.",
    guide: "SELECTION-CONTROLS.md",
    markup: options,
    attributes: 'value="a"',
  },
  "h6-date-picker": {
    summary: "Localized date editor and calendar with one ISO form entry.",
    guide: "DATE-PICKER.md",
    open: true,
  },
  "h6-date-range-picker": {
    summary: "Two native editors and a range calendar with two named ISO entries.",
    guide: "DATE-RANGE-PICKER.md",
    open: true,
  },
  "h6-checkbox": {
    summary: "Native checked and mixed states with checkbox-like submission.",
    guide: "EVERYDAY-CONTROLS.md",
  },
  "h6-radio-group": {
    summary: "One supplied identifier, with descriptions and disabled options.",
    guide: "EVERYDAY-CONTROLS.md",
    markup: options,
    attributes: 'value="a"',
  },
  "h6-toggle-group": {
    summary: "Single or multiple selection with repeated form entries.",
    guide: "EVERYDAY-CONTROLS.md",
    markup: options,
    attributes: "value='[\"a\"]'",
  },
  "h6-number-input": {
    summary: "Localized numeric editing, canonical submission, and stepping.",
    guide: "EVERYDAY-CONTROLS.md",
  },
  "h6-password-input": { summary: "Native password editing and a visibility button.", guide: "EVERYDAY-CONTROLS.md" },
};

const server = spawn(process.execPath, ["scripts/serve.mjs", "--port", String(port)], { cwd: root, stdio: "ignore" });
const browser = await chromium.launch();
let surfaces;
try {
  const page = await browser.newPage();
  await page.route(`http://127.0.0.1:${port}/api`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="en-US"><body><script type="module" src="/dist/src/index.js"></script></body></html>',
    }),
  );
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.goto(`http://127.0.0.1:${port}/api`);
      break;
    } catch (error) {
      if (attempt === 20) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  await page.waitForFunction(() => customElements.get("h6-field"));
  surfaces = await page.evaluate(async (elements) => {
    const skip = new Set([
      "constructor",
      "observedAttributes",
      "formAssociated",
      "connectedCallback",
      "disconnectedCallback",
      "attributeChangedCallback",
      "adoptedCallback",
      "formAssociatedCallback",
      "formDisabledCallback",
      "formResetCallback",
      "formStateRestoreCallback",
    ]);
    const result = {};
    for (const [tag, { markup, attributes, open }] of Object.entries(elements)) {
      const holder = document.createElement("form");
      holder.innerHTML = `<${tag} name="field" ${attributes ?? ""}>${markup ?? ""}</${tag}>`;
      document.body.append(holder);
      const element = holder.firstElementChild,
        definition = customElements.get(tag);
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (open) {
        element.showPicker();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const parts = new Set();
      for (const node of element.shadowRoot?.querySelectorAll("[part]") ?? [])
        for (const part of node.part) parts.add(part);
      const properties = new Set(),
        methods = new Set();
      for (
        let proto = definition.prototype;
        proto && proto !== HTMLElement.prototype;
        proto = Object.getPrototypeOf(proto)
      ) {
        for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
          if (skip.has(name)) continue;
          if (typeof descriptor.value === "function") methods.add(name);
          else properties.add(name);
        }
      }
      result[tag] = {
        formAssociated: Boolean(definition.formAssociated),
        attributes: [...(definition.observedAttributes ?? [])].sort(),
        properties: [...properties].sort(),
        methods: [...methods].sort(),
        parts: [...parts].sort(),
      };
      holder.remove();
    }
    return result;
  }, elements);
} finally {
  await browser.close();
  server.kill();
}

const className = (tag) =>
  tag
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

const manifest = {
  schemaVersion: "1.0.0",
  readme: "docs/ELEMENTS.md",
  modules: [
    {
      kind: "javascript-module",
      path: "dist/src/index.js",
      declarations: Object.entries(surfaces).map(([tag, surface]) => ({
        kind: "class",
        customElement: true,
        name: className(tag),
        tagName: tag,
        summary: elements[tag].summary,
        attributes: surface.attributes.map((name) => ({ name })),
        members: [
          ...surface.properties.map((name) => ({ kind: "field", name })),
          ...surface.methods.map((name) => ({ kind: "method", name })),
        ],
        cssParts: surface.parts.map((name) => ({ name })),
      })),
      exports: Object.keys(surfaces).map((tag) => ({
        kind: "custom-element-definition",
        name: tag,
        declaration: { name: className(tag), module: "dist/src/index.js" },
      })),
    },
  ],
};

const list = (items) => (items.length ? items.map((item) => `\`${item}\``).join(", ") : "None");
const reference = [
  "# Element reference",
  "",
  "Generated from the running browser modules by `npm run docs:api`. Do not edit it by hand; `npm test` fails if it is out of date. Behavior, value formats, and events are described in each element's guide. Machine-readable data is in [`custom-elements.json`](../custom-elements.json).",
  "",
  "Parts are the shadow parts present after rendering, including the open calendar for date elements. Options add `option`-related parts where the element renders them.",
  "",
  ...Object.entries(surfaces).flatMap(([tag, surface]) => [
    `## \`${tag}\``,
    "",
    `${elements[tag].summary} [Guide](${elements[tag].guide}) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#${tag})`,
    "",
    `- **Submits through its host:** ${surface.formAssociated ? "yes" : "no"}`,
    `- **Attributes:** ${list(surface.attributes)}`,
    `- **Properties:** ${list(surface.properties)}`,
    `- **Methods:** ${list(surface.methods)}`,
    `- **Parts:** ${list(surface.parts)}`,
    "",
  ]),
].join("\n");

const outputs = { "custom-elements.json": `${JSON.stringify(manifest, null, 2)}\n`, "docs/ELEMENTS.md": reference };
let stale = false;
for (const [path, content] of Object.entries(outputs)) {
  const url = new URL(`../${path}`, import.meta.url);
  if (!check) {
    await writeFile(url, content);
    continue;
  }
  if ((await readFile(url, "utf8").catch(() => "")) !== content) {
    console.error(`${path} is out of date. Run npm run docs:api.`);
    stale = true;
  }
}
if (stale) process.exit(1);
console.log(check ? "Element reference is current." : "Generated custom-elements.json and docs/ELEMENTS.md.");
