import { define } from "../define.js";
import { HPlusDateRangePicker } from "../date-range-picker.js";

export { HPlusDateRangePicker };
export type { DateRangeValue } from "../date-range-picker.js";

define("hplus-date-range-picker", HPlusDateRangePicker);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-date-range-picker": HPlusDateRangePicker;
  }
}
