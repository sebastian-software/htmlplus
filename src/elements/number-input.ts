import { define } from "../define.js";
import { H6NumberInput } from "../number-input.js";

export { H6NumberInput };

define("h6-number-input", H6NumberInput);

declare global {
  interface HTMLElementTagNameMap {
    "h6-number-input": H6NumberInput;
  }
}
