# ADR-0009: Keep calendar dates and native editing separate from Zag navigation

- Status: accepted
- Created: 2026-10-24
- Updated: 2026-10-29
- Lifecycle: living
- Scope: one Gregorian calendar date; ADR-0010 defines the separate range field

## Context and decision

The requested Date Picker completes the initial Zag catalog. A date-only field must preserve invalid drafts, expose reliable constraints, and avoid turning an ordinary calendar day into a time-zone-dependent timestamp. The existing form, editing, styling, and application boundaries remain constraints.

Use `@zag-js/date-picker` 1.46.0 through the vanilla adapter for calendar navigation, day/month/year views, focus, dismissal, and positioning. Use its `@internationalized/date` peer directly at pinned 3.12.4 for strict `CalendarDate` parsing and calendar arithmetic. Keep those types internal; the element exposes ISO strings and ordinary DOM events. There is no React runtime dependency.

The host owns a stable native editor and `ElementInternals` form state. A complete Gregorian date submits `YYYY-MM-DD`, independently of display locale and browser time zone. Empty or malformed drafts contribute no entry. A complete date outside inclusive bounds remains a canonical value but blocks ordinary submission, like a constrained native date field. Pass no selected value to the calendar for that case, because Zag constrains supplied values; focus a nearby valid day without showing it as an implicit selection. Invalid configuration blocks the calendar and omits the form entry. The [Date Picker guide](../DATE-PICKER.md) owns exact APIs and event rules.

Follow [ADR-0011](0011-functional-locale-context.md): explicit `locale` overrides inherited HTML `lang`, with browser language as fallback. Derive numeric display order, digits, and literal separators from Intl, while retaining the Gregorian date model. Also accept strict ISO input. Do not guess ambiguous formats, accept timestamp strings, or roll impossible dates into another month. Changing locale reformats a complete date and closes an open calendar; an invalid draft remains invalid rather than being reinterpreted under a new field order. Locale validation is explicit. The browser zone affects only calendar Today/announcement context, not value serialization; temporary UTC conversion is confined to Intl display.

Do not bind the native editor through Zag's `getInputProps` or register it in the machine's `[data-part=input]` lookup. In the installed version, native input binding filters characters, blur parsing can constrain or substitute a date, and selected-value effects synchronize editor strings. Those behaviors conflict with ADR-0003's raw editing contract, particularly for incomplete dates and undo. html+ owns input parsing, constraints, commit events, and editor focus. The installed effects safely handle an empty editor lookup, and calendar final-focus actions fall back to the real calendar trigger. This fallback is intentional and verified. No fake or hidden input is introduced.

Reuse ADR-0008's shadow-local manual-popover strategy, with a calendar-width surface rather than a control-width listbox. Zag owns open state and collision-aware fixed placement; the native top layer preserves theme inheritance and escapes clipping. Present the popup as a nonmodal dialog containing the calendar grid. Use native editor semantics and a labeled button for opening; Alt+ArrowDown and F4 are editor shortcuts. All IDs and ARIA relationships remain in one shadow root.

## Consequences and alternatives

- **Native date input:** remains preferable when its platform picker, editing, and styling meet the application need. The explicit Zag direction provides the library's consistent token/part surface and visible calendar views, at the cost of JavaScript and browser verification obligations. It does not reproduce operating-system pickers or native autofill.
- **Zag calendar plus html+ editor:** reuses complex calendar interaction while preserving native editing and the form boundary. Requires maintaining the narrow machine/editor integration and rechecking upstream DOM assumptions on upgrades.
- **Unmodified Zag input binding:** offers less integration code, but would allow blur correction or selected-value synchronization to replace raw drafts. Reject it for this component rather than weakening the native undo contract.
- **Timestamp-backed value:** convenient for instant-based APIs, but introduces a different meaning and can change the displayed calendar day across zones. Keep any application timestamp conversion outside this field.
- **Locale-derived numeric display:** fits multiple numeric date conventions, localized digits, and inherited HTML language. Limits this slice to Gregorian dates and US English action labels; alternate calendar systems and full translated interface copy require separate scope.
- The date model and helpers add runtime code and license obligations. Include their Apache-2.0 and helper notices in browser distributions. Popup API, no-JavaScript, SSR, device, and assistive-technology limits remain explicit.

## Evidence and review triggers

Strict-date unit checks cover real calendar validity, leap years, four-digit years, locale field order/separators and digits, ISO input, and the Gregorian value model. Integrated browser checks exercise calendar views and keys, raw editing/undo/composition, constraints and invalid configuration, native commit events, reset/restoration callbacks, disabled/readonly states, labels, external forms, lifecycle cleanup, clipping/dismissal, invalid-field revelation, inherited popup themes, and Light/Dark recipes. Time-zone contexts cover Los Angeles and Kiritimati, including navigation across a daylight-saving boundary. The plan records the current complete-suite result.

Revisit on changed Zag editor-lookup/final-focus assumptions, date-model upgrades, parsing or locale ambiguity, accessibility regressions, or a supported-browser limitation. Date ranges now follow [ADR-0010](0010-calendar-date-ranges.md), sharing views and styles while retaining separate editors and form APIs. Time selection, unavailable-day policies, alternate calendars, and localized action text still require explicit decisions. Real history restoration, physical devices, manual assistive technologies, and Firefox on this macOS host remain unverified.

## References

- [Date Picker guide](../DATE-PICKER.md)
- [ADR-0001: ordinary forms](0001-native-form-contract.md)
- [ADR-0003: native editing](0003-specialized-native-inputs.md)
- [ADR-0004: value contracts](0004-composite-value-contracts.md)
- [ADR-0005: selective Zag use](0005-headless-interaction-logic.md)
- [ADR-0007: application boundary](0007-component-application-boundary.md)
- [ADR-0008: shadow-local top-layer popups](0008-selection-popups.md)
- [Zag Date Picker](https://zagjs.com/components/date-picker)
- [CalendarDate model](https://react-aria.adobe.com/internationalized/date/CalendarDate)

## Changes

- 2026-10-24: Accepted the single-date integration, explicit locale policy, host-owned raw editor, ISO form value, trigger focus return, and shared top-layer styling strategy.

- 2026-10-26: Linked the separate date-range contract and shared calendar renderer in ADR-0010; retained the single-date API.

- 2026-10-29: Replaced the explicit en-US default and fixed Latin digits with ADR-0011's inherited language context, Intl digits and week information, and silent dynamic formatting.
