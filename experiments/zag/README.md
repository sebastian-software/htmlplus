# Zag compatibility probe

This private experiment checks whether Zag's official vanilla adapter can drive a form-associated custom element inside a shadow root. It is decision evidence for [ADR-0005](../../docs/adr/0005-headless-interaction-logic.md), not a production element, supported API, or replacement for html6's test suite. Its dependencies and generated bundle are separate from the library and static demo.

## Run

From the repository root, install the normal development dependencies and the two available test engines once, then install and run this experiment:

```sh
npm ci
npx playwright install chromium webkit
npm ci --prefix experiments/zag
npm run check --prefix experiments/zag
```

The experiment imports Playwright from the repository's development dependencies. It starts a temporary loopback server on an available port, runs Chromium and WebKit, prints a result for each, then closes the browsers and server. esbuild emits an ignored `probe.bundle.js` in this directory. Firefox is excluded here because it cannot launch on the current macOS host; this experiment is not included in the production CI workflow.

## What it checks

The fixture has two independent `probe-combobox` elements. Each contains a native editor and listbox in its own shadow root and passes that root to Zag. The custom-element host owns validity and submission through `ElementInternals`; there are no hidden form proxies.

The browser check exercises filtered keyboard selection, label-to-identifier serialization through actual `FormData`, required validity, Escape, outside-pointer dismissal, unique IDs, fieldset disabling/re-enabling, reset defaults, and disconnect/reconnect. It fails on browser page errors. The bundle size and default gzip size include the fixture and are printed for inspection; they are not a release size budget or an incremental cost for the complete library.

On 2026-10-23, both engines passed with `@zag-js/combobox` and `@zag-js/vanilla` 1.46.0. The minified production-mode fixture was 101,462 bytes; default gzip was 33,180 bytes.

## What it does not establish

The fixture deliberately exposes its machine to inspect the experiment. It does not define html6's public property/event/default contract or prove user-event semantics, external labels, native undo/IME, actual history restoration, browser-driven autofill, screen-reader behavior, touch behavior, or an unclipped production popup. In particular, it does not resolve whether editing a selected label should clear the previous identifier.

A different Zag machine may depend on native hidden controls for behavior. This result does not establish that Select, Slider, Rating, or Date Picker can use the same binding without further checks. The eight production controls and their runtime dependency graph are unchanged.
