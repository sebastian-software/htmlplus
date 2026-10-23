# Project plan

Updated: 2026-10-23. Status: fourteen implemented elements, three expansion candidates, and a static Pages workflow. Toggle, Accordion, Tabs, Slider, Range Slider, and Rating use Zag; their integrated Chromium/WebKit checks pass. Firefox cannot launch on this macOS host; physical-device autofill remains unverified.

## Intended outcome

Help developers use richer fields in ordinary HTML forms with little application glue. Controls should work with native form submission and `FormData`, expose clear validity and reset behavior, and fit different visual systems through CSS. Add companion interaction components where they help compose these forms, such as tabs and accordions; these do not become submitted fields merely by belonging to the library.

The project is named **html+**, with **htmlplus.dev** as its domain and `htmlplus` as its technical slug. [ADR-0006](adr/0006-project-identity.md) records the identity and the still-provisional element prefix. The project language is US English. Architecture rationale belongs in the [living ADRs](adr/README.md); terminology belongs in the [glossary](../GLOSSARY.md).

## Component catalog

Names are provisional. The first table describes the implemented prototype; the expansion table describes planned work, not available exports.

| Element | Main benefit | Submitted value |
| --- | --- | --- |
| `h6-switch` | Small reference control for the complete form contract | Checkbox-like value when on; no entry when off |
| `h6-iban` | Country-aware format validation, check digits, paste cleanup, and readable presentation | Uppercase IBAN without whitespace |
| `h6-bic` | BIC/SWIFT entry with explicit structural validation | Uppercase BIC, retaining the entered 8- or 11-character form |
| `h6-otp` | One native verification-code editor with paste, autofill hints, and preserved leading zeros | A string; configurable length and character policy |
| `h6-tags` | Add and remove multiple tokens; editing existing tokens remains open | Repeated entries under the same field name |
| `h6-interval` | Two related numeric boundaries entered through numeric editors | Two explicitly named numeric values |
| `h6-duration` | Flexible elapsed-time notation with a native editor | Whole, nonnegative seconds |
| `h6-segmented` | Compact choice with native radio keyboard behavior | The selected identifier |
| `h6-toggle` | Persistent pressed button using Zag and native form association | Named string while pressed; no entry otherwise |
| `h6-accordion` | Zag disclosure sections containing ordinary form fields | No host entry; contained fields retain their entries |
| `h6-tabs` | Zag keyboard navigation between panels containing ordinary form fields | No host entry; inactive panels retain their field entries |
| `h6-slider` | Zag pointer/keyboard control for one bounded number | One numeric string |
| `h6-range-slider` | Two stable Zag thumbs for a bounded interval | Two entries, defaulting to `name.min` and `name.max` |
| `h6-rating` | Clearable whole score with a separate hover preview | One numeric string; no entry while unanswered |

### Requested expansion

The three candidates below remain planned. Toggle, Accordion, Tabs, Slider, Range Slider, and Rating are implemented; their current contracts are in the [interaction guide](INTERACTIONS.md) and [numeric choice guide](NUMERIC-CHOICES.md). The remaining candidates' value contracts are proposals until implementation evidence resolves them. Zag has a machine for every requested interaction; the range slider uses the same `@zag-js/slider` package as the single slider. [ADR-0005](adr/0005-headless-interaction-logic.md) records the accepted integration and the earlier compatibility probe.

| Candidate | First useful scope | Proposed form contribution | Foundation to assess |
| --- | --- | --- | --- |
| `h6-select` | A single selection, caller-supplied labels and identifiers, disabled options | Selected identifier; no entry without a selection | Native select, including current customization capabilities, compared with Zag select |
| `h6-combobox` | Searchable single selection with separate query, label, and identifier | Selected identifier; search text alone is not a selection | Zag combobox; isolated shadow/FACE probe complete |
| `h6-date-picker` | One calendar date with editable text, calendar popup, locale, and bounds | Date-only `YYYY-MM-DD`; no time-zone conversion | Native date input compared with Zag date-picker and its date model |

Later candidates include `h6-date-range`, money and unit fields, file collections, and hierarchical selections. Rich-text editing needs a separate scope assessment because of its editing and content-processing obligations.

### Boundaries and scenarios to resolve

