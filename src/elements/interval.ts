import { define } from "../define.js";
import { H6Interval } from "../interval.js";

export { H6Interval };
export type { IntervalValue } from "../interval.js";

define("h6-interval", H6Interval);

declare global {
  interface HTMLElementTagNameMap {
    "h6-interval": H6Interval;
  }
}
