import { H6Switch } from "./switch.js";
import { H6Tags } from "./tags.js";
import { H6Bic, H6Iban, H6Otp } from "./text-fields.js";
import { H6Duration } from "./duration.js";
import { H6Interval } from "./interval.js";
import { H6Segmented } from "./segmented.js";
import { H6Toggle } from "./toggle.js";
import { H6Accordion } from "./accordion.js";
import { H6Slider, H6RangeSlider } from "./slider.js";
import { H6Rating } from "./rating.js";
import { H6Tabs } from "./tabs.js";
import { H6Select, H6Combobox } from "./selection.js";
import { H6DatePicker } from "./date-picker.js";
import { H6DateRangePicker } from "./date-range-picker.js";
import { H6Checkbox } from "./checkbox.js";
import { H6RadioGroup, H6ToggleGroup } from "./choice-groups.js";
import { H6NumberInput, H6PasswordInput } from "./extra-inputs.js";

export { H6Switch, H6Tags, H6Bic, H6Iban, H6Otp, H6Duration, H6Interval, H6Segmented, H6Toggle, H6Accordion, H6Tabs, H6Slider, H6RangeSlider, H6Rating };
export type { RangeSliderValue } from "./slider.js";
export { H6Select, H6Combobox };
export { H6DatePicker, H6DateRangePicker };
export { H6Checkbox, H6RadioGroup, H6ToggleGroup, H6NumberInput, H6PasswordInput };
export type { DateRangeValue } from "./date-range-picker.js";
export type { IntervalValue } from "./interval.js";

for (const [name, definition] of [
  ["h6-switch", H6Switch], ["h6-tags", H6Tags], ["h6-iban", H6Iban], ["h6-bic", H6Bic], ["h6-otp", H6Otp],
  ["h6-duration", H6Duration], ["h6-interval", H6Interval], ["h6-segmented", H6Segmented],
  ["h6-toggle", H6Toggle], ["h6-accordion", H6Accordion], ["h6-tabs", H6Tabs], ["h6-slider", H6Slider], ["h6-range-slider", H6RangeSlider], ["h6-rating", H6Rating],
  ["h6-select", H6Select], ["h6-combobox", H6Combobox],
  ["h6-date-picker", H6DatePicker], ["h6-date-range-picker", H6DateRangePicker],
  ["h6-checkbox", H6Checkbox], ["h6-radio-group", H6RadioGroup], ["h6-toggle-group", H6ToggleGroup],
  ["h6-number-input", H6NumberInput], ["h6-password-input", H6PasswordInput],
] as const) {
  if (!customElements.get(name)) customElements.define(name, definition);
}

declare global {
  interface HTMLElementTagNameMap {
    "h6-switch": H6Switch;
    "h6-tags": H6Tags;
    "h6-iban": H6Iban;
    "h6-bic": H6Bic;
    "h6-otp": H6Otp;
    "h6-duration": H6Duration;
    "h6-interval": H6Interval;
    "h6-segmented": H6Segmented;
    "h6-toggle": H6Toggle;
    "h6-accordion": H6Accordion;
    "h6-tabs": H6Tabs;
    "h6-slider": H6Slider;
    "h6-range-slider": H6RangeSlider;
    "h6-rating": H6Rating;
    "h6-select": H6Select;
    "h6-combobox": H6Combobox;
    "h6-date-picker": H6DatePicker;
    "h6-date-range-picker": H6DateRangePicker;
    "h6-checkbox": H6Checkbox;
    "h6-radio-group": H6RadioGroup;
    "h6-toggle-group": H6ToggleGroup;
    "h6-number-input": H6NumberInput;
    "h6-password-input": H6PasswordInput;
  }
}
