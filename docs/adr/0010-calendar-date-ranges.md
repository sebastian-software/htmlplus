# ADR-0010: Expose calendar ranges as two explicit date boundaries

- Status: accepted
- Created: 2026-10-26
- Updated: 2026-10-26
- Lifecycle: living
- Scope: bounded inclusive Gregorian date ranges

## Decision and rationale

Use the existing `@zag-js/date-picker` 1.46.0 machine in range mode, preserving ADR-0009's Gregorian ISO date model, explicit locale parsing, host-owned native editing, and shadow-local top-layer popup. No new dependency or component runtime is needed. Share calendar view rendering and neutral base styles between the two date fields; keep their different public values and form states in focused hosts rather than a universal form base.

Expose `[start, end]` as a pair of ISO strings with nullable boundaries. A host `name` enables two independent FormData entries, defaulting to `name.start` and `name.end`, with `start-name` / `end-name` overrides. JSON is only the declarative default and restoration representation. This follows ADR-0004's explicit naming without treating calendar dates as numeric minima/maxima or an opaque submitted JSON value. Native editors remain unnamed; ElementInternals owns submission.

A partial start is real current state rather than an unobservable calendar transaction. Each complete boundary enters FormData immediately, while hover remains a separate preview. Ordinary validation requires both boundaries whenever either is entered; optional empty ranges remain valid. Dismissal preserves a partial selection and reopening resumes it. This keeps the live inspector honest and makes unfinished work recoverable. Applications must use native validation or validate submitted boundaries themselves, as with any form. An implicit rollback would hide the person's first selection, while accepting an open-ended range would change the component's bounded meaning.

Typed and programmatic boundaries preserve their identities and report inverted order without correction. Calendar interaction selects two points rather than editing an identified boundary, so Zag orders those points chronologically; same-day ranges are allowed. Both ends are inclusive. Booking/check-out duration semantics belong to the application. Inclusive bounds apply to both dates; canonical out-of-bounds values remain inspectable and invalid, while invalid configuration omits the entries and disables the popup. Do not let Zag constrain an invalid pair into an apparently selected alternative.

## Consequences and evidence

Two native editors preserve raw drafts, selection, undo, and composition independently. The calendar uses the installed machine's guarded missing-input behavior and trigger focus fallback. Silent editor/reset changes also reset the machine's active range boundary through its installed INPUT.FOCUS transition; controlled values alone leave unfinished range progress behind. A restarted range also moves the machine's keyboard origin to the pointer-selected start, so switching input methods does not jump back to an old boundary. Provisional hover styling does not set grid aria-selected. These installed-machine assumptions and the adapter must be rechecked on dependency upgrades. Selected boundaries use primary tokens, the span uses accent tokens, and provisional preview has a distinct public part; inherited themes and detailed overrides remain separate styling layers.

Focused browser checks cover selection, preview versus submitted state, partial validation and recovery, order, same-day ranges, native editing, names, reset, fieldsets, locale/zone stability, lifecycle, popup clipping, themes, and containing tabs. Existing Date Picker checks cover the shared view renderer. The project plan records full-suite results and outstanding browser/device evidence. Business availability, timestamp conversion, booking workflows, endpoints, and persistence stay application-owned under ADR-0007.

## References

- [Date Range Picker contract](../DATE-RANGE-PICKER.md)
- [Single-date integration](0009-calendar-date-picker.md)
- [Composite value contracts](0004-composite-value-contracts.md)
- [Zag Date Picker, including range selection](https://zagjs.com/components/react/date-picker)

## Changes

- 2026-10-26: Accepted two named ISO boundaries, visible partial state with complete-range validation, independent native editors, shared calendar views, and the distinction between range gestures and identified text boundaries.
