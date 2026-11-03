import { define } from "../define.js";
import { HPlusBic } from "../text-fields.js";

export { HPlusBic };

define("hplus-bic", HPlusBic);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-bic": HPlusBic;
  }
}
