# Date Picker

`h6-date-picker` combines a native text editor, Zag 1.46.0 calendar behavior, and native form association. It selects one Gregorian calendar date without a time of day or a time zone. Applications own availability checks and the workflow around that date.

```html
<label for="delivery-date">Delivery date</label>
<h6-date-picker id="delivery-date" name="delivery_date"
  value="2026-10-28" min="2026-10-01" max="2027-12-31"
  locale="en-US" required></h6-date-picker>
```

The example displays `10/28/2026` and contributes `delivery_date=2026-10-28` to FormData. Open its calendar with the calendar button, Alt+ArrowDown, or F4. Use the heading to switch between day, month, and year views. Arrow keys, Home/End, PageUp/PageDown, and Enter navigate and select through Zag. Shift+PageUp/PageDown changes larger periods. Escape dismisses the popup. Calendar selection returns focus to the calendar button; Clear and an external label focus the editor.

## Values and editing

- `.value` is a complete `YYYY-MM-DD` calendar date or `""` when empty, incomplete, or malformed. Property assignment accepts ISO or an empty string; invalid dates and timestamps throw `RangeError`. Years are 0001–9999. Calendar validity is strict: February 30 is rejected rather than rolled into March.
- `.displayValue` is the native editor text. Its setter accepts localized text, ISO text, or an invalid draft without fabricating user events. User input keeps its text, selection, native undo, paste, and composition. Neither blur nor Enter silently clamps an invalid date to a valid one.
- `.defaultValue` reflects the ISO `value` attribute. Defaults update the current value until a user edit or property assignment makes it dirty. Reset restores the default. A malformed declarative default remains visible and invalid; it does not become today's date.
- `.locale` resolves explicit `locale`, then the nearest inherited HTML `lang`, then browser language. Numeric field order, digits, and separators come from `Intl.DateTimeFormat`, with the Gregorian date model retained. See [Functional locale formatting](LOCALE.md) for precedence, dynamic context, and demo behavior. For example, `en-GB` uses `DD/MM/YYYY` and `de-DE` uses `DD.MM.YYYY`. ISO input is also accepted in every locale. A localized year needs four digits; month/day accept one or two. Unsupported or malformed locale tags create a configuration error instead of silently guessing a locale.
- Changing locale reformats a complete current date while retaining its ISO value. An invalid draft stays unchanged and unanswered; changing locale does not reinterpret it. Locale changes close an open calendar. Calendar names, day/year digits, and first weekday follow the resolved locale; week information uses Intl with the existing date-model fallback. Interface action labels remain US English in this slice.
- `.min` and `.max` are inclusive ISO boundaries. A complete out-of-range date retains its ISO value in FormData and reports `rangeUnderflow` or `rangeOverflow`. Its calendar focuses the nearest allowed day without marking that alternative as selected. Incomplete or impossible dates contribute no entry and report `badInput`. An empty required field reports `valueMissing`.
- Malformed boundaries, an inverted range, or an invalid locale report a configuration `customError`, omit the form entry, and block opening the calendar. No invalid configuration is passed to Zag geometry or navigation.

Formatting converts a calendar date to a temporary UTC value only for `Intl` display. Submission never parses a timestamp or converts a date between time zones. The browser's time zone is used by Zag for its Today marker and calendar announcements; it does not become part of `.value`.

## Events and native forms

Typing emits one bubbling, composed `input` after canonical form state updates. The native editor's commit emits `change`; it does not reformat the raw draft. Choosing a different date from the calendar or using Clear emits one `input`/`change` pair. Navigating between days, months, or years alone changes no form value. Choosing the current date emits no duplicate value commit.

Property assignments, constraints, locale changes, reset, restoration callbacks, and disabling are silent. Reassigning a complete current canonical date preserves the native draft rather than rewriting a controlled echo. Assigning an empty value explicitly clears the editor. Calendar selection and programmatic value changes may intentionally replace the display text.

The host exposes `name`, `form`, `labels`, `disabled`, `readOnly`, `required`, `placeholder`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`. Custom errors persist until explicitly cleared. Disabled fieldsets omit the value. Readonly fields stay focusable and retain their value while editing, opening, and clearing are blocked. The `form` attribute supports an external form. Interactive validation focuses the editor and can reveal its containing Tabs/Accordion section.

`.clear()` clears programmatically, `.showPicker()` opens when interactive and configured, and `.hidePicker()` closes. The host uses `ElementInternals` as the only submission owner. There is no hidden or named shadow input. Restoration state stores canonical value, raw text, and locale. A valid restored date is reformatted if its saved locale differs; an invalid draft is preserved without being reinterpreted. Testing this callback does not establish real browser history restoration or autofill support.

## Popup and styles

The calendar reuses the shadow-local manual Popover API strategy from Select/Combobox. Zag owns calendar focus, navigation, dismissal, and fixed placement through Floating UI. The native top layer escapes clipping ancestors while preserving inherited theme tokens and same-root ARIA references. The popup is a nonmodal dialog containing a calendar grid. The native editor is deliberately outside Zag's input lookup, so its automatic input synchronization and blur correction cannot rewrite native editing history. See [ADR-0009](adr/0009-calendar-date-picker.md).

Every Date Picker includes the neutral base. `--hp-popover` / `--hp-popover-foreground` style the popup; primary colors style the selected day, accent colors style hover, and ring colors show keyboard focus. The shadcn adapter resolves those tokens on each host. `:state(selected)` and `:state(open)` describe current state.

Public parts are `root`, `control`, `input`, `trigger`, `clear-button`, `positioner`, `content`, `navigation`, `prev-button`, `view-button`, `next-button`, `view`, `day-view`, `month-view`, `year-view`, `grid`, `weekday`, `day`, `selected-day`, `today`, `month`, and `year`. The gallery includes a Framed calendar variation beside Base, with copyable HTML/CSS and Light/Dark appearances. The playground includes a required Delivery date and its actual ISO FormData entry.

## Evidence and limits

Unit checks cover strict dates, leap-year rules, localized numeric parsing, four-digit years, explicit locale validation, and localized digits and the Gregorian value model. Browser checks cover native editing and undo, incomplete/invalid values, inclusive bounds, views and keyboard selection, reset, readonly/disabled states, custom errors, labels, external forms, restoration/reconnect, clipping and dismissal, nested themes and invalid-field revelation, and Light/Dark mobile recipes. Two browser time zones exercise selection across a daylight-saving boundary without changing the date-only value.

The implementation requires the Popover API. Date ranges are available in the separate [Date Range Picker](DATE-RANGE-PICKER.md), sharing calendar views and base styles. This single-date field does not implement time selection, alternate calendars, business-specific unavailable-day rules, native operating-system date pickers, no-JavaScript fallback, or SSR. Physical-device behavior, manual assistive-technology combinations, browser autofill/history restoration, and exact minimum browser versions remain unverified. Firefox retains the existing macOS launch limitation; Linux CI is configured for all three engines.

The bundled date model is `@internationalized/date` 3.12.4. This adds no React runtime. Its Apache-2.0 license and bundled helper notices ship in [third-party notices](../THIRD_PARTY_NOTICES.txt).
