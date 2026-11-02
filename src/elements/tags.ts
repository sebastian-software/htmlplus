import { define } from "../define.js";
import { H6Tags } from "../tags.js";

export { H6Tags };

define("h6-tags", H6Tags);

declare global {
  interface HTMLElementTagNameMap {
    "h6-tags": H6Tags;
  }
}
