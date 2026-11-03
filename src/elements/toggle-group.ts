import { define } from "../define.js";
import { HPlusToggleGroup } from "../choice-groups.js";

export { HPlusToggleGroup };

define("hplus-toggle-group", HPlusToggleGroup);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-toggle-group": HPlusToggleGroup;
  }
}
