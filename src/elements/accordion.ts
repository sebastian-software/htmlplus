import { define } from "../define.js";
import { H6Accordion } from "../accordion.js";

export { H6Accordion };

define("h6-accordion", H6Accordion);

declare global {
  interface HTMLElementTagNameMap {
    "h6-accordion": H6Accordion;
  }
}
