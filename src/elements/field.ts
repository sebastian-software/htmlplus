import { define } from "../define.js";
import { HPlusField } from "../native-field.js";

export { HPlusField };

define("hplus-field", HPlusField);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-field": HPlusField;
  }
}
