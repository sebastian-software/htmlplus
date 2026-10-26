# Date Range Picker

`h6-date-range-picker` combines two native text editors with Zag 1.46.0's range calendar. A complete range contains two inclusive Gregorian calendar dates; a same-day range is valid. Applications own availability, booking rules, duration calculations, and persistence.

```html
<label for="period">Travel period</label>
<h6-date-range-picker id="period" name="period"
  value='["2026-10-28","2026-11-03"]'
  min="2026-10-01" max="2027-12-31" locale="en-US"
  required></h6-date-range-picker>
```

This displays `10/28/2026` and `11/03/2026`. Actual FormData contains `period.start=2026-10-28` and `period.end=2026-11-03`. Override the names with `start-name` / `end-name` attributes or `.startName` / `.endName`. A nonempty host `name` enables submission, including when overrides are supplied. There are no hidden or named shadow inputs.

## Values and constraints

- `.value` and `.defaultValue` use `[string | null, string | null]`, with strict ISO `YYYY-MM-DD` strings. Empty boundaries are `null`. Getters return copies. Invalid dates, timestamps, or incompatible property values throw `RangeError`; inverted complete pairs are retained and reported as invalid. The JSON `value` attribute supplies defaults; changing it affects the current value until dirty. Reset restores those defaults. A malformed declarative default remains visible and invalid.
- `.displayValue` is a pair of native input strings. Editing either side parses that side without rewriting either editor. Incomplete or impossible dates stay visible and have no canonical boundary. Each complete boundary contributes its own ISO entry, even while the other side is unfinished or invalid. Changing a complete current `.value` to itself preserves raw text and selection; assigning a null boundary explicitly clears that editor.
- An optional empty pair is valid. Once either boundary is present, both dates are needed to complete the range. A missing counterpart reports `valueMissing` and blocks native validation. `required` also rejects the fully empty pair. An invalid nonempty draft reports `badInput`. Validation focuses the editor that needs correction, including inside Tabs/Accordion.
- Typed or programmatic inverted boundaries report `customError`, with both ISO entries retained. They are never silently swapped. Calendar picking is an unordered two-point gesture: Zag orders its two selected days chronologically. Same-day and reverse-order calendar picks are supported.
- `min` / `max` are inclusive ISO constraints on both dates. Complete dates outside them remain in FormData with `rangeUnderflow` / `rangeOverflow`. The calendar shows no substitute selection for an inverted or out-of-bounds pair. Invalid bounds, reversed configuration bounds, or an unsupported locale report configuration errors, omit both entries, and block the calendar.

Locale behavior and date arithmetic match [Date Picker](DATE-PICKER.md): explicit `en-US` default, Gregorian calendar, Latin digits, strict years 0001–9999, numeric locale order/separators, and ISO input accepted everywhere. Changing locale reformats complete dates and preserves invalid drafts without reinterpreting them. There is no timestamp conversion or time-zone offset in submitted values. Action copy is US English. Customize the visible boundary labels with `start-label` and `end-label`.

## Calendar and events

Open the calendar with its button, Alt+ArrowDown, F4, or `.showPicker()`. The heading switches day/month/year views; Zag supplies arrows, Home/End, PageUp/PageDown, and Enter. Visible adjacent-month days are selectable within bounds. After selecting a new start, the calendar stays open and the end becomes empty. That start immediately appears in FormData. Hover or keyboard preview highlights a potential span without changing form values. The second selection completes the range and returns focus to the calendar button. Keyboard start selection advances focus to the following day. Escape or outside dismissal retains any selected partial start; reopening resumes it. `.hidePicker()` closes programmatically.

Typing emits one bubbling, composed host `input` after form state updates; the native editor's commit emits `change`. A calendar step that changes the displayed values emits one `input`/`change` pair. A hover, view change, or dismissal emits no value event. Clear empties both sides, focuses Start date, and emits one pair; `.clear()` is silent. Property assignments, constraints, locale changes, reset, restoration, and disabling emit no user events. Native shadow editors do not own the form: use its submit button for submission; Enter in an editor does not coerce or select a date.

The host exposes `name`, `form`, `labels`, `disabled`, `readOnly`, `required`, `placeholder`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`. Custom errors persist until cleared. Disabled fieldsets omit both entries; readonly retains them and blocks editing, opening, and clearing. External form association is supported. State restoration stores the canonical pair, raw pair, and locale. A restored complete date is reformatted when its saved locale differs; unfinished drafts survive restoration callbacks and reconnect. Callback coverage does not establish real browser history restoration or autofill support.

## Themes and parts

The neutral base is built in. Inherited `--hp-*` variables, prefixed Light/Dark presets, all playground palettes, and the shadcn adapter apply without structural overrides. Primary tokens mark selected boundaries, accent tokens mark the span, and ring tokens show keyboard focus and a dashed provisional preview. Grid selection semantics reflect committed dates, excluding the preview. Popup surface/text use the popover token pair. `:state(selected)` means both canonical dates are present; `:state(open)` follows the calendar.

Shared calendar parts are `root`, `control`, `input`, `trigger`, `clear-button`, `positioner`, `content`, `navigation`, `prev-button`, `view-button`, `next-button`, `view`, `day-view`, `month-view`, `year-view`, `grid`, `weekday`, `day`, `selected-day`, `today`, `month`, and `year`. Boundary-specific parts are `start-field`, `end-field`, `start-input`, `end-input`, `start-label`, and `end-label`. `range-start` and `range-end` mark selected boundaries; `in-range` includes the selected or previewed span; `preview-day` distinguishes provisional highlighting.

The gallery includes Base and Outlined range previews with actual FormData and copyable HTML/CSS. The playground's Travel period demonstrates two entries and incomplete-range validation in Light/Dark. Both date components share the calendar renderer and base styles while owning their separate public APIs, native editors, and form states. [ADR-0010](adr/0010-calendar-date-ranges.md) records the tradeoffs.

## Evidence and limits

Browser checks cover two-step pointer and keyboard selection, switching from pointer to keyboard, preview, reverse and same-day picks, dismissal/resume, clearing/restart, raw drafts, native undo/caret/composition, inclusive bounds, locale changes, names, optional/required states, silent assignments/reset, readonly/disabled fieldsets, custom errors, external forms, restoration/reconnect, nested validation, inherited shadcn popup colors, mobile clipping, and Light/Dark recipes. Los Angeles and Kiritimati contexts cover a range crossing a daylight-saving boundary. Shared strict-date parsing retains its unit coverage; existing Date Picker checks protect the shared renderer.

The native Popover API is required. Time selection, alternate calendars, business-specific unavailable-day rules, physical devices, manual assistive-technology checks, actual history restoration/autofill, no-JavaScript fallback, SSR, and exact minimum browser versions remain outside the verified scope. Firefox cannot launch on this macOS host; the Linux CI matrix includes it.
