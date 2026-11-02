import { define } from "../define.js";
import { H6Rating } from "../rating.js";

export { H6Rating };

define("h6-rating", H6Rating);

declare global {
  interface HTMLElementTagNameMap {
    "h6-rating": H6Rating;
  }
}
