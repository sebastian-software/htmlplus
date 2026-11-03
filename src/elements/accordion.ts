import { define } from "../define.js";
import { HPlusAccordion } from "../accordion.js";

export { HPlusAccordion };

define("hplus-accordion", HPlusAccordion);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-accordion": HPlusAccordion;
  }
}
