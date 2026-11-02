import { define } from "../define.js";
import { H6Tabs } from "../tabs.js";

export { H6Tabs };

define("h6-tabs", H6Tabs);

declare global {
  interface HTMLElementTagNameMap {
    "h6-tabs": H6Tabs;
  }
}
