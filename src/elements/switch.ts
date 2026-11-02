import { define } from "../define.js";
import { H6Switch } from "../switch.js";

export { H6Switch };

define("h6-switch", H6Switch);

declare global {
  interface HTMLElementTagNameMap {
    "h6-switch": H6Switch;
  }
}
