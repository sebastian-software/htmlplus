# html6

Form controls that extend HTML's vocabulary and participate in ordinary web forms.

**Status:** planning. No components or package are implemented yet. The project name and `h6-` element prefix are working names.

The goal is a small collection of reusable Web Components with native form behavior, accessible interactions, a useful default appearance, and explicit CSS styling hooks. Applications should be able to submit their values through a regular form or `FormData` without a form library or hidden proxy inputs.

Two component families are in scope:

- **Composite controls:** tags, searchable selections, date ranges, and numeric intervals.
- **Specialized input fields:** IBAN, BIC/SWIFT code, and one-time verification codes, followed by other fields with meaningful formatting or validation needs.

Use native inputs where they already express the field's value. Use form-associated custom elements where a new control needs its own submission behavior. The implementation boundary is proposed in the ADRs and still needs browser evidence.

## Project documents

- [Project plan](docs/PLAN.md): scope, component candidates, first implementation slices, and open questions.
- [Living architecture decisions](docs/adr/README.md): current decisions and proposals, updated in place as the design develops.
- [Glossary](GLOSSARY.md): shared terminology, including BIC versus SWIFT code and OTP versus 2FA.
- [Project instructions](AGENTS.md): US English and the living ADR convention.

## First experiment

Build a small switch and a specialized text-input spike, then implement tags as the first composite control. Prove submission, validation, reset, focus, and styling in an ordinary HTML form before expanding the catalog. This sequence is a proposal, not a release commitment.
