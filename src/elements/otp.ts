import { define } from "../define.js";
import { H6Otp } from "../text-fields.js";

export { H6Otp };

define("h6-otp", H6Otp);

declare global {
  interface HTMLElementTagNameMap {
    "h6-otp": H6Otp;
  }
}
