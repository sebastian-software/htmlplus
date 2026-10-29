# ADR-0001: Make ordinary HTML forms the integration contract

- Status: accepted
- Created: 2026-10-22
- Updated: 2026-10-29
- Lifecycle: living
- Implementation: twenty-one form controls, two companion elements, a native Button family, and a live playground

## Context and decision

html+ exists to make richer controls usable in ordinary forms without repeating value synchronization in every application. Form submission, `FormData`, validation, labels, disabled state, and reset are the shared integration contract.

[ADR-0007](0007-component-application-boundary.md) defines the product boundary around that contract: components own reusable interaction and value rules, while applications own their data, business decisions, and workflows. Compare each candidate with native HTML before adding a custom element.

Use the platform's form mechanisms. Existing native inputs may remain the submission owner; new composite controls can use form-associated custom elements and `ElementInternals`. Applications should not need hidden proxy inputs or framework-specific form adapters for basic integration. The specialized text-field boundary is recorded in [ADR-0003](0003-specialized-native-inputs.md).

## Consequences

- Each field has one clearly defined submission owner and documented serialization. Collections can produce repeated names; compound values need explicit naming.
- Form association does not implement keyboard interaction, focus, constraints, reset callbacks, or restoration behavior automatically. These remain component responsibilities where the native control does not provide them.
- Framework convenience bindings may be added later without becoming necessary to submit a form.
- Compare implementations with a real HTML form before expanding the catalog. Separate current behavior from intended support claims.

Accordion and Tabs are companion elements rather than submission owners. Their sections stay in light DOM so contained inputs preserve their original form association. Hidden panels retain their values and constraints. Interactive validation reveals the first invalid section; secondary hidden invalid fields suppress only their native validation UI during that attempt, not submission blocking. See the [interaction guide](../INTERACTIONS.md).

Select and Combobox submit only enabled selected identifiers. Query edits invalidate selection, and query-only text does not become a form value. Their form and popup contracts are recorded in [ADR-0008](0008-selection-popups.md).

Date Picker submits one Gregorian ISO date independently of its localized native editor. Invalid drafts remain visible and do not submit a stale date; constraints and popup behavior follow [ADR-0009](0009-calendar-date-picker.md).

Date Range Picker adds two explicit ISO boundaries and visible partial state, with complete-range validation under [ADR-0010](0010-calendar-date-ranges.md).

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

- 2026-10-26: Added Date Range Picker under ADR-0010 with two native editors, shared calendar views, named ISO boundaries, and inherited theme recipes.

- 2026-10-29: Added everyday controls and the native Button contract; documented mixed selection, host-owned forms, and the required Zag/native editing adaptations.
