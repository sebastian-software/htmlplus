import { define } from "../define.js";
import { H6DateRangePicker } from "../date-range-picker.js";

export { H6DateRangePicker };
export type { DateRangeValue } from "../date-range-picker.js";

define("h6-date-range-picker", H6DateRangePicker);

declare global {
  interface HTMLElementTagNameMap {
    "h6-date-range-picker": H6DateRangePicker;
  }
}
