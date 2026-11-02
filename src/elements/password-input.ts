import { define } from "../define.js";
import { H6PasswordInput } from "../password-input.js";

export { H6PasswordInput };

define("h6-password-input", H6PasswordInput);

declare global {
  interface HTMLElementTagNameMap {
    "h6-password-input": H6PasswordInput;
  }
}
