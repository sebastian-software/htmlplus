# ADR-0008: Use Zag selection controls with shadow-local top-layer popups

- Status: accepted
- Created: 2026-10-24
- Updated: 2026-10-24
- Lifecycle: living
- Scope: Select and Combobox; Date Picker reuses the popup strategy under ADR-0009

## Context and decision

Select and Combobox extend the requested Zag catalog. A useful integration must preserve the ordinary-form contract, distinguish query text from selection, keep labels and ARIA references scoped, and work in clipped layouts. The earlier isolated Combobox probe in ADR-0005 established a starting point, but did not resolve these integrated obligations.

Use `@zag-js/select` and `@zag-js/combobox` at the same pinned 1.46.0 version as the existing machines, through the vanilla adapter. Expose single selection from caller-supplied direct options. Applications own data access and workflows under [ADR-0007](0007-component-application-boundary.md). The [selection guide](../SELECTION-CONTROLS.md) owns exact APIs, event rules, and option handling.

`ElementInternals` owns submission, constraints, disabled fieldsets, reset, and restoration. Omit Zag's hidden-select props and leave the native query editor unnamed. The installed Select effects guard a missing hidden select before syncing or dispatching; its form tracker becomes a no-op. The host handles those responsibilities. No proxy field or second submission owner is added.

A Combobox query is separate from its selected identifier. User edits immediately invalidate the previous selection. Exact label text, blur, and undo do not silently establish a new selection. The machine receives controlled selection/query state with preserved query behavior; the native editor is stable, and the binding excludes normalized default-value writes during renders. Typing preserves text, selection, native undo, and composition. Choosing an option deliberately sets its label and commits its identifier.

Keep the popup in the same shadow root as its trigger/editor. Use a native `popover="manual"` positioner for the top layer, with Zag/Floating UI fixed positioning, shared control width, and viewport collision handling. Zag owns open state and keyboard/outside dismissal. Mirror that state into native show/hide operations instead of introducing independent native auto-popover dismissal. Tab closes the Combobox popup without committing a suggestion. This avoids a document-body portal, clipping by ancestors, lost inherited theme tokens, and cross-root ARIA IDs.

Both controls include neutral styling, `--hp-*` themes, shadcn adapter coverage, a Base and styled recipe, and live FormData examples. Popover colors now have real component consumers rather than only reserved palette entries.

## Alternatives and consequences

- **Native select:** remains the first choice when its interaction, form, and styling contract meets the application need. It offers native platform integration and operating-system pickers that these custom controls do not reproduce. The explicit Zag direction provides the same deliberate part/token API and behavior foundation as the other html+ interaction elements.
- **Shadow-local native popover plus Zag positioning:** preserves scope and avoids clipping. Adds the Popover API requirement, open-state coordination, a positioning dependency, and browser verification obligations. No older-browser fallback or exact minimum browser version is claimed.
- **Document-body portal:** can escape clipping, but would need another solution for inherited themes, root lookup, and ARIA relationships. Do not move the popup across roots for this slice.
- **Custom absolute-positioned popup:** has a smaller platform dependency but remains vulnerable to clipping and stacking contexts. Z-index alone cannot solve those cases.
- **Free-text or remote Combobox:** would add different value and request lifecycles. Keep those outside this single-selection contract; expose query text and option updates for application composition.

Rendering and integration still own accessibility. Headless behavior and native top-layer placement do not prove screen-reader usability. Clear, disabled/readonly states, labels, native validation, and reset must remain coherent with selected and query state.

## Evidence and review triggers

Integrated Chromium and WebKit checks exercise form values and event counts, known/disabled/duplicate/dynamic options, dirty defaults, reset/restoration callbacks, readonly and disabled fieldsets, external forms, reconnect cleanup, labels/descriptions, native undo and composition, query-only omission, no results, invalid fields in Tabs, popup clipping/collision, Escape/outside/Tab dismissal, local shadcn popover tokens, and Light/Dark mobile recipes. The repository plan records the current complete-suite result.

Firefox remains blocked by the existing pre-navigation macOS profile failure; Linux CI is configured for all three engines. Physical-device interaction/autofill, manual assistive-technology coverage, and real history restoration remain unverified. Date Picker has since completed its separate integration under ADR-0009.

Revisit on changes to Zag's omitted-hidden-control assumptions, Popover API behavior, focus/dismissal regressions, theme inheritance, or supported-browser requirements. Multiple selection, remote integration, grouped options, and virtualization require explicit additional scope and evidence.

## References

- [ADR-0001: ordinary forms](0001-native-form-contract.md)
- [ADR-0003: native editing](0003-specialized-native-inputs.md)
- [ADR-0004: value contracts](0004-composite-value-contracts.md)
- [ADR-0005: selective Zag adoption](0005-headless-interaction-logic.md)
- [ADR-0007: component/application boundary](0007-component-application-boundary.md)
- [Selection API and examples](../SELECTION-CONTROLS.md)
- [Zag Select](https://zagjs.com/components/select)
- [Zag Combobox](https://zagjs.com/components/combobox)
- [HTML popovers](https://html.spec.whatwg.org/multipage/popover.html)

## Changes

- 2026-10-24: Accepted single-selection Select and Combobox with ElementInternals, explicit query invalidation, stable native editing, shadow-local manual popovers, scoped theming, and integrated browser evidence.

- 2026-10-24: Linked the Date Picker successor integration in ADR-0009; the Select/Combobox contract is unchanged.
