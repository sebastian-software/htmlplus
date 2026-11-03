import { define } from "../define.js";
import { HPlusIban } from "../text-fields.js";

export { HPlusIban };

define("hplus-iban", HPlusIban);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-iban": HPlusIban;
  }
}
