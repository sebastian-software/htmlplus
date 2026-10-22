# Living architecture decisions

ADRs are the current, revisable account of the project's architecture. A record may change after acceptance. Reading its current file should be enough to understand the current direction.

Keep stable, sequential filenames in this directory. Each record has a status, creation date, last-updated date, rationale, consequences, and a short dated change note. Use `proposed`, `accepted`, `rejected`, or `deprecated`. A proposal does not imply implementation or an agreed final API.

When a decision changes, edit the same record, update its date and change notes, and reconcile this index and the project plan. Create another record for a genuinely separate decision. Keep earlier rationale in concise change notes; version control can retain complete earlier text once the project is tracked. This favors easy access to the current decision over an immutable in-document audit trail.

| Record | Status | Subject |
| --- | --- | --- |
| [0001](0001-native-form-contract.md) | accepted | Ordinary HTML forms are the integration contract |
| [0002](0002-css-styling-contract.md) | accepted | Expose styling through platform CSS mechanisms |
| [0003](0003-specialized-native-inputs.md) | accepted | Separate native text editing from canonical form submission |

Acceptance of a design constraint is distinct from implementation completion. Five controls and a local playground are implemented; compatibility limits are documented in the project README.
