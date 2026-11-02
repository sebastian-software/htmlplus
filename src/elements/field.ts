import { define } from "../define.js";
import { H6Field } from "../native-field.js";

export { H6Field };

define("h6-field", H6Field);

declare global {
  interface HTMLElementTagNameMap {
    "h6-field": H6Field;
  }
}
