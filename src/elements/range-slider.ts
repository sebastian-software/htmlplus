import { define } from "../define.js";
import { H6RangeSlider } from "../slider.js";

export { H6RangeSlider };
export type { RangeSliderValue } from "../slider.js";

define("h6-range-slider", H6RangeSlider);

declare global {
  interface HTMLElementTagNameMap {
    "h6-range-slider": H6RangeSlider;
  }
}
