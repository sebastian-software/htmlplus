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

/** Numeric locale order, numbering system, and separators around Gregorian ISO values. */
export function dateTextFormat(locale: string): DateTextFormat | null {
  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    if (!canonical || !Intl.DateTimeFormat.supportedLocalesOf([canonical]).length) return null;
    const resolved = new Intl.Locale(canonical, { calendar: "gregory" }).toString();
    const formatter = new Intl.DateTimeFormat(resolved, { calendar: "gregory", timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" });
    const numbers = new Intl.NumberFormat(resolved, { useGrouping: false });
    const digits = new Map(Array.from({ length: 10 }, (_, digit) => [numbers.format(digit), String(digit)]));
    const ascii = (text: string): string => Array.from(text, character => digits.get(character) ?? character).join("");
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
      // Some locales abbreviate numeric years; the parser and canonical value need all four digits.
      format: date => unmark(formatter.formatToParts(date.toDate("UTC")).map(part => part.type === "year" ? Array.from(String(date.year).padStart(4, "0"), digit => numbers.format(Number(digit))).join("") : part.value).join("")),
      parse(text) {
        text = ascii(unmark(text.trim()));
        // The locale order goes first: its text can also look like ISO with day and month swapped.
        const match = matcher.exec(text);
        const values = match && Object.fromEntries(order.map((name, index) => [name, match[index + 1]!]));
        return values && parseCalendarDate(`${values.year}-${values.month!.padStart(2, "0")}-${values.day!.padStart(2, "0")}`) || parseCalendarDate(text);
      },
    };
  } catch { return null; }
}
