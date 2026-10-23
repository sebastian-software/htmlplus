# html6

Terminology for form controls, their values, and specialized input fields.

## Language

**Canonical value:** The normalized representation of a field's value that an application receives, independent of visual grouping or presentation.

**Display value:** The representation a person sees while reading or editing a field, which may include formatting absent from the canonical value.

**Composite control:** A single field interaction that manages a collection of values or several related values, such as tags or the boundaries of a date range.

**Duration:** An amount of elapsed time, independent of a start date or time zone.

**Interval:** A lower and an upper boundary describing a numeric range. An open-ended interval omits one or both boundaries.

**Segmented choice:** A single selection from a small set of visible, mutually exclusive options.

**Specialized input field:** A field for a particular kind of information whose entry, formatting, or validation benefits from domain-specific behavior.

**IBAN:** International Bank Account Number, an account identifier with a country-specific structure and check digits.

**BIC:** Business Identifier Code, an identifier under ISO 9362. "SWIFT code" is a familiar interface label for the BIC field; BIC is the canonical project term.
_Avoid_: SWIFT number, routing number

**OTP:** One-time password or verification code supplied to an application for verification. A code alone does not establish that an authentication flow uses two factors.
_Avoid_: 2FA code as the generic component name

**Format validation:** Checking whether an entered value satisfies the field's declared structural rules, including a checksum where applicable.

**Verification:** Establishing an application-level fact, such as whether a code is correct and unexpired or an account belongs to the intended recipient. Passing format validation does not establish verification.
