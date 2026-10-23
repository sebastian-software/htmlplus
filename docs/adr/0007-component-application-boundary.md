# ADR-0007: Keep component behavior independent of application knowledge

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-10-24
- Lifecycle: living
- Scope: product scope, component APIs, and public positioning

## Context

html+ includes specialized form fields and core interaction elements. Both need a consistent boundary as the catalog grows: a reusable control needs enough knowledge to handle its value correctly, while the consuming application knows the people, records, permissions, and workflows around that value.

An IBAN field already knows structural rules and check digits. That is useful value-format knowledge, distinct from knowing an account's owner or initiating a payment. The same distinction applies to an OTP's format versus its validity in an authentication flow, or a rating's selected score versus permission to publish a review.

Nolan Lawson's October 19, 2026 article questions the value of web components as code generation changes the economics of reuse. It also retains self-contained widgets as a sensible reuse case, illustrated by an emoji picker. This is useful context for html+'s scope, not evidence of customer demand or an endorsement of this project. Our decision does not depend on his forecast about AI adoption.

## Decision

**html+ extends HTML's capabilities while application decisions stay with the application.**

Express this in the README as **More capable HTML. Ordinary forms.** Address developers who need richer controls with a framework-independent HTML, form, and CSS contract. Describe concrete behavior and compatibility limits rather than claiming universal superiority over native controls or framework libraries.

Compare each candidate with native HTML first. Prefer the native element when it meets the interaction, form, and styling requirements. A custom element needs an explicit reason, such as a missing composite interaction, specialized value handling, or a shared styling contract. [ADR-0005](0005-headless-interaction-logic.md) records the current selective use of native behavior and Zag.

Components own reusable interaction, value-format rules, serialization, and the applicable form contract. Applications supply data, declare constraints, and own business decisions, remote verification, persistence, and workflow side effects. Components may apply caller-declared constraints and surface application-supplied errors through `setCustomValidity` without implementing the policy or service that produced them.

| Element or scenario | Component responsibility | Application responsibility |
| --- | --- | --- |
| IBAN | Supported national formats, check digits, editing, and canonical submission | Account existence, ownership, recipient verification, and payments |
| OTP | Configured format, leading zeros, editing, and autofill hints | Code delivery, verification, expiry, retries, and authentication |
| Rating | Score selection, clearing, preview, and form contribution | What is rated, who may rate, and where the result is saved |
| Range Slider | Ordered values, thumb interaction, and explicitly named form entries | Meaning of the range and the business policy behind supplied bounds |
| Accordion and Tabs | Section navigation, focus, and revealing contained invalid fields | Workflow progress, route state, and authorization to access content |
| Combobox | Query/selection distinction, option interaction, and selected identifier | Data sources, remote requests, authorization, and persistence |

Components do not fetch business records or initiate application workflows. Applications compose those behaviors around values, properties, and DOM events. Companion elements do not acquire submitted values merely by belonging to the library.

Zag supplies reusable interaction logic behind the element API. html+ remains responsible for the rendered integration, form behavior, and styling contract. Form association and headless logic do not automatically establish accessible or reliable behavior; implementation and verification remain necessary.

## Consequences and alternatives

- Developers can reuse the same component contract in applications with different data sources and workflows. Applications still implement business integration and may need convenience bindings.
- Specialized fields may contain domain-specific format knowledge. Application independence does not require making them generic text boxes or treating a successful format check as business verification.
- Keep service-specific workflows and ready-made application screens outside the core catalog. Such integrations can offer a shorter setup path, but would couple core APIs to application policies and service lifecycles.
- Keep native HTML as an alternative for every candidate. A custom element adds JavaScript, lifecycle work, and compatibility obligations; justify that cost against the needed behavior. The current prototype's SSR, no-JavaScript, browser, and assistive-technology limits remain documented in the README.
- The maintained contract and checked behavior are the product value. Code generation can help build an implementation; it does not establish correct form values, keyboard behavior, reset, validation, or editing history. Do not turn this rationale into an unmeasured claim about adoption, savings, or accessibility.

## Review triggers

Review a proposed API when it needs an endpoint, credentials, an application-specific record schema, a permission decision, or an automatic workflow side effect. First look for values, options, constraints, content, or events that let the application retain ownership. Record a deliberate scope change here if that boundary no longer fits.

Reassess a custom element when native HTML meets the documented need with less integration work. Reassess public claims when behavior or compatibility evidence changes. Existing checks for form serialization, native editing, rating preview, and invalid-field revelation are concrete examples of the behavior this boundary must preserve.

## References

- [README: purpose and component scope](../../README.md#what-belongs-in-html)
- [Project plan](../PLAN.md)
- [ADR-0001: ordinary HTML forms](0001-native-form-contract.md)
- [ADR-0003: native editing and canonical values](0003-specialized-native-inputs.md)
- [ADR-0004: composite value contracts](0004-composite-value-contracts.md)
- [ADR-0005: headless interaction logic](0005-headless-interaction-logic.md)
- [Nolan Lawson: Do web components have a future if nobody is writing them?](https://nolanlawson.com/2026/10/19/do-web-components-have-a-future-if-nobody-is-writing-them/) — published October 19, 2026; consulted October 23, 2026.

## Changes

- 2026-10-23: Accepted the guiding principle and component/application boundary. Added native-HTML selection criteria, concrete responsibility examples, public claim limits, and Lawson's article as contextual reference.

- 2026-10-24: Updated Combobox from planned scope to implemented selection behavior; data sources, verification, and workflows remain application responsibilities.
