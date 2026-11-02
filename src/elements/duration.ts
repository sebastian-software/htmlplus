import { define } from "../define.js";
import { H6Duration } from "../duration.js";

export { H6Duration };

define("h6-duration", H6Duration);

declare global {
  interface HTMLElementTagNameMap {
    "h6-duration": H6Duration;
  }
}
