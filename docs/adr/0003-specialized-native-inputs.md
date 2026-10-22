# ADR-0003: Preserve native editing in specialized text fields

- Status: proposed
- Created: 2026-10-22
- Updated: 2026-10-22
- Lifecycle: living

## Context and proposed decision

IBAN, BIC, and OTP are specialized text fields. Their additional value comes from entry assistance, normalization, and domain-specific format checks. Replacing native editing would add obligations around selection, undo, paste, autofill, mobile keyboards, and assistive technology.

Propose enhancing an author-supplied native text input in the light DOM for these fields. It remains the form's sole submission owner. Use form-associated hosts for controls that genuinely need an independent value model, such as tags and intervals. Do not require one shadow-DOM or form-association strategy across the catalog.

The first IBAN and BIC spike keeps the native input value canonical; visually grouped editing is a separate experiment. OTP retains one logical text input even if its presentation resembles individual character cells. A code is a string, including leading zeros. The application controls submission and verification.

## Consequences and validation

- This permits ordinary native-input fallback before component upgrade. Authoring markup is more explicit than a self-contained empty custom tag.
- The component must preserve the input's native label, constraints, events, and form ownership, including ownership inherited from a surrounding form.
- Format validation is separate from verification. A checksum or structural match does not establish account ownership, BIC registration, or code correctness. No implicit network lookup is part of the field.
- Pin the financial-format data source and review its update and licensing requirements. Do not describe a BIC field as a generic routing-number field.
- Verify native versus enhanced OTP entry on supported mobile browsers and password managers. Historical Safari shadow-input autofill bugs are marked fixed; they justify testing, not a claim that current Safari lacks shadow-input autofill.
- Revisit if native-input ownership cannot provide canonical submission and accessible formatting together. Any alternative must still produce one value and preserve reliable editing.

## Proposed authoring example

This is a design sketch, not an implemented component API. The contained input already supports ordinary form submission without enhancement.

```html
<label for="verification-code">Verification code</label>
<h6-otp>
  <input id="verification-code" name="code" type="text"
    inputmode="numeric" autocomplete="one-time-code"
    pattern="[0-9]{6}" maxlength="6" required>
</h6-otp>
```

## References

- [Swift: IBAN](https://www.swift.com/standards/data-standards/iban-international-bank-account-number)
- [Swift: BIC](https://www.swift.com/standards/data-standards/bic-business-identifier-code)
- [web.dev: OTP text inputs, numeric input mode, and autocomplete](https://web.dev/articles/sms-otp-form)
- [WebKit: resolved shadow-input autofill issue](https://bugs.webkit.org/show_bug.cgi?id=172567)
- [Glossary](../../GLOSSARY.md)

## Changes

- 2026-10-22: Added IBAN, BIC/SWIFT, and OTP as specialized fields and proposed preserving native text editing. Mobile behavior and formatted editing remain unverified.
