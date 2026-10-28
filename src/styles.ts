import { theme, radius, surfaceShadow } from "./theme.js";
/** Shared visual primitives; defaults stay inside each component's shadow root. */
export const hostStyles = `
  :host {
    display: block;
    color: ${theme("foreground")};
    font-family: var(--hp-font-family, ui-sans-serif, system-ui, sans-serif);
    font-size: var(--hp-font-size, .875rem);
    font-weight: 400;
    line-height: var(--hp-line-height, 1.25rem);
    letter-spacing: normal;
  }
  *, *::before, *::after { box-sizing: border-box; }
  @media (forced-colors: active) { *, *::before, *::after { box-shadow: none !important; } }
`;

export const inputStyles = `
  input {
    display: block;
    width: 100%;
    min-width: 0;
    height: var(--hp-control-height, 2.5rem);
    padding: .5rem .75rem;
    border: 1px solid ${theme("input")};
    border-radius: ${radius("md")};
    background: ${theme("background")};
    color: ${theme("foreground")};
    font: inherit;
    font-size: var(--hp-font-size, .875rem);
    line-height: var(--hp-line-height, 1.25rem);
    box-shadow: ${surfaceShadow("inset")};
    outline: none;
  }
  input::placeholder { color: ${theme("muted-foreground")}; opacity: 1; }
  input:focus { border-color: ${theme("ring")}; }
  input:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  input:disabled { opacity: .5; cursor: not-allowed; }
  :host([data-touched]:invalid) input { border-color: ${theme("destructive")}; }
`;

/** Standalone numeric marks need more contrast than a filled primary button. */
export const numericAccent = `color-mix(in oklch, ${theme("primary")} 65%, ${theme("foreground")})`;
