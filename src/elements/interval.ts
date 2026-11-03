import { define } from "../define.js";
import { HPlusInterval } from "../interval.js";

export { HPlusInterval };
export type { IntervalValue } from "../interval.js";

define("hplus-interval", HPlusInterval);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-interval": HPlusInterval;
  }
}
