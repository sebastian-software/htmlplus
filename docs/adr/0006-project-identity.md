# ADR-0006: Name the project html+

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-11-04
- Lifecycle: living

## Context and decision

The project owner selected **html+** as the project name and reserved **htmlplus.dev** as its domain, which is not live yet. Use the lowercase name with a literal plus sign in documentation, demo copy, page titles, descriptions, and the wordmark. Spell it "html plus" where an accessible name benefits from explicit pronunciation.

Use `htmlplus` where a machine-friendly identifier is needed, including the private npm package name, file downloads, and the repository-subpath demo route. Custom elements use the `hplus-` prefix, as in `hplus-select`, and their classes use `HPlus`, as in `HPlusSelect`. The prefix is short enough for markup and keeps the project's name recognizable; the plus sign cannot appear in a custom-element name. The intended primary web address is `https://htmlplus.dev/`. The plus sign is part of the displayed name; it is not used in npm package names or custom-element names.

## Consequences

- Update the prototype's identity consistently while preserving the native form and CSS contracts. Public CSS tokens keep the accepted `--hp-` prefix; [ADR-0002](0002-css-styling-contract.md) owns that contract.
- The rename from `h6-` is a breaking change with no aliases. Nothing is published, so no compatibility layer is needed.
- `htmlplus` is currently a private local package identifier. On npm, the unscoped names `htmlplus` and `hplus` both belong to unrelated third-party packages. The project owner holds the npm organization `hplus`, so public packages can use the `@hplus/` scope, which matches the element prefix. The package names inside that scope, such as one combined package or one package per element, are undecided.
- The static export uses relative asset URLs, with the project site at its root and the playground under `/demo/`. `/htmlplus/` is the local repository-subpath compatibility fixture; custom-domain hosting can serve the same artifact at `/`.
- Domain DNS and hosting configuration require separate deployment work. Recording the domain does not establish that a site is deployed there.
- Repository work continues in US English.

## References

- [README](../../README.md)
- [Project plan](../PLAN.md)
- [Playground design](../PLAYGROUND.md)

## Changes

- 2026-10-23: Accepted html+ and htmlplus.dev as the project identity, replacing the html6 working name. Applied the name to the demo and documentation and used htmlplus for technical slugs.

- 2026-10-23: Accepted `--hp-` for CSS tokens while retaining the provisional `h6-` element names and class exports.

- 2026-11-02: Recorded that htmlplus.dev is reserved and not live, that the npm name belongs to a third party, and the export layout with the project site at its root.

- 2026-11-03: Accepted `hplus-` as the element prefix and `HPlus` for class names, replacing the provisional `h6-` and `H6`. Recorded that `hplus` on npm also belongs to a third party.

- 2026-11-04: Recorded that the project owner holds the npm organization `hplus`, which makes `@hplus/` the available package scope. The package names inside it remain open.
