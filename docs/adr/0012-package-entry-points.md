# ADR-0012: Register elements through one import per element

- Status: accepted
- Created: 2026-11-02
- Updated: 2026-11-02
- Lifecycle: living
- Scope: package structure and framework integration; the final package name and element prefix stay open under ADR-0006

## Context

The first build bundled everything into `dist/` with shared chunks, and only one module registered elements. A bundler could not share dependencies with the application, a page paid about 120 KB gzipped for all elements unless it registered classes by hand, and importing any module on a server threw because the modules use the DOM when they load.

## Decision

Use the conventional custom-element pattern, per element. `htmlplus/<name>` registers that element and re-exports its class, and `htmlplus` does the same for all of them. Importing is the whole integration.

Ship two builds from one source: separate ES modules in `lib/` with dependencies external, so bundlers can tree-shake and share them; and bundled modules with chunks in `browser/` for pages without a bundler. `sideEffects` names only the registering entries, so a bare import survives tree shaking and unused internals don't.

Outside browsers, export conditions resolve entries to an empty module. This is simpler than making every module safe to evaluate without a DOM, and server rendering only needs the import not to throw.

Target React 19 with JSX types and no wrapper components. React 19 passes props and events to custom elements natively, and a wrapper layer would be a second API to maintain. Earlier React versions are out of scope.

A framework writes back the value a person just produced. So while an editor has focus, assigning the value it already holds leaves its text alone. Without this rule, a controlled field would replace `1h` with `3600` mid-edit, move the caret, and erase drafts such as `3.` or an incomplete date. This narrows the programmatic-assignment rule in ADR-0003: assigning a different value, or any value while the editor isn't focused, still replaces the text.

## Alternatives

- **A separate entry with classes only and no registration.** It would serve custom tag names and scoped registries, which nothing here needs yet. Element entries already export their class, so add this only when someone needs a tag name other than the default.
- **Bundling dependencies into the package.** Simple to publish, but an application using Zag would ship it twice, and tree shaking stops at the bundle.
- **Wrapper components for React.** Needed only for React 18 and earlier.

## Consequences

- Each element costs only its own code; [element sizes](../SIZES.md) tracks this and enforces limits.
- Import-time side effects are the contract, so a file that registers an element must stay listed in `sideEffects`.
- Importing a class by value on a server fails, because the empty module has no exports. Use `import type`, or a dynamic import in browser-only code.
- React doesn't assign props to custom elements during hydration, so arrays need a ref callback there. [Forms and validation](../FORMS.md#server-rendering) has the pattern.
- Select and Combobox share one class and therefore both Zag machines. Separating them is the obvious next size reduction.

## Evidence and review triggers

`scripts/check-consumer.mjs` packs the real tarball, installs it into a Vite and React 19 app, type-checks it, imports every entry in Node, and prerenders the app. `test/react.spec.mjs` checks hydration, `onInput` and `onChange` counts, controlled round trips, arrays, reset, and unmounting in Chromium, Firefox, and WebKit. Revisit when another framework needs support, when a real need for custom tag names appears, or when scoped registries are broadly available.

## Changes

- 2026-11-02: Accepted one registering import per element, two builds, empty server entries, and React 19 without wrappers.
