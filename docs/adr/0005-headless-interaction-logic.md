# ADR-0005: Use headless interaction logic behind native custom elements

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-10-26
- Lifecycle: living
- Scope: Toggle, Accordion, Tabs, Slider, Range Slider, Rating, Select, Combobox, Date Picker, and Date Range Picker
- Implementation: ten Zag-backed elements, split browser modules, live examples, and eighteen styling recipes

## Context

The initial requested expansion added Accordion, Toggle, Tabs, Slider, Range Slider, Rating, Select, Combobox, and Date Picker; Date Range Picker extends the calendar slice. Popup selection, multi-thumb interaction, and calendar navigation involve substantial keyboard, focus, dismissal, and accessibility behavior. Reimplementing each pattern would increase the behavior html+ must maintain.

The existing contract remains ordinary HTML forms, native custom elements, shadow DOM, and platform CSS hooks. [ADR-0001](0001-native-form-contract.md) requires one submission owner, while [ADR-0003](0003-specialized-native-inputs.md) protects native editing. A headless library must fit those boundaries rather than dictate a framework, hidden form proxies, or application-level value synchronization.

## Decision

Use Zag 1.46.0 for Toggle, Accordion, Tabs, Slider, Range Slider, Rating, Select, Combobox, Date Picker, and Date Range Picker through its official `@zag-js/vanilla` adapter. Keep html+'s public API as ordinary elements, properties, DOM events, attributes, CSS parts, and tokens. Zag machine types, generated IDs, and callback names stay implementation details.

Adopt per component after checking its actual DOM assumptions. The initial slice implemented Toggle, Accordion, and Tabs; the numeric slice adds Slider, Range Slider, and Rating. Toggle retains a native button; Accordion/Tabs generate native button triggers in shadow DOM and project caller-owned light-DOM sections. Native details/summary would be a smaller disclosure baseline but would not exercise the requested common behavior foundation and deliberate shadow styling surface. Native range remains a smaller single-thumb alternative; the explicit Zag direction shares the slider machine across one and two thumbs. ADR-0008 records the Select/Combobox slice; ADR-0010 adds range mode using the same dependency; ADR-0009 records the Date Picker slice and its native-input boundary. Do not migrate the earlier eight controls simply to standardize on one engine.

Responsibilities are divided as follows:

| Boundary | Responsibility |
| --- | --- |
| Zag | State transitions, applicable keyboard/focus behavior, popup interaction, and ARIA/DOM props |
| html+ DOM binding | Connect/disconnect lifecycle, root lookup, stable editor nodes, property updates, and cleanup |
| html+ form-associated host | Canonical values, names, validity, labels, disabled fieldsets, reset/restoration, and public events |
| html+ styling | Built-in neutral base, deliberate `part` names, tokens, and styling examples |
| Application | Supplied data and constraints, business verification, persistence, and workflow side effects |

[ADR-0007](0007-component-application-boundary.md) owns the product boundary: Zag supplies reusable interaction logic, html+ owns the HTML/form/CSS contract, and application knowledge stays with the caller. Reusing a machine does not transfer application responsibilities into the component.

Keep related popup controls and ARIA references within the same shadow root. Select and Combobox now use the native top-layer strategy in [ADR-0008](0008-selection-popups.md); assess each later popup separately because copying a document-body portal is not sufficient. Pass `getRootNode` explicitly. Internal Zag data attributes can aid implementation, but they do not replace public CSS parts across a shadow boundary.

Adoption is accepted for these implemented machine integrations. Their fields and content do not require hidden form proxies. Slider and Rating hidden-control props are deliberately omitted: their installed 1.46.0 effects guard missing inputs, while ElementInternals handles form state. A narrow DOM-binding owner applies and removes the official adapter's props/listeners; it does not implement a machine interpreter. Controlled host state keeps programmatic assignments separate from user events. Accordion/Tabs emit `valuechange` for view changes, while Toggle emits the form field's `input`/`change` pair.

Keep section content in its original light DOM and form. Generated triggers and content wrappers share one shadow root and explicit ID relationships. Revealing a section does not clone, rewrite, disable, or reset its native editors. Invalid-event handling reveals the first invalid section, including nested custom fields; other hidden invalid fields suppress only their own native validation UI for that validation task. This preserves native submission blocking and avoids hidden focus targets. [The interaction guide](../INTERACTIONS.md) defines the public markup and values.

