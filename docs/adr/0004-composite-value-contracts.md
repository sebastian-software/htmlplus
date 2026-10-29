# ADR-0004: Give composite fields explicit value contracts

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-10-29
- Lifecycle: living

## Context and decision

A field can have one visible editor and a different canonical value, a collection under one name, or several related entries. Encoding every shape as one JSON string would make ordinary server-side form handling less useful. Inferring a universal representation from the UI would also hide units and boundary names.

Choose serialization per field and document it as public API. Durations represent fixed elapsed time as whole, nonnegative seconds. A bare integer is already seconds, so reading and assigning `.value` is idempotent; `01:30` explicitly means hours and minutes. Calendar durations are outside this field's scope.

Intervals expose a numeric pair with nullable boundaries. Submit nonempty boundaries as independent entries through `ElementInternals.setFormValue(FormData, state)`. `lower-name` and `upper-name` can override the defaults `name.min` and `name.max`. Require a host `name`; do not impose server-specific bracket notation or serialize the pair to JSON in the submitted form. JSON is only the declarative default and restoration-state representation. Required intervals need both boundaries; optional intervals can be open-ended. Reject inverted boundaries rather than silently swapping them.

Segmented choices use caller-supplied direct `<option>` children and submit one identifier, independently of its display label. Values must be nonempty; the first option for a duplicate value wins. Missing, unknown, and disabled selections contribute no entry. Native shadow radio inputs provide selection and arrow-key behavior; the host owns submission and required validation. This preserves radio editing behavior without hidden proxy inputs.

Sliders expose a finite number, clamped/snapped to the declared step grid. Range sliders expose an ordered nonnullable pair, submit two named numeric entries using the interval naming convention, and stop thumbs at collision without swapping identities. Programmatic inverted pairs throw. Their value/reset defaults are distinct from current dirty values. Invalid numeric configuration blocks submission rather than passing invalid geometry to Zag.

Ratings expose a whole score or null for unanswered. Hover is separate preview state and never submitted. A committed score submits one numeric string; Clear returns to unanswered and required validation can reject it. Whole scores with 1–10 items are the first scope. The [numeric choice guide](../NUMERIC-CHOICES.md) owns exact API details.

Select and Combobox use the same label/identifier distinction: an enabled selected identifier contributes one string, and an unanswered selection contributes no entry. Combobox query text remains separate; editing invalidates a prior selection, and exact label text alone does not commit. [The selection guide](../SELECTION-CONTROLS.md) owns the detailed contract.

Date Picker uses one Gregorian `YYYY-MM-DD` string or an unanswered state, separately from localized editor text. Complete out-of-range dates retain their ISO value with range validity errors; invalid drafts have no canonical entry. [ADR-0009](0009-calendar-date-picker.md) records the locale and date-model decisions.

Date Range Picker uses nullable ISO boundaries and explicit `start-name` / `end-name`, defaulting to `name.start` / `name.end`. A partial boundary remains inspectable in FormData but requires its counterpart for a complete range. Typed ordering errors preserve identity; the two-point calendar gesture orders its picks. [ADR-0010](0010-calendar-date-ranges.md) records this bounded-range contract.

## Consequences and evidence

Toggle contributes a named string while pressed and no entry while unpressed, with a separate boolean current/default state. Accordion and Tabs expose view state through their properties but contribute no host entries. Their light-DOM fields retain their individual serialization and constraints. The [interaction guide](../INTERACTIONS.md) owns those public APIs.

- The application must agree with the documented units and field names. These representations cannot change casually after publication.
- The duration reuses the proven native-text mechanism. Interval and selection behavior stay in separate classes; a universal base class would obscure their different value shapes and native interactions.
- Browser tests cover named boundaries, order, native numeric constraints, required choices, native radio keys, label focus, repeated-value safety, reset, explicit restoration callbacks, and disabled fieldsets. Exercising a callback is distinct from verifying browser history restoration.
- Revisit this contract when adding date ranges, money, units, or remote selection. Do not assume they share duration units or interval semantics.

Checkbox preserves independent native checked and indeterminate booleans. Only checked determines submission; a mixed display is not a third serialized value. A select-all controller derives its state from application-supplied selections and normally has no name. Radio Group contributes one enabled identifier; Toggle Group uses a string-array property in both single and multiple modes and contributes repeated entries for selected identifiers. Unknown and disabled selections are omitted. Number Input separates localized native drafts from canonical numeric strings and numeric validity. Password visibility changes presentation without changing its value. [Everyday controls](../EVERYDAY-CONTROLS.md) owns the exact APIs and limits.

## Changes

- 2026-10-23: Added duration, interval, and segmented choice to test three distinct value contracts in the ordinary-form playground.

- 2026-10-23: Added Toggle as a named string while pressed; Accordion/Tabs view values are not form entries. Their contained fields retain their own serialization.

- 2026-10-23: Accepted bounded slider numbers, nonnullable range pairs with explicit names and stable thumb identities, and nullable whole ratings with separate hover preview.

- 2026-10-24: Added selected identifiers for Select/Combobox and separate non-submitted query state with immediate invalidation on user editing.

- 2026-10-24: Added the Date Picker calendar-date contract, without a time component, timestamp conversion, or inferred locale order.

- 2026-10-26: Added the bounded date-range value shape, boundary names, and partial-state validation under ADR-0010.

- 2026-10-29: Added everyday controls and the native Button contract; documented mixed selection, host-owned forms, and the required Zag/native editing adaptations.
