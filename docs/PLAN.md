# Project plan

Updated: 2026-11-02.

This file holds status, open decisions, and next steps. Rationale belongs in the [living ADRs](adr/README.md), element behavior in the guides, terminology in the [glossary](../GLOSSARY.md), and user-visible changes in the [changelog](../CHANGELOG.md). Git keeps the earlier delivery notes.

## Status

html+ is a prototype with twenty-four elements, a native Button family, a live playground and styling gallery, and a project site deployed to GitHub Pages. The [element table](../README.md#elements) lists the catalog. No package is published, and CI gates deployment on Chromium, Firefox, and WebKit.

## Next steps

In order; each step can change the ones after it.

1. **Close the evidence gaps that a release claim depends on.** Check physical-device OTP and password-manager autofill, the separate canonical submission mechanism on those devices, manual assistive-technology combinations, real browser back/forward restoration, and exact minimum browser versions.
2. **Decide the prefix and package name.** See the open decisions below. Both are breaking changes for anyone already using the elements, so settle them before a release.
3. **Make the first release decision.** Review actual integration effort, build output, and supported-browser evidence. Choose the release set and publish only supported behavior.
4. **Add tag editing in place.** Tags currently add and remove only. Reassess the tag API (`.value` and `.defaultValue` arrays, JSON declarative defaults) at the same time.
5. **Extend IBAN coverage to the full registry.** The ten hand-authored profiles reject every other country. Review the registry's licensing and update process before bundling national-format data, and plan for its ongoing data management.
6. **Add message-framework integration.** Interface labels and validation messages are English. Palamedes is the named candidate; components already accept its language through `lang` or `locale`, but no adapter exists. See [ADR-0011](adr/0011-functional-locale-context.md).
7. **Assess larger form components in separate slices:** [file picker and dropzone (#2)](https://github.com/sebastian-software/htmlplus/issues/2), [color picker (#3)](https://github.com/sebastian-software/htmlplus/issues/3), and [hierarchical selection with a Tree View (#4)](https://github.com/sebastian-software/htmlplus/issues/4).

## Open decisions

- **Element prefix.** `h6-` is provisional; [ADR-0006](adr/0006-project-identity.md) keeps the final prefix open.
- **Package name and namespace.** `htmlplus` is a private local identifier, and that name on npm belongs to an unrelated third-party package. A public name, scope, and registration strategy are undecided.
- **Domain.** `htmlplus.dev` is reserved and not live yet. Pointing it at Pages is separate DNS and hosting work.
- **Release set and browser floor.** Which elements the first package contains, and the minimum versions it claims.
- **No-JavaScript and server rendering.** Whether form controls get a fallback or Declarative Shadow DOM output.
- **Date scope.** Time selection, unavailable-day APIs, alternate calendars, and localized action labels. [ADR-0009](adr/0009-calendar-date-picker.md) and [ADR-0010](adr/0010-calendar-date-ranges.md) define the current boundary.
- **Half-score ratings.** Zag supports them, but keyboard and value semantics need agreement first.

## Later candidates

- Money and unit fields.
- WebOTP, as a separate opt-in integration.
- Rich-text editing, which needs its own scope assessment because of its editing and content-processing obligations.
