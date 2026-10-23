import { H6TextField } from "./text-fields.js";
import type { FieldValidation } from "./validation.js";
import { parseDuration } from "./duration-value.js";

/** A fixed elapsed duration. Calendar months, dates, and time zones are excluded. */
export class H6Duration extends H6TextField {
  static override observedAttributes = [...H6TextField.observedAttributes, "min", "max"];
  override normalizeValue(value: string): string {
    const seconds = parseDuration(value);
    return seconds === null ? value.trim() : String(seconds);
  }
  override validateValue(value: string): FieldValidation {
    if (!value) return { message: "", detail: "Try 1h 30m, 90m, or 01:30. Submitted in seconds." };
    const seconds = parseDuration(value);
    if (seconds === null) return { message: "Use a duration such as 1h 30m, 90m, or 01:30.", detail: "Use whole, nonnegative seconds, minutes, or hours." };
    for (const bound of ["min", "max"] as const) {
      const attribute = this.getAttribute(bound);
      const limit = attribute === null ? NaN : Number(attribute);
      if (Number.isFinite(limit) && (bound === "min" ? seconds < limit : seconds > limit)) {
        return { message: `Use ${bound === "min" ? "at least" : "no more than"} ${limit} seconds.`, detail: `${seconds} seconds` };
      }
    }
    return { message: "", detail: `${seconds.toLocaleString("en-US")} seconds in FormData. The editor keeps your notation.` };
  }
}
