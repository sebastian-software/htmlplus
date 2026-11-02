import { define } from "../define.js";
import { H6ToggleGroup } from "../choice-groups.js";

export { H6ToggleGroup };

define("h6-toggle-group", H6ToggleGroup);

declare global {
  interface HTMLElementTagNameMap {
    "h6-toggle-group": H6ToggleGroup;
  }
}
