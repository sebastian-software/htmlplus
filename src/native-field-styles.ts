import { theme, radius, surfaceShadow } from "./theme.js";

const textInput = "input:not([type=hidden],[type=checkbox],[type=radio],[type=range],[type=color],[type=file],[type=button],[type=submit],[type=reset],[type=image])";

/** The same opt-in base works for slotted controls and the no-JavaScript stylesheet. */
export function nativeFieldStyles(shadow: boolean): string {
  const select = (element: string, state = ""): string => shadow ? `::slotted(${element}:not([hidden])${state})` : `:where(h6-field) > ${element}:not([hidden])${state}`;
  const editors = (state = ""): string => [textInput, "textarea", "select"].map(element => select(element, state)).join(", ");
  return `
    ${editors()} {
      box-sizing: border-box; display: block; width: 100%; min-width: 0; margin: 0;
      height: var(--hp-control-height, 2.5rem); padding: .5rem .75rem;
      border: 1px solid ${theme("input")}; border-radius: ${radius("md")};
      background-color: ${theme("background")}; color: ${theme("foreground")};
      font-family: var(--hp-font-family, ui-sans-serif, system-ui, sans-serif);
      font-size: var(--hp-font-size, .875rem); font-weight: 400;
      line-height: var(--hp-line-height, 1.25rem); letter-spacing: normal;
      box-shadow: ${surfaceShadow("inset")};
    }
    ${select("textarea")} { height: auto; min-height: calc(2 * var(--hp-control-height, 2.5rem)); resize: vertical; }
    ${select("select", "[multiple]")}, ${select("select", "[size]:not([size='1'])")} { height: auto; min-height: calc(2 * var(--hp-control-height, 2.5rem)); }
    ${select(textInput)}::placeholder, ${select("textarea")}::placeholder { color: ${theme("muted-foreground")}; opacity: 1; }
    ${editors(":focus")} { border-color: ${theme("ring")}; }
    ${editors(":focus-visible")} { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
    ${editors(":disabled")} { opacity: .5; cursor: not-allowed; }
    ${editors(":user-invalid")}, ${editors("[aria-invalid=true]")} { border-color: ${theme("destructive")}; }
    @media (forced-colors: active) {
      ${editors()} { box-shadow: none; border-color: CanvasText; }
      ${editors(":focus-visible")} { outline-color: Highlight; }
      ${editors(":disabled")} { border-color: GrayText; color: GrayText; opacity: 1; }
    }
  `;
}
