import "./theme.js";
import "./icons.js";
import "../src/index.js";
import { recipes } from "./recipes.js";
import type { StylingRecipe } from "./recipes.js";

const links = document.querySelector<HTMLElement>("#recipe-links")!;
const previews = document.querySelector<HTMLElement>("#recipe-previews")!;
const source = document.querySelector<HTMLElement>("#recipe-code")!;
const copy = document.querySelector<HTMLButtonElement>("#copy-source")!;
const status = document.querySelector<HTMLElement>("#copy-status")!;
const exampleStyle = document.createElement("style");
document.head.append(exampleStyle);
let current: StylingRecipe = recipes[0]!;
let format = "css";
let baseCss = "/* Loading themes.css… */";
let adapterCss = "/* Loading shadcn.css… */";

for (const recipe of recipes) {
  const link = document.createElement("a");
  link.href = `#${recipe.element}`;
  link.textContent = recipe.title;
  link.dataset.element = recipe.element;
  links.append(link);
}

function markup(recipe: StylingRecipe, variant: string, id: string): string {
  const control = recipe.markup.replace(`<${recipe.element} `, `<${recipe.element} id="${id}"${variant ? ` class="${variant}"` : ""} `);
  return `${recipe.field === false ? `<p class="recipe-label">${recipe.label}</p>` : `<label for="${id}">${recipe.label}</label>`}\n${control}`;
}

function renderSource(): void {
  source.textContent = format === "adapter" ? adapterCss : format === "base" ? baseCss : format === "html"
    ? `<form>\n${markup(current, current.className, "example-field").split("\n").map((line) => `  ${line}`).join("\n")}\n</form>`
    : current.css;
  copy.textContent = format === "html" ? "Copy HTML" : format === "base" ? "Copy theme CSS" : format === "adapter" ? "Copy adapter" : "Copy CSS";
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-source]")) button.setAttribute("aria-pressed", String(button.dataset.source === format));
  status.textContent = "";
}

function render(): void {
  current = recipes.find((recipe) => `#${recipe.element}` === location.hash) ?? recipes[0]!;
  for (const link of links.querySelectorAll("a")) {
    if (link.dataset.element === current.element) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.querySelector("#recipe-heading")!.textContent = current.title;
  document.querySelector("#recipe-element")!.textContent = `<${current.element}>`;
  document.querySelector("#recipe-description")!.textContent = current.description;
  exampleStyle.textContent = current.css;
  previews.replaceChildren(...["Base", current.variant].map((title, index) => {
    const panel = document.createElement("section"); panel.className = "recipe-preview"; panel.setAttribute("aria-label", `${title} preview`);
    const heading = document.createElement("h3"); heading.textContent = title;
    const form = document.createElement("form"); form.className = "recipe-form";
    // All markup comes from the static recipes above; user values are never interpolated.
    form.innerHTML = markup(current, index ? current.className : "", `preview-${index}`);
    const output = document.createElement("output"); output.setAttribute("aria-label", `${title} form data`); output.setAttribute("aria-live", "off");
    const update = (): void => { output.textContent = JSON.stringify(Array.from(new FormData(form))); };
    form.addEventListener("input", update); form.addEventListener("change", update);
    form.addEventListener("submit", (event) => event.preventDefault());
    panel.append(heading, form, output);
    queueMicrotask(update);
    return panel;
  }));
  document.querySelector("#recipe-parts")!.replaceChildren(...current.parts.map((part) => {
    const code = document.createElement("code"); code.textContent = `::part(${part})`; return code;
  }));
  renderSource();
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-source]")) button.addEventListener("click", () => { format = button.dataset.source!; renderSource(); });
copy.addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(source.textContent ?? "");
    status.textContent = "Copied to clipboard.";
  } catch { status.textContent = "Copy unavailable. Select and copy the code above."; }
});
window.addEventListener("hashchange", render);
render();
await Promise.all(["themes", "shadcn"].map(async (name) => {
  let css: string;
  try {
    const response = await fetch(`./demo/${name}.css`);
    if (!response.ok) throw new Error("Stylesheet unavailable");
    css = await response.text();
  } catch { css = `/* Could not load ${name}.css. Use the download link or reload the page. */`; }
  if (name === "themes") baseCss = css; else adapterCss = css;
}));
if (format === "base" || format === "adapter") renderSource();
