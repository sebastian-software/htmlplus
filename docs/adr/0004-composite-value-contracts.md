# ADR-0004: Give composite fields explicit value contracts

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-10-23
- Lifecycle: living

## Context and decision

A field can have one visible editor and a different canonical value, a collection under one name, or several related entries. Encoding every shape as one JSON string would make ordinary server-side form handling less useful. Inferring a universal representation from the UI would also hide units and boundary names.

Choose serialization per field and document it as public API. Durations represent fixed elapsed time as whole, nonnegative seconds. A bare integer is already seconds, so reading and assigning `.value` is idempotent; `01:30` explicitly means hours and minutes. Calendar durations are outside this field's scope.

Intervals expose a numeric pair with nullable boundaries. Submit nonempty boundaries as independent entries through `ElementInternals.setFormValue(FormData, state)`. `lower-name` and `upper-name` can override the defaults `name.min` and `name.max`. Require a host `name`; do not impose server-specific bracket notation or serialize the pair to JSON in the submitted form. JSON is only the declarative default and restoration-state representation. Required intervals need both boundaries; optional intervals can be open-ended. Reject inverted boundaries rather than silently swapping them.

Segmented choices use caller-supplied direct `<option>` children and submit one identifier, independently of its display label. Values must be nonempty; the first option for a duplicate value wins. Missing, unknown, and disabled selections contribute no entry. Native shadow radio inputs provide selection and arrow-key behavior; the host owns submission and required validation. This preserves radio editing behavior without hidden proxy inputs.

## Consequences and evidence

- The application must agree with the documented units and field names. These representations cannot change casually after publication.
- The duration reuses the proven native-text mechanism. Interval and selection behavior stay in separate classes; a universal base class would obscure their different value shapes and native interactions.
- Browser tests cover named boundaries, order, native numeric constraints, required choices, native radio keys, label focus, repeated-value safety, reset, explicit restoration callbacks, and disabled fieldsets. Exercising a callback is distinct from verifying browser history restoration.
- Revisit this contract when adding date ranges, money, units, or remote selection. Do not assume they share duration units or interval semantics.

## Changes

- 2026-10-23: Added duration, interval, and segmented choice to test three distinct value contracts in the ordinary-form playground.
