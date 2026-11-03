import { define } from "../define.js";
import { HPlusRadioGroup } from "../choice-groups.js";

export { HPlusRadioGroup };

define("hplus-radio-group", HPlusRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-radio-group": HPlusRadioGroup;
  }
}