- **Toggle and switch:** the toggle is a pressed button, such as a persistent filter or formatting choice. The switch represents an on/off setting. Keep their accessible roles distinct even if their submission rules match. A toggle inside a form must not submit it when clicked.
- **Tabs and accordion:** opening a section does not disable, reset, or omit its fields. Hiding a panel alone does not remove fields from a form. Prove how validation reveals and focuses an invalid field inside a closed section or inactive panel; keep a separate test for values in inactive panels. Do not serialize the selected tab or expanded section IDs by default.
- **Single and range sliders:** a single slider has one current number, like a native range input. The range slider requires two finite ordered boundaries, unlike the existing interval editor's optional open ends. Reuse its explicit boundary naming, not its nullable-value behavior. Define collision behavior without silently swapping thumb identities. Test keyboard steps, bounds, RTL, touch, and separate accessible names for both thumbs.
- **Rating:** distinguish an unanswered rating from a chosen value. Hover is a preview, not a committed form value. Support clearing and a required unanswered state. Half steps are a later option, even though Zag supports them; agree on their keyboard and value semantics before exposing them.
- **Select and combobox:** begin with single selection and direct options, following the segmented choice's label/identifier distinction. For a combobox, resolve what happens to a previous selection when its display text is edited; stale identifiers must not silently submit for a different query. Test IME, paste, native undo, unknown values, no results, disabled options, and dynamic option changes. Remote fetching and virtualization are separate application integrations.
- **Date picker:** start with Gregorian calendar dates, independently of JavaScript timestamps. Display and parsing follow an explicit locale policy; the submitted value stays date-only. Check typed invalid/incomplete dates, leap days, min/max, clearing, keyboard calendar navigation, and text editing before adding date ranges or time selection.

Every new element needs the built-in neutral base, deliberate CSS parts/tokens/states, and its own working Base and styled examples. New fields also belong in the live FormData playground. Companion components should demonstrate that their contained fields still submit correctly. No candidate is complete on keyboard logic alone.

## Specialized input fields

### IBAN

- Accept pasted whitespace and lowercase letters; normalize deliberately without silently deleting arbitrary invalid characters.
- Validate country-specific length and structure against a versioned national-format source, plus the IBAN check digits.
- Distinguish incomplete input, invalid format, and application-supplied errors.
- Preserve the native editor's text. Derive the canonical submitted value separately through ElementInternals so normalization does not rewrite native edit history. See ADR-0003.
- A successful local check says nothing about account existence, ownership, or payment reachability. The application owns those checks.
- Review the registry's licensing and update process before bundling national-format data.

### BIC / SWIFT code

- Use BIC in identifiers and documentation; allow "BIC / SWIFT code" as a user-facing label.
- Support the standard 8-character identifier and optional 3-character branch identifier. Validate against the chosen standard's character rules rather than a guessed banking-only regex.
- Normalize case and whitespace without silently adding or removing a branch identifier.
- Keep directory lookup and recipient verification outside the field. Whether a form requires BIC is an application decision.

### One-time verification code

- Start with one real text input, preserving leading zeros and normal selection, undo, paste, and keyboard behavior.
- Use `autocomplete="one-time-code"`; use `inputmode="numeric"` for numeric codes. Do not use `type="number"`.
- Treat length and allowed characters as configuration; six numeric characters can be a demo profile rather than a universal rule.
- Optional segmented visuals must preserve one logical input and accessible label.
- Do not submit the form automatically when the field becomes complete. Code generation, delivery, expiry, verification, and retry limits belong to the application.
- The shadow editor has native autofill hints; check autofill on actual supported mobile browsers and password managers. WebOTP can be a later, separate opt-in integration.

## Shared behavior to prove

- A regular form submission and `new FormData(form)` contain the expected entries exactly once.
- Value properties, initial defaults, attribute changes, and programmatic updates have documented behavior. Programmatic assignment does not invent user input events.
- Applicable `name`, `form`, `disabled`, `required`, and `readonly` behavior is consistent with the underlying control. A disabled fieldset is covered.
- Reset restores declared defaults. History restoration is evaluated separately; universal autofill is not assumed from form association.
- Labels activate the actual editable control. Focus, keyboard operation, accessible names, and errors work without a pointer.
- Native validity participates in submission blocking. Applications can add and clear server-originated errors.
- User edits emit appropriate `input` and `change` events without duplicate notifications across component boundaries.
- No hidden proxy input is required. An enhanced native input and its host never both submit the same logical value.

## Implementation checkpoints

| Slice | Outcome and completion criterion | Dependency |
| --- | --- | --- |
| Baseline: available | Twelve form controls and two companion elements, live FormData, reset/validation/fieldset checks, and two styling examples per element. Existing-tag editing and device/assistive-technology checks remain open. | ADR-0001 through ADR-0004 |
| 0. Foundation: complete for this slice | Use Zag 1.46.0 through its official vanilla adapter with native hosts and bundled browser modules. Popup-machine assumptions remain separate work. | ADR-0005 |
| 1. Companion interactions: implemented | Toggle, Accordion, and Tabs have neutral bases, individual recipes, and live-form examples. Browser checks cover keys, fields in inactive panels, nested validation, native undo, and lifecycle. | [Interaction guide](INTERACTIONS.md) |
| 2. Numeric choices: implemented | Slider, Range Slider, and Rating have stable value/event contracts, built-in styles, recipes, and live form values. | [Numeric choice guide](NUMERIC-CHOICES.md); pointer, touch emulation, keyboard, RTL, and lifecycle checks |
| 3. Popup selections | Implement select and combobox with caller-supplied options, identifier submission, reliable editing, focus/dismissal, and reset. | Production-ready DOM binding and popup strategy |
| 4. Calendar date | Implement a single date picker with explicit date-only serialization and locale-aware editing/calendar behavior. Date range follows separately. | Popup selection evidence; parsing and date model |
| 5. First release decision | Review actual integration effort, build output, and supported-browser evidence. Choose the release set and publish only supported behavior. | Evidence from implemented slices |

