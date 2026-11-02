import { define } from "../define.js";
import { H6Segmented } from "../segmented.js";

export { H6Segmented };

define("h6-segmented", H6Segmented);

declare global {
  interface HTMLElementTagNameMap {
    "h6-segmented": H6Segmented;
  }
}
