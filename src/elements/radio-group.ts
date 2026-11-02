import { define } from "../define.js";
import { H6RadioGroup } from "../choice-groups.js";

export { H6RadioGroup };

define("h6-radio-group", H6RadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    "h6-radio-group": H6RadioGroup;
  }
}