The playground now contains fourteen elements, two appearances, and six palettes. Ninety-four checks pass across Chromium and WebKit, plus five validation unit tests. The static Pages export is tested under a repository subpath; the Actions workflow gates deployment on the full three-engine Linux matrix. The specialized editor mechanism changed after a native undo experiment; ADR-0003 records why. Text normalization uses a submitted value separate from the editor text. Tag editing in place and physical-device checks remain open.

These are learning checkpoints, not dated delivery promises. The switch is a bounded reference implementation; the specialized fields and tags demonstrate the project's broader value.

## Current expansion

Implemented duration, numeric interval, and segmented choice to test text normalization, related field names, and native radio semantics side by side. [ADR-0004](adr/0004-composite-value-contracts.md) records the public units and value shapes. The duration reuses the narrow text-field class. The two composite controls keep their native interactions in focused implementations; no runtime framework or universal component base is introduced.

All fourteen elements now have a neutral Base preview and an individual styling variation with copyable CSS and HTML. The gallery uses built-in defaults and public part overrides. Common theming uses the accepted `--hp-` semantic contract, with Light/Dark presets and a separate shadcn adapter. Public parts remain available for individual recipes; shared shadow styles provide the complete base without application CSS. Tag text/icon alignment, native editor metrics, and root text scaling have explicit browser checks. Violet defaults have been removed from both the demo and component fallbacks. ADR-0002 and the [styling guide](STYLING.md) document the current surface.

Toggle, Accordion, and Tabs complete the first requested Zag slice. Slider, Range Slider, and Rating complete the numeric slice. The next expansion covers the three remaining elements above. Keep the earlier eight field implementations until a concrete benefit justifies changing one. Browser back/forward restoration, manual screen-reader coverage, and physical-device autofill remain separate evidence tasks.

## Current technical direction

Use native custom elements and strict TypeScript, with Zag 1.46.0 as an internal behavior dependency for Toggle, Accordion, Tabs, Slider, Range Slider, and Rating. No runtime component framework is required. The build emits declarations and uses esbuild for split browser ES modules, including individual element entries. The static exporter copies their shared chunks; the source dev command watches both types and bundles. The npm project is private; a public package structure is not settled. Browser support initially targets current stable Chromium, Firefox, and Safari; exact minimum versions remain unverified.

Provide a restrained default appearance, inheritable `--hp-*` semantic CSS variables, optional Light/Dark presets and shadcn adapter, and documented styling hooks. Native shadow editors expose an input part, and other shadow internals expose deliberate parts. Avoid one large base class until shared behavior has been demonstrated by multiple fields.

## Open decisions

- Final element prefix, public package publication/namespacing, and registration strategy. The private package uses `htmlplus`; registry availability and publication are not implied.
- Reassess the initial tag API: `.value` and `.defaultValue` arrays, with JSON declarative defaults; existing-tag editing remains pending.
- Verify the separate canonical submission mechanism on additional devices and password managers.
- No-JavaScript fallback for form controls and server-side rendering integration. Accordion/Tabs retain their original content before enhancement.
- Exact browser versions, manual assistive-technology coverage, and the first package's release set.
- Popup placement within the shadow root and each future Zag machine's editing/hidden-control assumptions; see ADR-0005. The implemented machines do not require proxy inputs.

## Sources

- [HTML: form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-face-example)
- [Swift: IBAN and national-format registry](https://www.swift.com/standards/data-standards/iban-international-bank-account-number)
- [Swift: BIC structure](https://www.swift.com/standards/data-standards/bic-business-identifier-code)
- [web.dev: OTP input behavior](https://web.dev/articles/sms-otp-form)
- [WAI: combobox interaction pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Zag: framework adapters, including vanilla JavaScript](https://zagjs.com/guides/framework-adapters)
- [Zag: component catalog](https://zagjs.com/overview/introduction)
- [Zag: range slider](https://zagjs.com/components/range-slider)
- [Zag: rating group](https://zagjs.com/components/rating-group)
- [HTML: disclosure elements](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element)
- [HTML: native form controls](https://html.spec.whatwg.org/multipage/input.html)
- [WAI: toggle buttons](https://www.w3.org/WAI/ARIA/apg/patterns/button/)

The palette picker adds official Blue, Green, Orange, and Rose overlays beside Neutral and custom Utility, independently of Light/Dark. Their source revision and MIT attribution are recorded; no popularity ranking is claimed.
