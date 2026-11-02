# ADR-0001: Make ordinary HTML forms the integration contract

- Status: accepted
- Created: 2026-10-22
- Updated: 2026-11-02
- Lifecycle: living
- Implementation: twenty-one form controls, three companion elements, a native Button family, and a live playground

## Context and decision

html+ exists to make richer controls usable in ordinary forms without repeating value synchronization in every application. Form submission, `FormData`, validation, labels, disabled state, and reset are the shared integration contract.

[ADR-0007](0007-component-application-boundary.md) defines the product boundary around that contract: components own reusable interaction and value rules, while applications own their data, business decisions, and workflows. Compare each candidate with native HTML before adding a custom element.

Use the platform's form mechanisms. Existing native inputs may remain the submission owner; new composite controls can use form-associated custom elements and `ElementInternals`. Applications should not need hidden proxy inputs or framework-specific form adapters for basic integration. The specialized text-field boundary is recorded in [ADR-0003](0003-specialized-native-inputs.md).

## Consequences

- Each field has one clearly defined submission owner and documented serialization. Collections can produce repeated names; compound values need explicit naming.
- Form association does not implement keyboard interaction, focus, constraints, reset callbacks, or restoration behavior automatically. These remain component responsibilities where the native control does not provide them.
- Framework convenience bindings may be added later without becoming necessary to submit a form.
- A native editor in a shadow root has no form owner, so the browser cannot submit implicitly for it. Text editors therefore follow HTML's implicit submission: Enter activates the form's default button, including validation and the submitter value, and does nothing if that button is disabled. A form without a submit button submits only when it has at most one blocking field. This runs after the native `change` and respects `preventDefault`. Enter that already has a control-specific meaning, such as choosing a highlighted Combobox option or committing a tag, does not submit.
- Compare implementations with a real HTML form before expanding the catalog. Separate current behavior from intended support claims.

Accordion and Tabs are companion elements rather than submission owners. Their sections stay in light DOM so contained inputs preserve their original form association. Hidden panels retain their values and constraints. Interactive validation reveals the first invalid section; secondary hidden invalid fields suppress only their native validation UI during that attempt, not submission blocking. See the [interaction guide](../INTERACTIONS.md).

Native Field (`h6-field`) is also a companion element. It gives a direct native input, textarea, or select the shared base appearance while retaining the original control in light DOM. Names, values, constraints, labels, autofill hints, and form association belong on that native control. The wrapper is not form-associated, does not mirror a value API, and creates no hidden proxy. A new shadow-owned editor and forwarding API would duplicate native contracts without adding interaction behavior. Use this wrapper when presentation is the only gap; specialized controls remain appropriate when value formats or interactions differ. See [native fields](../NATIVE-FIELDS.md).

Select and Combobox submit only enabled selected identifiers. Query edits invalidate selection, and query-only text does not become a form value. Their form and popup contracts are recorded in [ADR-0008](0008-selection-popups.md).

Date Picker submits one Gregorian ISO date independently of its localized native editor. Invalid drafts remain visible and do not submit a stale date; constraints and popup behavior follow [ADR-0009](0009-calendar-date-picker.md).

Date Range Picker adds two explicit ISO boundaries and visible partial state, with complete-range validation under [ADR-0010](0010-calendar-date-ranges.md).

## Shared form behavior

Every form control must prove the following, rather than assuming it from form association:

- A regular submission and `new FormData(form)` contain the expected entries exactly once. An enhanced native input and its host never both submit the same logical value, and no hidden proxy input is required.
- Value properties, initial defaults, attribute changes, and programmatic updates have documented behavior. Programmatic assignment does not invent user input events, and user edits emit `input` and `change` without duplicates across component boundaries.
- `name`, `form`, `disabled`, `required`, and `readonly` behave like the underlying control where they apply, including inside a disabled fieldset.
- Reset restores declared defaults. History restoration is evaluated separately, and universal autofill is not assumed from form association.
- Labels activate the actual editable control. Focus, keyboard operation, accessible names, and errors work without a pointer.
- Native validity blocks submission, and applications can add and clear server-originated errors.
- Companion elements demonstrate that their contained fields still submit correctly.

## Review trigger

Revisit the mechanism if a supported browser cannot provide reliable submission, validation, labels, or reset for a proposed control. Preserve the ordinary-form integration goal while changing the component's implementation strategy.

## References

- [HTML: form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-face-example)
- [Project plan](../PLAN.md)

Native action buttons remain actual `<button>` elements styled by the optional `native.css`. An autonomous form-associated custom element does not become a native submitter, so replacing it would lose browser-owned action values, validation, overrides, and reset behavior. Native submitter semantics are more valuable here than a uniform custom tag. The Button gallery captures `FormData(form, submitter)`; an ordinary live `FormData(form)` has no activated action value.

## Changes

- 2026-10-22: Recorded the project's defining ordinary-form integration goal. The first implementation uses form-associated hosts; specialized editors are separated from their canonical submission values in ADR-0003.

- 2026-10-23: Extended the ordinary-form contract to elapsed durations, numeric boundary pairs, and native radio selections; ADR-0004 defines their serialization.

- 2026-10-23: Updated the project name to html+ following ADR-0006; the form contract is unchanged.

- 2026-10-23: Added the form-associated Toggle and light-DOM Accordion/Tabs contract, including nested and multiple-invalid-field revelation.

- 2026-10-23: Added Slider, Range Slider, and Rating as form-associated numeric controls without hidden submission proxies. Their numbers, boundary names, and nullable score follow ADR-0004.

- 2026-10-23: Linked ADR-0007's component/application boundary and native-HTML comparison rule to the ordinary-form contract.

- 2026-10-24: Added Select and Combobox as form-associated hosts with one selected identifier and no hidden proxy. ADR-0008 records popup and query behavior.

- 2026-10-24: Added Date Picker with host-owned native editing, date-only submission, explicit locale parsing, and inclusive constraints under ADR-0009.

- 2026-10-26: Added Date Range Picker as one form-associated host that submits two named ISO boundaries and keeps a partial selection visible in FormData while validation requires a complete range. ADR-0010 owns the contract.

- 2026-10-29: Added five everyday controls as form-associated hosts with no hidden proxy, and kept action buttons as native `<button>` elements because an autonomous custom element cannot be a native submitter.

- 2026-10-29: Added Native Field as a presentation-only companion, retaining original light-DOM control ownership instead of forwarding native form APIs through another form-associated host.

- 2026-11-02: Added implicit submission for shadow editors. Enter previously did nothing in them, which broke ordinary forms such as logins.

- 2026-11-02: Aligned shared control behavior with native fields: invalid presentation waits for `data-touched`, assignment coerces like native text fields, properties set before upgrade are replayed, host `change` is composed, and format errors use specific validity states rather than `customError`.

- 2026-11-02: Moved the shared form-behavior checklist here from the project plan when the plan was reduced to next steps, and replaced two generic change notes with ones specific to this decision.
