import { define } from "../define.js";
import { H6Toggle } from "../toggle.js";

export { H6Toggle };

define("h6-toggle", H6Toggle);

declare global {
  interface HTMLElementTagNameMap {
    "h6-toggle": H6Toggle;
  }
}
