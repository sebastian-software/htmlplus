import { define } from "../define.js";
import { HPlusDatePicker } from "../date-picker.js";

export { HPlusDatePicker };

define("hplus-date-picker", HPlusDatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-date-picker": HPlusDatePicker;
  }
}
