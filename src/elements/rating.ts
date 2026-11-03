import { define } from "../define.js";
import { HPlusRating } from "../rating.js";

export { HPlusRating };

define("hplus-rating", HPlusRating);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-rating": HPlusRating;
  }
}
