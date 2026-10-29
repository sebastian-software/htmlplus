import { hostStyles } from "./styles.js";
import { nativeFieldStyles } from "./native-field-styles.js";

const sheet = new CSSStyleSheet();
sheet.replaceSync(`${hostStyles}:host { min-width: 0; }:host([hidden]) { display: none; }${nativeFieldStyles(true)}`);

/** Presentation only: the original light-DOM control owns every native form behavior. */
export class H6Field extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [sheet]; root.append(document.createElement("slot"));
  }
  override focus(options?: FocusOptions): void { this.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select")?.focus(options); }
}
