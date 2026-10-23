# ADR-0006: Name the project html+

- Status: accepted
- Created: 2026-10-23
- Updated: 2026-10-23
- Lifecycle: living

## Context and decision

The project owner selected **html+** as the project name and secured **htmlplus.dev** as its domain. Use the lowercase name with a literal plus sign in documentation, demo copy, page titles, descriptions, and the wordmark. Spell it "html plus" where an accessible name benefits from explicit pronunciation.

Use `htmlplus` where a machine-friendly identifier is needed, including the private npm package name, file downloads, and the repository-subpath demo route. The intended primary web address is `https://htmlplus.dev/`. The plus sign is part of the displayed name; it is not used in npm package names or custom-element names.

## Consequences

- Update the prototype's identity consistently while preserving the native form and CSS contracts. The existing `h6-` element names and exported classes remain provisional. Public CSS tokens use the accepted `--hp-` prefix; [ADR-0002](0002-css-styling-contract.md) owns that contract. The final element prefix remains a separate API decision.
- `htmlplus` is currently a private local package identifier. This decision does not establish registry availability, a public package scope, or a GitHub repository name.
- The static demo uses relative asset URLs. `/htmlplus/` is the local repository-subpath compatibility fixture; custom-domain hosting can serve the same artifact at `/`.
- Domain DNS and hosting configuration require separate deployment work. Recording the domain does not establish that a site is deployed there.
- Repository work continues in US English.

## References

- [README](../../README.md)
- [Project plan](../PLAN.md)
- [Playground design](../PLAYGROUND.md)

## Changes

- 2026-10-23: Accepted html+ and htmlplus.dev as the project identity, replacing the html6 working name. Applied the name to the demo and documentation and used htmlplus for technical slugs.

- 2026-10-23: Accepted `--hp-` for CSS tokens while retaining the provisional `h6-` element names and class exports.
