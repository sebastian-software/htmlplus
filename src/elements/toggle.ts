import { define } from "../define.js";
import { HPlusToggle } from "../toggle.js";

export { HPlusToggle };

define("hplus-toggle", HPlusToggle);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-toggle": HPlusToggle;
  }
}
