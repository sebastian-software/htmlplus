import { define } from "../define.js";
import { H6Slider } from "../slider.js";

export { H6Slider };

define("h6-slider", H6Slider);

declare global {
  interface HTMLElementTagNameMap {
    "h6-slider": H6Slider;
  }
}
