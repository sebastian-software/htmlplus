import { parseDate } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";

/** Canonical calendar dates never pass through timestamp parsing or permissive rollover. */
export function parseCalendarDate(value: string): CalendarDate | null {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try { const date = parseDate(value); return date.toString() === value ? date : null; } catch { return null; }
}

export interface DateTextFormat {
  locale: string;
  placeholder: string;
  format(date: CalendarDate): string;
  parse(text: string): CalendarDate | null;
}
const unmark = (text: string): string => text.replace(/[\u061c\u200e\u200f]/g, "");
const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Explicit numeric locale order, Gregorian dates, Latin digits, and literal separators. */
export function dateTextFormat(locale: string): DateTextFormat | null {
  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    if (!canonical || !Intl.DateTimeFormat.supportedLocalesOf([canonical]).length) return null;
    const resolved = new Intl.Locale(canonical, { calendar: "gregory", numberingSystem: "latn" }).toString();
    const formatter = new Intl.DateTimeFormat(resolved, { calendar: "gregory", numberingSystem: "latn", timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" });
    const sample = parseCalendarDate("2006-11-22")!;
    const parts = formatter.formatToParts(sample.toDate("UTC"));
    const order: string[] = [];
    const pattern = parts.map(part => {
      if (["year", "month", "day"].includes(part.type)) { order.push(part.type); return part.type === "year" ? "([0-9]{4})" : "([0-9]{1,2})"; }
      return escape(unmark(part.value));
    }).join("");
    if (order.length !== 3) return null;
    const matcher = new RegExp(`^${pattern}$`);
    return {
      locale: resolved,
      placeholder: parts.map(part => part.type === "year" ? "YYYY" : part.type === "month" ? "MM" : part.type === "day" ? "DD" : unmark(part.value)).join(""),
      format: date => unmark(formatter.formatToParts(date.toDate("UTC")).map(part => part.type === "year" ? part.value.padStart(4, "0") : part.value).join("")),
      parse(text) {
        text = unmark(text.trim());
        const iso = parseCalendarDate(text); if (iso) return iso;
        const match = matcher.exec(text); if (!match) return null;
        const values = Object.fromEntries(order.map((name, index) => [name, match[index + 1]!]));
        return parseCalendarDate(`${values.year}-${values.month!.padStart(2, "0")}-${values.day!.padStart(2, "0")}`);
      },
    };
  } catch { return null; }
}
