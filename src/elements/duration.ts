import { define } from "../define.js";
import { HPlusDuration } from "../duration.js";

export { HPlusDuration };

define("hplus-duration", HPlusDuration);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-duration": HPlusDuration;
  }
}
