import { H6Switch } from "./switch.js";
import { H6Tags } from "./tags.js";
import { H6Bic, H6Iban, H6Otp } from "./text-fields.js";
import { H6Duration } from "./duration.js";
import { H6Interval } from "./interval.js";
import { H6Segmented } from "./segmented.js";

export { H6Switch, H6Tags, H6Bic, H6Iban, H6Otp, H6Duration, H6Interval, H6Segmented };
export type { IntervalValue } from "./interval.js";

for (const [name, definition] of [
  ["h6-switch", H6Switch], ["h6-tags", H6Tags], ["h6-iban", H6Iban], ["h6-bic", H6Bic], ["h6-otp", H6Otp],
  ["h6-duration", H6Duration], ["h6-interval", H6Interval], ["h6-segmented", H6Segmented],
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
  }
}
