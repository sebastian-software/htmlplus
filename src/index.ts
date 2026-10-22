import { H6Switch } from "./switch.js";
import { H6Tags } from "./tags.js";
import { H6Bic, H6Iban, H6Otp } from "./text-fields.js";

export { H6Switch, H6Tags, H6Bic, H6Iban, H6Otp };

for (const [name, definition] of [
  ["h6-switch", H6Switch], ["h6-tags", H6Tags], ["h6-iban", H6Iban], ["h6-bic", H6Bic], ["h6-otp", H6Otp],
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
  }
}
