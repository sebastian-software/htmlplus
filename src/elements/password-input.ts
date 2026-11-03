import { define } from "../define.js";
import { HPlusPasswordInput } from "../password-input.js";

export { HPlusPasswordInput };

define("hplus-password-input", HPlusPasswordInput);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-password-input": HPlusPasswordInput;
  }
}
