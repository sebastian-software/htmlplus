import { define } from "../define.js";
import { H6Iban } from "../text-fields.js";

export { H6Iban };

define("h6-iban", H6Iban);

declare global {
  interface HTMLElementTagNameMap {
    "h6-iban": H6Iban;
  }
}
