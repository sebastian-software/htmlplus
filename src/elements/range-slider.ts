import { define } from "../define.js";
import { HPlusRangeSlider } from "../slider.js";

export { HPlusRangeSlider };
export type { RangeSliderValue } from "../slider.js";

define("hplus-range-slider", HPlusRangeSlider);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-range-slider": HPlusRangeSlider;
  }
}
