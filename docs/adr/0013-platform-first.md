# ADR-0013: Build on Baseline platform features first, and use Zag only where it earns its weight

- Status: accepted
- Created: 2026-11-03
- Updated: 2026-11-03
- Lifecycle: living
- Scope: browser floor, the choice between platform, own code, and Zag for each element, and the rules for binding Zag props

## Context

[ADR-0005](0005-headless-interaction-logic.md) put fifteen elements on Zag. Three costs have since become visible:

- **Size.** Zag dominates even simple elements. `hplus-toggle` is 27.7 KB minified for a pressed button, and two thirds of it is Zag. Select and Combobox spend about 26 KB minified on Floating UI positioning alone. [Element sizes](../SIZES.md) has the current numbers.
- **Upgrade coupling.** Zag 1.47 broke Combobox announcements and Password Input visibility. Both breaks happened where html+ overrides Zag's props, so an upstream change met an assumption Zag could not see.
- **Lost platform behavior.** Every Zag-backed control re-creates keyboard, focus, and dismissal rules that browsers now ship natively.

The platform has moved since those decisions. Popovers, invoker commands, exclusive `<details name>`, the core of CSS anchor positioning, and `:state()` are all Baseline. Firefox 147 completed core anchor positioning in January 2026.

A survey of other headless libraries found no better framework-independent fit:

- React Aria, Downshift, Ariakit, Radix, Base UI, and Headless UI are React, or React and Vue.
- Melt UI and Bits UI are Svelte, and Kobalte is Solid.
- Lion, Spectrum Web Components, Fluent and FAST, and Web Awesome are complete components. Each brings its own markup, styling, and form model, which conflict with ADR-0001 and ADR-0002.
- Small single-purpose packages such as `@github/combobox-nav` cover only keyboard navigation.

Zag remains the only maintained headless library with a vanilla adapter that covers Combobox, calendars, and sliders.

## Decision

**Assume Baseline.** html+ assumes every feature that the [web-features](https://github.com/web-platform-dx/web-features) data marks Baseline, newly or widely available, when a release is cut. Baseline features get no polyfill and no fallback.

A feature that is not yet Baseline may be used only as progressive enhancement. The element must still work in an engine that lacks it. This applies to features such as customizable `<select>`, `position-visibility`, `popover="hint"`, `closedby`, Temporal, and `referenceTarget`. Using `document.execCommand("insertText")` only as a fallback, as ADR-0003 does, already follows this rule.

**Choose per element, platform first.** Pick the first option that meets the element's existing contract:

1. A native element or platform API.
2. Focused html+ code on top of native elements.
3. A Zag machine, when it supplies substantial behavior that no Baseline feature covers.

Applied to the current catalog:

| Group | Elements | Direction |
| --- | --- | --- |
| Keep on Zag | Combobox, Date Picker, Date Range Picker, Slider, Range Slider, Number Input | Substantial keyboard, pointer, calendar, or stepping behavior with no Baseline equivalent |
| Keep on Zag for now | Select | Reassess a shadow-local native `<select>` once customizable `<select>` is Baseline; Firefox lacks it today |
| Move to the platform | Toggle, Checkbox, Radio Group, Toggle Group, Tabs, Accordion, Password Input, Rating | Native buttons, inputs, and `<details name>` carry most of the behavior; the remaining keyboard rules are small |
| Replace inside Zag elements | Floating UI positioning | Use core anchor positioning on the shadow-local popovers, if Zag lets positioning be left out of the bundle |

**Bind Zag completely, unless a contract says otherwise.** Bind every prop and handler that a prop getter returns. Leave one out only when it would take over something html+ owns: the native editor's text, undo, and composition (ADR-0003), form submission (ADR-0001), or an ID html+ assigns. Add missing behavior by wrapping Zag's handler and calling it, never by replacing it. A test records the handler names of every getter that html+ filters, so an upgrade that adds a handler fails with a clear message.

## Alternatives

- **Switch to another headless library.** None fits without a framework runtime or a foreign markup and form model.
- **Stay on Zag everywhere.** Keeps one engine but keeps the size and the upgrade coupling for simple controls.
- **Own every interaction.** Combobox, calendars, and two-thumb sliders are too much behavior to re-create and maintain.
- **Assume only widely available Baseline.** It lags 30 months behind. It would exclude popovers until mid-2027, which html+ already depends on, as well as invoker commands and anchor positioning.

## Consequences

- Moving an element is its own slice. Its public API stays the same: tag, attributes, properties, events, parts, and tokens. Its existing browser suite is the behavior contract.
- Simple controls gain own code for roving focus and arrow keys, which html+ must maintain.
- The browser floor follows from Baseline rather than from verified minimum versions. The README states it, and the build target should follow it.
- An element that keeps Zag still pays for the upgrade checks in ADR-0005.
- ADR-0012's review trigger for scoped custom element registries now applies: they became Baseline in October 2026.

## Evidence and review triggers

Baseline status comes from web-features 3.45.0 on 2026-11-03. Popovers became Baseline on 2025-01-27, invoker commands on 2025-12-12, `<details name>` on 2024-09-03, and `:state()` on 2024-05-17. Anchor positioning as a whole is not Baseline only because of the `anchor-valid` and `anchor-visible` values of `position-visibility`, which only Safari 27 supports. Customizable `<select>` ships in Chrome 135 and Safari 27, but not in Firefox ([bug 1944403](https://bugzilla.mozilla.org/show_bug.cgi?id=1944403)).

Revisit when a needed feature becomes Baseline, when Zag's positioning cannot be left out, or when a moved element loses behavior its tests cover.

## References

- [web-features and Baseline](https://web-platform-dx.github.io/web-features/)
- [CSS anchor positioning](https://drafts.csswg.org/css-anchor-position-1/)
- [Customizable select elements](https://open-ui.org/components/customizableselect/)
- [Invoker commands](https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-command)

## Changes

- 2026-11-03: Accepted platform first and the current Baseline as the browser floor, after a survey of headless libraries found no better framework-independent fit than Zag.