TypeScript emits declarations, and esbuild bundles split browser modules with explicit per-element entry points. The dev command watches types and bundles; the static export includes all shared JS chunks. Applications can import the built modules without an import map or framework adapter. The current browser checks exercise that exact exported artifact under a repository subpath.

## Evidence: integrated elements, 2026-10-23

The initial Toggle/Accordion/Tabs integration passed sixty-six browser checks across Chromium and WebKit, plus five validation unit tests. The project plan records the current suite, including subsequent theme checks. The added integration checks cover pressed values and user-event counts; defaults, custom errors, external labels, and fieldsets; keyboard modes, RTL and vertical tabs; fields in hidden panels; nested and simultaneous invalid fields with native focus; native undo across panel changes; dynamic sections; reconnection cleanup; built-in styles, text scaling, and mobile recipes. The earlier eight fields retain their existing contract checks. Assistive-technology usability, physical touch devices, Firefox on this host, and real history restoration remain unverified.

## Earlier evidence: isolated combobox, 2026-10-23

Official sources provide all nine initially requested interaction patterns, with date ranges available in the date-picker machine. Range Slider is the multi-thumb configuration of `@zag-js/slider`; Rating uses `@zag-js/rating-group`. The vanilla package exports `VanillaMachine`, `normalizeProps`, and `spreadProps`, so no React or other component runtime is necessary. The date-picker uses `@internationalized/date`; using that date model does not require adopting React Aria's component layer.

The [isolated probe](../../experiments/zag/README.md) pins the combobox and vanilla packages to 1.46.0 and bundles them separately from html+. It runs real browser interactions against two form-associated custom elements with their own shadow roots. Chromium and WebKit pass:

- Filter text, navigate options by keyboard, select a display label, and submit its identifier exactly once through `ElementInternals`.
- Omit an unanswered required choice, block validity, and clear the error after selection.
- Close with Escape and with a pointer click outside the shadow host.
- Keep two instances' generated IDs distinct.
- Disable and re-enable through a fieldset, omit disabled values, restore declared defaults on form reset, and operate after disconnection/reconnection.
- Use no hidden input or hidden select in the fixture and report no page errors.

The minified production-mode probe bundle is 101,462 bytes, or 33,180 bytes with Node's default gzip, including the fixture class. This is a single-combobox experiment, not an incremental cost for html+, a benchmark, or a release size budget. No other component bundle sizes have been measured.

Important limits: external label forwarding, native undo/IME, full user-event semantics, real browser history restoration, touch interaction, assistive technologies, and a clipping-safe production popup are not established by this combobox probe. Its implementation is separate from the integrated interaction elements. Select and Combobox have since completed their integrated slice under [ADR-0008](0008-selection-popups.md); Date Picker has since completed its integrated slice under ADR-0009. The numeric controls also completed their separate integration checks. Firefox remains untested on this host because its existing launch failure occurs before navigation.

## Tradeoffs and alternatives

- **Zag plus vanilla adapter:** reuses component-specific behavior while leaving rendering and styling with html+. Adds a dependency graph, lifecycle/DOM binding work, and upgrade checks. Accessibility still depends on the rendered component and its integration.
- **Native primitives with focused html+ behavior:** smallest integration surface for simpler controls and preserves browser behavior. Remains the first comparison for each element; advanced calendars, comboboxes, and two-thumb sliders require more behavior than a single native field supplies.
- **Own all interaction machines:** avoids a behavior dependency but makes html+ responsible for implementing and maintaining every keyboard, focus, pointer, and dismissal rule. Keep this option for a demonstrated mismatch, rather than choosing it by default.
- **React Aria or a complete component library:** useful references, but changing the component runtime or replacing html+'s markup/styling surface does not fit the current project. A general state-machine engine alone would also leave component behavior to implement; Zag already supplies it.

Zag's Select, Slider, and Rating examples include hidden native controls. Their prop getters and effects must be inspected independently. A passing Combobox without a proxy does not prove those machines can omit their hidden controls unchanged. If an internal native control is needed for behavior, it must not become a second submission owner; do not add light-DOM proxy fields to satisfy a template.

