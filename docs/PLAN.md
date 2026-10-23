# Project plan

Updated: 2026-10-23. Status: eight-control prototype and static Pages workflow available. Chromium and WebKit contract checks are in place; Firefox cannot launch on this macOS host. Physical-device autofill remains unverified.

## Intended outcome

Help developers use richer fields in ordinary HTML forms with little application glue. Controls should work with native form submission and `FormData`, expose clear validity and reset behavior, and fit different visual systems through CSS.

The project language is US English. Architecture rationale belongs in the [living ADRs](adr/README.md); terminology belongs in the [glossary](../GLOSSARY.md).

## Component candidates

Names are provisional. Being listed does not commit a component to the first release.

| Candidate | Main benefit | Proposed submitted value |
| --- | --- | --- |
| `h6-switch` | Small reference control for the complete form contract | Checkbox-like value when on; no entry when off |
| `h6-iban` | Country-aware format validation, check digits, paste cleanup, and readable presentation | Uppercase IBAN without whitespace |
| `h6-bic` | BIC/SWIFT entry with explicit structural validation | Uppercase BIC, retaining the entered 8- or 11-character form |
| `h6-otp` | Verification-code entry with paste, autofill hints, leading zeros, and optional visual segmentation | A string; configurable length and character policy |
| `h6-tags` | Add, edit, and remove multiple tokens | Repeated entries under the same field name |
| `h6-combobox` | Searchable selection with separate display label and identifier | The selected identifier |
| `h6-interval` | Two related numeric boundaries, optionally with a two-thumb slider | Two explicitly named numeric values |
| `h6-date-range` | Coordinated start and end dates with shared constraints | Two explicitly named date values |
| `h6-duration` | Flexible elapsed-time notation with a native editor | Whole, nonnegative seconds |
| `h6-segmented` | Compact choice with native radio keyboard behavior | The selected identifier |
| Money and unit fields | Domain-aware editing and normalization | An explicit, documented representation per field |

Later candidates include file collections and hierarchical selections. Rich-text editing needs a separate scope assessment because of its editing and content-processing obligations.

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
| 1. Contract playground | One ordinary form containing a switch and a native text-input enhancement. Demonstrate submission, reset, disabled fieldsets, labels, validation, and two different themes. Resolve the relevant ADR proposals with evidence. | Planning baseline |
| 2. Specialized fields | Implement IBAN, BIC, and OTP one at a time. Check formatting and invalid examples; manually verify mobile OTP entry and autofill before making support claims. | Slice 1; verified format sources for financial identifiers |
| 3. Tags | Complete add/remove/edit behavior, empty and duplicate policies, keyboard access, repeated form entries, validation, and reset. | Slice 1; a defined list-value API |
| 4. Combobox | Separate label from identifier with accessible selection and caller-supplied options. Reuse proven primitives only where behavior matches. | Shared form contract; combobox interaction design |
| 5. First release decision | Review actual integration effort and supported-browser evidence. Choose a small release set; defer fields that still require application workarounds. | Evidence from implemented slices |

The playground now contains eight controls and two CSS themes. Thirty checks pass across Chromium and WebKit, plus five validation unit tests. The static Pages export is tested under a repository subpath; the Actions workflow gates deployment on the full three-engine Linux matrix. The specialized editor mechanism changed after a native undo experiment; ADR-0003 records why. Text normalization uses a submitted value separate from the editor text. Tag editing in place and physical-device checks remain open.

These are learning checkpoints, not dated delivery promises. The switch is a bounded reference implementation; the specialized fields and tags demonstrate the project's broader value.

## Current expansion

Implemented duration, numeric interval, and segmented choice to test text normalization, related field names, and native radio semantics side by side. [ADR-0004](adr/0004-composite-value-contracts.md) records the public units and value shapes. The duration reuses the narrow text-field class. The two composite controls keep their native interactions in focused implementations; no runtime framework or universal component base is introduced.

Next, assess a searchable combobox and date range using the same ordinary-form contract. Preserve browser editing behavior and test real integration before introducing shared abstractions. Browser back/forward restoration, manual screen-reader coverage, and physical-device autofill remain separate evidence tasks.

## Current technical direction

Use strict TypeScript compiled to browser ES modules and native custom elements, with no runtime framework dependency. The npm project is private; a public package structure is not settled. Browser support initially targets current stable Chromium, Firefox, and Safari; exact minimum versions remain unverified.

Provide a restrained default appearance, inheritable CSS variables, and documented styling hooks. Native shadow editors expose an input part, and other shadow internals expose deliberate parts. Avoid one large base class until shared behavior has been demonstrated by multiple fields.

## Open decisions

- Final element prefix, package name, and registration strategy.
- Reassess the initial tag API: `.value` and `.defaultValue` arrays, with JSON declarative defaults; existing-tag editing remains pending.
- Verify the separate canonical submission mechanism on additional devices and password managers.
- No-JavaScript fallback and server-side rendering integration for all eight controls.
- Exact browser versions, manual assistive-technology coverage, and the first package's release set.

## Sources

- [HTML: form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-face-example)
- [Swift: IBAN and national-format registry](https://www.swift.com/standards/data-standards/iban-international-bank-account-number)
- [Swift: BIC structure](https://www.swift.com/standards/data-standards/bic-business-identifier-code)
- [web.dev: OTP input behavior](https://web.dev/articles/sms-otp-form)
- [WAI: combobox interaction pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
