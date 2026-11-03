import { define } from "../define.js";
import { H6Select } from "../select.js";

export { H6Select };

define("h6-select", H6Select);

declare global {
  interface HTMLElementTagNameMap {
    "h6-select": H6Select;
  }
}
