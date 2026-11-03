import { define } from "../define.js";
import { HPlusTags } from "../tags.js";

export { HPlusTags };

define("hplus-tags", HPlusTags);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-tags": HPlusTags;
  }
}