The former `tsc`-only build could not resolve bare package specifiers for browser use. The integrated build now bundles those dependencies with esbuild. Individual earlier field modules keep their native implementations; importing the all-elements registration entry also imports the new Zag-backed elements and their dependency chunks.

## Numeric integration evidence, 2026-10-23

The installed Slider and Rating implementations tolerate omitted hidden inputs. Their form reset/fieldset effects become no-ops, and the form-associated hosts own those operations. Zag still owns pointer geometry, drag completion, collision, roving focus, and keyboard steps. Slider input/change events distinguish continuous movement from commit; controlled property updates remain silent.

Rating needs a narrow semantic adaptation: upstream item checked state can follow hover or mark the first item while unanswered. html+ exposes only a committed score as checked, while retaining Zag highlights and keyboard reachability. Keyboard input ends pointer-preview state before using the machine's focused-key transitions. Label activation explicitly focuses the shadow interaction without selecting a score. The integrated browser checks and [numeric choice guide](../NUMERIC-CHOICES.md) record these boundaries.

## Integrated selection controls, 2026-10-24

Select and Combobox complete the next accepted slice, with host-owned forms and no hidden proxies. Shadow-local manual popovers preserve theme inheritance and ARIA root relationships while Zag/Floating UI handles fixed placement and collisions. Select effects guard their missing hidden select. Combobox keeps a stable native editor, excludes normalized default-value binding, and separates controlled query from committed identifier. [ADR-0008](0008-selection-popups.md) owns the integration and evidence.

## Integrated Date Picker, 2026-10-24

Date Picker completes the requested catalog using Zag calendar views and the shared top-layer popup strategy. A host-owned native editor remains outside Zag's input lookup so selected-value effects and blur correction cannot rewrite raw drafts. Missing-editor actions are guarded and final focus returns to the calendar trigger. ADR-0009 records the date model, locale policy, and evidence.

## Integrated Date Range Picker, 2026-10-26

Date Range Picker uses the same date machine in range mode, with two host-owned editors, explicit boundary names, and visible partial selection. Both date fields share calendar views and neutral styles. Silent editor/reset changes also synchronize the machine's active range boundary through its installed INPUT.FOCUS transition; otherwise a cleared partial range can incorrectly resume at the end. Hovered days have provisional styling, while grid aria-selected reflects committed dates only. ADR-0010 records the range value and completion decisions.

## Review triggers

Inspect each additional machine's form assumptions before using it. Popup placement, editable query handling, and date parsing remain gates for their respective components; this decision does not claim those are solved by the current implemented machines. Keep delivery tasks and candidate value contracts in the [project plan](../PLAN.md).

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

- 2026-10-23: Proposed selective reuse of Zag behind html+'s platform contracts. Recorded a passing isolated vanilla/shadow/FACE combobox probe and its limits; added Range Slider and Rating to the assessment.

- 2026-10-23: Updated the project name to html+ following ADR-0006; the proposal and compatibility evidence are unchanged.

- 2026-10-23: Accepted the bounded Zag integration for Toggle, Accordion, and Tabs after the explicit implementation direction and passing integrated browser checks. Added split module bundling, light-DOM content ownership, and first-invalid-field revelation. Future popup/calendar/slider behavior remains a separate acceptance gate.

- 2026-10-23: Extended accepted adoption to Slider, Range Slider, and Rating with guarded missing-input effects, form-associated forms, stable thumb identities, rating checked/hover adaptation, and pointer/touch/keyboard evidence.

- 2026-10-23: Connected the Zag/html+/application responsibilities to the product scope in ADR-0007.

- 2026-10-24: Accepted the integrated Select/Combobox slice under ADR-0008: guarded missing hidden-select effects, native top-layer popups, and stable native query editing.

- 2026-10-24: Accepted Date Picker under ADR-0009, with strict calendar dates, a native editor outside machine input synchronization, and scoped top-layer rendering.

- 2026-10-26: Added Date Range Picker under ADR-0010 with two native editors, shared calendar views, named ISO boundaries, and inherited theme recipes.
