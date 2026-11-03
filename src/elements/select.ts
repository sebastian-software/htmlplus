import { define } from "../define.js";
import { HPlusSelect } from "../select.js";

export { HPlusSelect };

define("hplus-select", HPlusSelect);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-select": HPlusSelect;
  }
}
