# ADR-0003: Preserve native editing while separating submitted values

- Status: accepted
- Created: 2026-10-22
- Updated: 2026-10-29
- Lifecycle: living
- Scope: initial prototype

## Context and decision

IBAN, BIC, OTP, and duration are text fields with domain-specific normalization. The first spike enhanced a light-DOM input and rewrote its value after each input event. A manual undo check showed that transformed characters could no longer be undone. Keeping a native input alone does not preserve native editing if the component repeatedly replaces its text.

Keep one native input in the component's shadow root, and make the custom host the form-associated submission owner. Retain the browser's text-editing history. Derive the canonical value and supply it through `ElementInternals.setFormValue(canonical, displayText)`. IBAN now displays uppercase groups of four while the form receives the identifier without spaces; duration retains its typed notation.

Constraints, defaults, disabled state, labels, and canonical `.value` live on the host. The raw `.displayValue` is readable separately. Programmatic `.value` assignment may replace the editor's text, as native programmatic assignment does. User formatting must use native editing operations rather than assigning the value or implementing a parallel undo stack. Native editor events update form values without a second application state object.

Inactive Tabs and Accordion sections must also preserve native editor layout boxes. Firefox discards undo history when `display: none` destroys those boxes, even if the DOM nodes and values are retained. Collapse inactive wrappers to zero block size with clipping and hidden visibility, and mark them inert. They occupy no visible space and expose no interactive descendants, while form values and constraints remain associated. Invalid-event handlers flush the revealed wrapper's layout before returning, so WebKit can focus the original validation anchor after inertness is removed. This costs retained layout work for inactive content; virtualization or `display: none` would weaken the editing contract. See [Firefox bug 2017065](https://bugzilla.mozilla.org/show_bug.cgi?id=2017065).

## Formatted field decision, 2026-10-29

IBAN grouping and single-input OTP slots are now part of the presentation contract. OTP cells are decorative, with native text spacing and selection-driven focus/caret marks; they never become six separate inputs. The native input retains pointer and keyboard selection, clipboard behavior, labels, and one-time-code hints. Length and public parts/tokens control the visual shape.

For IBAN grouping and whitespace cleanup, replace only the changed text range through the browser's `execCommand("insertText")` editing operation. This retains native undo where direct value assignment did not. The API is deprecated; this is a deliberate compatibility tradeoff, with guarded reentrancy and cross-engine checks. Unsupported or failed commands keep ordinary native editing, canonical serialization, and validation; do not fall back to losing undo. Composition is not rewritten while active, and history operations are not reformatted immediately. The [formatted fields guide](../FORMATTED-FIELDS.md) owns exact APIs and evidence limits.

## Consequences

- Native selection, paste, and undo stay with one real text input. OTP is a string, including leading zeros. A browser test protects restoration of the original text after normalized edits without assuming identical undo grouping across engines.
- The shadow editor does not independently submit. The host participates in validation and form submission; no hidden input or duplicate submission owner is needed.
- The original light-DOM authoring sketch and its no-JavaScript input fallback are superseded within this living record. A no-JavaScript fallback is deferred explicitly.
- Associate visible labels with the host and delegate focus into the editor. The editor receives its accessible name from those labels. Expose its styling through `::part(input)`.
- Format validation stays separate from verification. No implicit account lookup, BIC directory lookup, OTP delivery, expiry, or verification service is included.
- This settles the prototype mechanism, not universal autofill support. Physical mobile browsers and password managers still need direct verification before a compatibility claim.

## Review triggers and evidence

Check label activation, defaults, reset, fieldset disabling, canonical submission, custom errors, and undo in the integrated browser suite. Revisit the shadow boundary if actual target-device autofill fails or a reliable native-ownership approach can preserve canonical submission and undo together.

Direct macOS Firefox automation still fails before page load. A version-matched Linux container now provides Firefox verification; the plan records the complete-suite evidence. Historical Safari shadow-input autofill bugs are marked fixed and do not establish a current Safari defect.

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

- 2026-10-26: Preserved native undo across inactive Tabs/Accordion sections using zero-size clipped wrappers and inert semantics, after Linux Firefox exposed editor reconstruction under display:none.

- 2026-10-29: Added visible IBAN grouping and decorative OTP slots over one native input. Replaced the blanket no-formatting rule with targeted native edits, retaining undo and an explicit unsupported-command fallback.
