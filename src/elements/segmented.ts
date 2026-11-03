import { define } from "../define.js";
import { HPlusSegmented } from "../segmented.js";

export { HPlusSegmented };

define("hplus-segmented", HPlusSegmented);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-segmented": HPlusSegmented;
  }
}
