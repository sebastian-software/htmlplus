import { define } from "../define.js";
import { H6Checkbox } from "../checkbox.js";

export { H6Checkbox };

define("h6-checkbox", H6Checkbox);

declare global {
  interface HTMLElementTagNameMap {
    "h6-checkbox": H6Checkbox;
  }
}
