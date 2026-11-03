import { define } from "../define.js";
import { HPlusCombobox } from "../combobox.js";

export { HPlusCombobox };

define("hplus-combobox", HPlusCombobox);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-combobox": HPlusCombobox;
  }
}
