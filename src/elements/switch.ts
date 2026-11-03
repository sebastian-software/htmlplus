import { define } from "../define.js";
import { HPlusSwitch } from "../switch.js";

export { HPlusSwitch };

define("hplus-switch", HPlusSwitch);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-switch": HPlusSwitch;
  }
}
