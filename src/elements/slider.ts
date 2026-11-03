import { define } from "../define.js";
import { HPlusSlider } from "../slider.js";

export { HPlusSlider };

define("hplus-slider", HPlusSlider);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-slider": HPlusSlider;
  }
}
