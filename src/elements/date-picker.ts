import { define } from "../define.js";
import { H6DatePicker } from "../date-picker.js";

export { H6DatePicker };

define("h6-date-picker", H6DatePicker);

declare global {
  interface HTMLElementTagNameMap {
    "h6-date-picker": H6DatePicker;
  }
}
