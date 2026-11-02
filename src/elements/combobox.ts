import { define } from "../define.js";
import { H6Combobox } from "../selection.js";

export { H6Combobox };

define("h6-combobox", H6Combobox);

declare global {
  interface HTMLElementTagNameMap {
    "h6-combobox": H6Combobox;
  }
}
