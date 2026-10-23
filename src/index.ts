import { H6Switch } from "./switch.js";
import { H6Tags } from "./tags.js";
import { H6Bic, H6Iban, H6Otp } from "./text-fields.js";
import { H6Duration } from "./duration.js";
import { H6Interval } from "./interval.js";
import { H6Segmented } from "./segmented.js";
import { H6Toggle } from "./toggle.js";
import { H6Accordion } from "./accordion.js";
import { H6Tabs } from "./tabs.js";

export { H6Switch, H6Tags, H6Bic, H6Iban, H6Otp, H6Duration, H6Interval, H6Segmented, H6Toggle, H6Accordion, H6Tabs };
export type { IntervalValue } from "./interval.js";

for (const [name, definition] of [
  ["h6-switch", H6Switch], ["h6-tags", H6Tags], ["h6-iban", H6Iban], ["h6-bic", H6Bic], ["h6-otp", H6Otp],
  ["h6-duration", H6Duration], ["h6-interval", H6Interval], ["h6-segmented", H6Segmented],
  ["h6-toggle", H6Toggle], ["h6-accordion", H6Accordion], ["h6-tabs", H6Tabs],
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
  }
}
