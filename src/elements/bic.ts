import { define } from "../define.js";
import { H6Bic } from "../text-fields.js";

export { H6Bic };

define("h6-bic", H6Bic);

declare global {
  interface HTMLElementTagNameMap {
    "h6-bic": H6Bic;
  }
}
