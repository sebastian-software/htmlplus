import { define } from "../define.js";
import { HPlusTabs } from "../tabs.js";

export { HPlusTabs };

define("hplus-tabs", HPlusTabs);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-tabs": HPlusTabs;
  }
}
