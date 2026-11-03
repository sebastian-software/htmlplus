import { define } from "../define.js";
import { HPlusOtp } from "../text-fields.js";

export { HPlusOtp };

define("hplus-otp", HPlusOtp);

declare global {
  interface HTMLElementTagNameMap {
    "hplus-otp": HPlusOtp;
  }
}
