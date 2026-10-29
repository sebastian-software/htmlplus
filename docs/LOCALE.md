# Functional locale formatting

Date Picker, Date Range Picker, and Number Input resolve a BCP 47 locale from:

1. A nonempty `locale` attribute on the component.
2. The nearest nonempty HTML `lang`, starting with the component itself and walking its ancestors, including shadow hosts and assigned slots.
3. The document language, then the browser language, with `en-US` as the final fallback.

```html
<html lang="de-DE">
  <!-- German numeric order and separators, inherited from HTML. -->
  <h6-date-picker name="delivery" value="2028-02-29"></h6-date-picker>
  <h6-date-range-picker name="period" value='["2028-02-29","2028-03-02"]'></h6-date-range-picker>
  <!-- An explicit locale overrides inherited language. -->
  <h6-date-picker name="invoice" value="2028-02-29" locale="en-GB"></h6-date-picker>
</html>
```

Components observe `lang` changes on their current ancestor chain. Moving a component reconnects that context. Explicit `locale` takes precedence until removed. Applications can connect Palamedes or another locale source through `lang` or `locale` without a message-framework dependency in the components.

## Dates and calendars

`Intl.DateTimeFormat` supplies numeric field order, separators, localized digits, and calendar month/weekday names. `Intl.NumberFormat` supplies day and year digits. Weekday headers use the narrow form, with the complete name available to assistive technology and as a tooltip. `Intl.Locale.getWeekInfo()` supplies the first weekday where available; the older `weekInfo` accessor and the existing date model's locale data provide fallbacks. No separate week-start table is maintained.

The date model remains Gregorian, even when a locale's default calendar differs. The locale's numbering system is retained, including explicit `nu` extensions. Localized numeric dates and strict ASCII ISO input are accepted; serialized values remain Gregorian `YYYY-MM-DD` using ASCII digits. These are calendar dates, not time-zone-dependent instants. See [Date Picker](DATE-PICKER.md) and [Date Range Picker](DATE-RANGE-PICKER.md).

Changing locale reformats complete dates and closes an open calendar without changing values or emitting value events. Invalid and incomplete drafts remain visible and unanswered; a different field order does not reinterpret them. Reset uses the current locale. Restoration reformats canonical dates when their saved locale differs from the current context.

## Numbers and direction

Number Input uses `Intl.NumberFormat` and the existing internationalized number parser. Complete edited values are reformatted from their previous numeric meaning: `3.75` becomes `3,75` in `de-DE`, while FormData still contains `3.75`. Invalid drafts stay invalid until edited or replaced. Number Input retains its existing `en-US` fallback for invalid locale identifiers; date controls report invalid configuration instead.

`lang` chooses formatting conventions. `dir` remains the independent HTML direction contract; controls respect their computed direction. Applications displaying RTL content should supply `dir="rtl"` in the appropriate scope. Calendar navigation icons mirror in RTL.

## Playground

The Locale picker on both pages offers `en-US`, `en-GB`, `de-DE`, `fr-FR`, `ja-JP`, and `ar-EG`. It retains the choice within the browser tab's session and applies language to the three relevant component hosts, keeping the page's English copy and document language intact. The Arabic example also supplies RTL direction. Recipe HTML records the selected `lang` and `dir` so copied examples match their previews.

This demonstrates functional formatting, not translated interface labels, validation messages, or application content. Canonical values and other form fields survive switching. Full message localization and a Palamedes adapter remain separate work.

Browser checks cover initial/dynamic document language, nearest/explicit overrides, shadow-host inheritance and reconnect, regional week order, localized digits and year views, absent week-info APIs, invalid drafts, silent value preservation, reset, both pages, and narrow layouts. Device and manual assistive-technology verification remain open.

References: [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat), [Intl.Locale.getWeekInfo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo), and [ADR-0011](adr/0011-functional-locale-context.md).
