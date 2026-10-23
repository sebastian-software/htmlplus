# ADR-0005: Use headless interaction logic behind native custom elements

- Status: proposed
- Created: 2026-10-23
- Updated: 2026-10-23
- Lifecycle: living
- Implementation: isolated combobox compatibility probe; production dependencies unchanged

## Context

The requested expansion adds Accordion, Toggle, Tabs, Slider, Range Slider, Rating, Select, Combobox, and Date Picker. Popup selection, multi-thumb interaction, and calendar navigation involve substantial keyboard, focus, dismissal, and accessibility behavior. Reimplementing each pattern would increase the behavior html6 must maintain.

The existing contract remains ordinary HTML forms, native custom elements, shadow DOM, and platform CSS hooks. [ADR-0001](0001-native-form-contract.md) requires one submission owner, while [ADR-0003](0003-specialized-native-inputs.md) protects native editing. A headless library must fit those boundaries rather than dictate a framework, hidden form proxies, or application-level value synchronization.

## Proposed direction

Use Zag as the preferred candidate for complex interaction logic, through its official `@zag-js/vanilla` adapter. Keep html6's public API as ordinary elements, properties, DOM events, attributes, CSS parts, and tokens. Zag machine types, array-shaped internal state, generated IDs, and callback names stay implementation details.

Adopt per component after checking its actual DOM assumptions. Prefer native controls when they provide the required interaction: compare `details`/`summary` for disclosures, a native pressed button for toggle, native range input for one numeric slider, and native select/date inputs for their respective scopes. Do not migrate the eight implemented controls simply to standardize on one engine.

Responsibilities would be divided as follows:

| Boundary | Responsibility |
| --- | --- |
| Zag | State transitions, applicable keyboard/focus behavior, popup interaction, and ARIA/DOM props |
| html6 DOM binding | Connect/disconnect lifecycle, root lookup, stable editor nodes, property updates, and cleanup |
| html6 form-associated host | Canonical values, names, validity, labels, disabled fieldsets, reset/restoration, and public events |
| html6 styling | Built-in neutral base, deliberate `part` names, tokens, and styling examples |

Keep related popup controls and ARIA references within the same shadow root initially. Investigate clipping and native top-layer integration before choosing a production popup strategy; copying a document-body portal is not sufficient. Pass `getRootNode` explicitly. Internal Zag data attributes can aid implementation, but they do not replace public CSS parts across a shadow boundary.

Production adoption is not accepted yet. The probe below establishes feasibility for one machine, not a universal adapter contract.

## Evidence: 2026-10-23

Official sources provide all nine requested interaction patterns. Range Slider is the multi-thumb configuration of `@zag-js/slider`; Rating uses `@zag-js/rating-group`. The vanilla package exports `VanillaMachine`, `normalizeProps`, and `spreadProps`, so no React or other component runtime is necessary. The date-picker uses `@internationalized/date`; using that date model does not require adopting React Aria's component layer.

The [isolated probe](../../experiments/zag/README.md) pins the combobox and vanilla packages to 1.46.0 and bundles them separately from html6. It runs real browser interactions against two form-associated custom elements with their own shadow roots. Chromium and WebKit pass:

- Filter text, navigate options by keyboard, select a display label, and submit its identifier exactly once through `ElementInternals`.
- Omit an unanswered required choice, block validity, and clear the error after selection.
- Close with Escape and with a pointer click outside the shadow host.
- Keep two instances' generated IDs distinct.
- Disable and re-enable through a fieldset, omit disabled values, restore declared defaults on form reset, and operate after disconnection/reconnection.
- Use no hidden input or hidden select in the fixture and report no page errors.

The minified production-mode probe bundle is 101,462 bytes, or 33,180 bytes with Node's default gzip, including the fixture class. This is a single-combobox experiment, not an incremental cost for html6, a benchmark, or a release size budget. No other component bundle sizes have been measured.

Important limits: external label forwarding, native undo/IME, full user-event semantics, real browser history restoration, touch interaction, assistive technologies, and a clipping-safe production popup are not established by this probe. Firefox remains untested on this host because its existing launch failure occurs before navigation. The nine expansion elements are not implemented in the production library.

## Tradeoffs and alternatives

- **Zag plus vanilla adapter:** reuses component-specific behavior while leaving rendering and styling with html6. Adds a dependency graph, lifecycle/DOM binding work, and upgrade checks. Accessibility still depends on the rendered component and its integration.
- **Native primitives with focused html6 behavior:** smallest integration surface for simpler controls and preserves browser behavior. Remains the first comparison for each element; advanced calendars, comboboxes, and two-thumb sliders require more behavior than a single native field supplies.
- **Own all interaction machines:** avoids a behavior dependency but makes html6 responsible for implementing and maintaining every keyboard, focus, pointer, and dismissal rule. Keep this option for a demonstrated mismatch, rather than choosing it by default.
- **React Aria or a complete component library:** useful references, but changing the component runtime or replacing html6's markup/styling surface does not fit the current project. A general state-machine engine alone would also leave component behavior to implement; Zag already supplies it.

Zag's Select, Slider, and Rating examples include hidden native controls. Their prop getters and effects must be inspected independently. A passing Combobox without a proxy does not prove those machines can omit their hidden controls unchanged. If an internal native control is needed for behavior, it must not become a second submission owner; do not add light-DOM proxy fields to satisfy a template.

The current `tsc` build emits browser modules without resolving bare package specifiers. The probe uses esbuild, establishing that bundling works for the tested case. Before production integration, select a build path that preserves explicit per-element imports and browser-ready demo output. Keep the existing eight controls independent of Zag until there is a reason to change them.

## Acceptance and review triggers

Accept or revise this proposal after a production-sized component proves the actual DOM binding, public events, external labels, editable text preservation, popup placement, reset/fieldset behavior, and browser-ready build. Inspect each additional machine's form assumptions before using it. Keep delivery tasks and candidate value contracts in the [project plan](../PLAN.md).

Revisit on an adapter/machine contract change, a supported-browser failure, editing or accessibility regressions, or a dependency cost that outweighs the behavior reused. Upgrade the machine and adapter versions together and rerun the compatibility probe.

## References

- [Zag introduction and component catalog](https://zagjs.com/overview/introduction)
- [Zag framework adapter guide](https://zagjs.com/guides/framework-adapters)
- [Official vanilla adapter source](https://github.com/chakra-ui/zag/tree/main/packages/frameworks/vanilla)
- [Combobox API, including shadow-root lookup](https://zagjs.com/components/combobox)
- [Select native-control props](https://github.com/chakra-ui/zag/blob/main/packages/machines/select/src/select.connect.ts)
- [Range slider](https://zagjs.com/components/range-slider)
- [Rating group](https://zagjs.com/components/rating-group)
- [Date picker and date model](https://zagjs.com/components/date-picker)
- [React Aria](https://react-aria.adobe.com/)

## Changes

- 2026-10-23: Proposed selective reuse of Zag behind html6's platform contracts. Recorded a passing isolated vanilla/shadow/FACE combobox probe and its limits; added Range Slider and Rating to the assessment.
