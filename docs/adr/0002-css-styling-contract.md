# ADR-0002: Expose a deliberate CSS styling contract

- Status: proposed
- Created: 2026-10-22
- Updated: 2026-10-22
- Lifecycle: living

## Context and proposed decision

The controls should fit existing visual systems while remaining usable on first insertion. Propose a restrained default appearance, inheritable CSS custom properties, documented `::part(...)` hooks for shadow internals, and custom states where they express actual interaction state. Native light-DOM inputs remain directly styleable. Slots may expose meaningful content customization.

This gives consumers stable styling surfaces while allowing internal markup to evolve. A fully opaque theme API would restrict integration; treating all internal markup as public would make maintenance costly.

## Consequences and validation

- Part names, state names, and custom properties are public API once released. Keep the initial surface small and document which hooks each component actually supports.
- Do not apply `::part` to native light-DOM children or assume arbitrary descendants of a part are selectable from outside the shadow root.
- Build two substantially different themes using the same component behavior and public hooks. Preserve focus indication, contrast, and usable disabled and invalid states.
- Validate the public styling surface in the target browsers before accepting this proposal. Revisit when a consumer needs private DOM access to achieve a reasonable design.

## References

- [MDN: CSS shadow parts](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part)
- [MDN: custom state selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:state)

## Changes

- 2026-10-22: Proposed a platform CSS contract and a two-theme validation experiment. No final part or token names are established.
