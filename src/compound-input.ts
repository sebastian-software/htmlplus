import { fieldLabel, referencedText } from "./field-label.js";
import type { H6TextField } from "./text-fields.js";
import { radius, surfaceShadow, theme } from "./theme.js";

const compoundStyles = `
  [part=control] { display: flex; align-items: center; min-height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: ${surfaceShadow("inset")}; }
  [part=control]:focus-within { border-color: ${theme("ring")}; }
  input { flex: 1; width: 0; border: 0; box-shadow: none; background: transparent; height: calc(var(--hp-control-height, 2.5rem) - 2px); }
  input:focus-visible { outline-offset: -2px; }
  button { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 2rem; height: 2rem; margin: .1875rem; padding: .375rem; border: 1px solid transparent; border-radius: ${radius("sm")}; background: transparent; color: ${theme("muted-foreground")}; font: inherit; cursor: pointer; }
  button:hover:not(:disabled) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  button:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: -2px; }
  button:disabled { opacity: .5; cursor: default; }
  svg { width: 1rem; height: 1rem; flex: none; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
`;
export function wrap(host: H6TextField, buttons: string): HTMLElement {
  const root = host.shadowRoot!;
  const style = document.createElement("style");
  style.textContent = compoundStyles;
  const control = document.createElement("div");
  control.part.add("control");
  control.innerHTML = buttons;
  control.prepend(host.input);
  root.append(style, control);
  return control;
}
export function label(host: H6TextField): void {
  host.input.setAttribute("aria-label", fieldLabel(host, host.labels, "Text field"));
  host.input.setAttribute("aria-description", referencedText(host, "aria-describedby"));
}
