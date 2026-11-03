import { define } from "../define.js";
import { HPlusCheckbox } from "../checkbox.js";

export { HPlusCheckbox };

define("hplus-checkbox", HPlusCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-checkbox": HPlusCheckbox;
  }
}
