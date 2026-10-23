# ADR-0003: Preserve native editing while separating submitted values

- Status: accepted
- Created: 2026-10-22
- Updated: 2026-10-23
- Lifecycle: living
- Scope: initial prototype

## Context and decision

IBAN, BIC, OTP, and duration are text fields with domain-specific normalization. The first spike enhanced a light-DOM input and rewrote its value after each input event. A manual undo check showed that transformed characters could no longer be undone. Keeping a native input alone does not preserve native editing if the component repeatedly replaces its text.

Keep one native input in the component's shadow root, and make the custom host the form-associated submission owner. Let the editor retain exactly the text being edited. Derive the canonical value and supply it through `ElementInternals.setFormValue(canonical, displayText)`. For example, a lowercase, spaced IBAN can remain visible while the form receives uppercase text without whitespace.

Constraints, defaults, disabled state, labels, and canonical `.value` live on the host. The raw `.displayValue` is readable separately. Programmatic `.value` assignment may replace the editor's text, as native programmatic assignment does; user input processing does not. Native editor events update form values without a second application state object.

## Consequences

- Native selection, paste, and undo stay with one real text input. OTP is a string, including leading zeros. A browser test protects restoration of the original text after normalized edits without assuming identical undo grouping across engines.
- The shadow editor does not independently submit. The host participates in validation and form submission; no hidden input or duplicate submission owner is needed.
- The original light-DOM authoring sketch and its no-JavaScript input fallback are superseded within this living record. A no-JavaScript fallback is deferred explicitly.
- Associate visible labels with the host and delegate focus into the editor. The editor receives its accessible name from those labels. Expose its styling through `::part(input)`.
- Format validation stays separate from verification. No implicit account lookup, BIC directory lookup, OTP delivery, expiry, or verification service is included.
- This settles the prototype mechanism, not universal autofill support. Physical mobile browsers and password managers still need direct verification before a compatibility claim.

## Review triggers and evidence

Check label activation, defaults, reset, fieldset disabling, canonical submission, custom errors, and undo in the integrated browser suite. Revisit the shadow boundary if actual target-device autofill fails or a reliable native-ownership approach can preserve canonical submission and undo together.

The initial host's Firefox automation fails before page load; that engine is unverified. Historical Safari shadow-input autofill bugs are marked fixed and do not establish a current Safari defect.

## References

- [Text-field implementation](../../src/text-fields.ts)
- [Browser contract tests](../../test/playground.spec.mjs)
- [Swift: IBAN](https://www.swift.com/standards/data-standards/iban-international-bank-account-number)
- [Swift: BIC](https://www.swift.com/standards/data-standards/bic-business-identifier-code)
- [web.dev: native OTP input behavior](https://web.dev/articles/sms-otp-form)
- [WebKit: resolved shadow-input autofill issue](https://bugs.webkit.org/show_bug.cgi?id=172567)

## Changes

- 2026-10-22: Initially proposed enhancing a native light-DOM input as its own submission owner.
- 2026-10-22: The typing spike exposed lost undo history during normalization. Changed to a native shadow editor with canonical values submitted by the host; deferred the no-JavaScript fallback.

- 2026-10-23: Reused the same native editor for duration notation with canonical whole seconds. User input still leaves the editor text untouched.
