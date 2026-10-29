# Living architecture decisions

ADRs are the current, revisable account of the project's architecture. A record may change after acceptance. Reading its current file should be enough to understand the current direction.

Keep stable, sequential filenames in this directory. Each record has a status, creation date, last-updated date, rationale, consequences, and a short dated change note. Use `proposed`, `accepted`, `rejected`, or `deprecated`. A proposal does not imply implementation or an agreed final API.

When a decision changes, edit the same record, update its date and change notes, and reconcile this index and the project plan. Create another record for a genuinely separate decision. Keep earlier rationale in concise change notes; version control can retain complete earlier text once the project is tracked. This favors easy access to the current decision over an immutable in-document audit trail.

| Record | Status | Subject |
| --- | --- | --- |
| [0001](0001-native-form-contract.md) | accepted | Ordinary HTML forms and native submission ownership, including presentation-only companions |
| [0002](0002-css-styling-contract.md) | accepted | Semantic --hp- themes, shared surface depth, shadcn adapter, shadow parts, and opt-in native-field styling |
| [0003](0003-specialized-native-inputs.md) | accepted | Separate canonical submission, preserve native edit history, and format IBAN/OTP presentation |
| [0004](0004-composite-value-contracts.md) | accepted | Explicit units, boundary names, and selection identifiers |
| [0005](0005-headless-interaction-logic.md) | accepted | Zag for fifteen interactions behind native custom elements |
| [0006](0006-project-identity.md) | accepted | html+ is the project name; htmlplus.dev is its domain |
| [0007](0007-component-application-boundary.md) | accepted | Reusable component behavior; application-owned data, business decisions, and workflows |
| [0008](0008-selection-popups.md) | accepted | Zag single selection and shadow-local top-layer popups |
| [0009](0009-calendar-date-picker.md) | accepted | Gregorian date-only values, native editing, and Zag calendar navigation |
| [0010](0010-calendar-date-ranges.md) | accepted | Two named date boundaries, visible partial state, and complete-range validation |
| [0011](0011-functional-locale-context.md) | accepted | Inherited HTML language, Intl functional displays, and stable canonical date/number values |

Acceptance of a design constraint is distinct from implementation completion. Twenty-one form controls, Accordion, Tabs, Native Field, a native Button family, a live playground, and a tested static export are implemented; compatibility limits are documented in the project README.
