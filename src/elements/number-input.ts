import { define } from "../define.js";
import { HPlusNumberInput } from "../number-input.js";

export { HPlusNumberInput };

define("hplus-number-input", HPlusNumberInput);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-number-input": HPlusNumberInput;
  }
}
