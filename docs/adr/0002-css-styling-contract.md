# ADR-0002: Expose a deliberate CSS styling contract

- Status: accepted
- Scope: initial prototype
- Created: 2026-10-22
- Updated: 2026-10-23
- Lifecycle: living

## Context and decision

The controls should fit existing visual systems while remaining usable on first insertion. Use a restrained default appearance, inheritable CSS custom properties, documented `::part(...)` hooks for shadow internals, and custom states where they express actual interaction state. The specialized native editors expose `::part(input)`. The complete neutral base belongs inside the components, with shared internal CSS primitives for consistent typography, spacing, focus, and editor sizes. A consumer can insert an element without loading another stylesheet. Slots may expose meaningful content customization.

This gives consumers stable styling surfaces while allowing internal markup to evolve. A fully opaque theme API would restrict integration; treating all internal markup as public would make maintenance costly.

## Consequences and validation

- Part names, state names, and custom properties are public API once released. Keep the initial surface small and document which hooks each component actually supports.
- Do not apply `::part` to native light-DOM children or assume arbitrary descendants of a part are selectable from outside the shadow root.
- Build two substantially different themes using the same component behavior and public hooks. Preserve focus indication, contrast, and usable disabled and invalid states.
- The playground implements a neutral Base theme and a blue Utility theme with public parts and custom properties. The original violet Studio palette has been replaced, including component fallbacks. Desktop and mobile screenshots are reviewed. Firefox remains unverified on this host; complete that engine check before a release support claim. Revisit when a consumer needs private DOM access to achieve a reasonable design.
- A separate recipe gallery exercises every element with the same CSS it displays for copying. Its optional downloadable `base.css` maps semantic application tokens to `--h6-*` tokens, inspired by shadcn/ui without importing its implementation or adding dependencies. It contains no structural part rules; the Base preview demonstrates the built-in appearance without this adapter.
- Expose `selected-option` on the currently selected segmented option, alongside `option`. Consumers cannot select its private adjacent radio state through `::part(option):checked`. Internal part selectors use token matching when a node carries multiple part names.

## References

- [Playground design](../PLAYGROUND.md)
- [Demo styles](../../demo/styles.css)
- [Styling guide](../STYLING.md)

- [MDN: CSS shadow parts](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part)
- [MDN: custom state selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:state)

## Changes

- 2026-10-22: Proposed a platform CSS contract and a two-theme validation experiment. The prototype now exercises the styling surface through Studio and Utility themes; the surface can still change before publication.
- 2026-10-23: Replaced violet defaults with a neutral Base palette. Added copyable recipes for all eight elements, a shared semantic-token adapter, and the stateful segmented-option part.

- 2026-10-23: Moved the complete base into shadow styles, reduced the external CSS to a theme adapter, aligned type and editor metrics, and replaced font glyphs with centered SVG icons. Added the `remove-icon` part and checks without application CSS.

- 2026-10-23: Added built-in styles and Pill, Boxed, and Underline recipes for Toggle, Accordion, and Tabs; selected-tab and pressed state expose live styling hooks.
