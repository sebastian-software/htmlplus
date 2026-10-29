# ADR-0011: Inherit HTML language for functional formatting

- Status: accepted
- Created: 2026-10-29
- Updated: 2026-10-29
- Lifecycle: living
- Scope: functional date and number displays; message translation stays separate

## Decision and rationale

Use the platform's BCP 47 language context as the default formatting context for Date Picker, Date Range Picker, and Number Input. An explicit component `locale` overrides the nearest inherited `lang`; absent language context falls back to browser language. Observe the current ancestor chain, including shadow boundaries, and reconnect when the component moves. Avoid observing every document mutation. Ordinary `<html lang>` becomes useful without requiring a separate locale assignment on every field.

Use Intl for date order, separators, numeric digits, calendar names, and regional week information where supported. Reuse the existing date model's locale data when week information is unavailable. Keep Gregorian ISO date values and decimal-point number serialization independent of display conventions. A locale's numbering system changes its visible digits; an alternate calendar system does not change the date model in this slice.

Locale changes are silent configuration changes. Reformat complete values from their canonical meaning, preserve invalid drafts without reinterpreting them, and close open date popups when context changes. HTML direction remains an independent `dir` contract. Calendar names come from Intl; interface messages and application labels remain separate localization inputs.

Both demo pages offer a functional Locale picker, with a tab-session preference and language scoped to the three relevant component hosts. English page copy retains its own language. The Arabic example explicitly supplies RTL direction. Copied recipe markup records the same language and direction. This lets people compare formats without presenting partly translated copy as a translated application.

## Consequences and alternatives

- Explicit locale remains available for mixed contexts. Requiring it everywhere would ignore authored HTML language.
- Browser language is a fallback rather than an override of document or application choices.
- Reuse platform locale data instead of maintaining format strings and regional week-start tables. Intl does not provide a general date parser; the editor derives a strict numeric parser from format parts and localized digits.
- Gregorian arithmetic remains a deliberate limit. Alternate calendars, time fields, and message catalogs need their own APIs and evidence.
- Dynamic number formatting must preserve the previous numeric meaning: reinterpreting punctuation under another locale could silently change submitted values.
- Palamedes or another message framework can set `lang` or `locale` without a component runtime dependency. This does not implement a message adapter or full translated interfaces.

## Evidence and review triggers

Unit checks round-trip localized digits, separators, strict ISO dates, and four-digit years. Browser checks cover inheritance and overrides, dynamic changes, shadow context, week ordering and fallback, calendar digits, invalid drafts, reset, silent values, the demo picker and recipe source, and responsive layout. Revisit when adding other locale-aware controls, alternate calendars, message localization, or different Intl capabilities. Physical devices and manual assistive technologies require separate verification.

## References

- [Functional locale contract](../LOCALE.md)
- [Date Picker](0009-calendar-date-picker.md) and [Date Range Picker](0010-calendar-date-ranges.md)
- [Native editing](0003-specialized-native-inputs.md)
- [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Intl.Locale.getWeekInfo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo)

## Changes

- 2026-10-29: Accepted inherited and dynamic HTML language, explicit locale precedence, Intl functional displays, stable canonical values, preserved drafts, and an English-copy demo with a functional locale picker.
