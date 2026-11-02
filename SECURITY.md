# Security policy

html+ is a browser-side prototype with no published package and no supported releases yet. Reports always apply to the current `main` branch.

## Report a vulnerability

Please don't open a public issue. Use [GitHub's private reporting](https://github.com/sebastian-software/htmlplus/security/advisories/new) and include the affected element, the browser, and steps to reproduce it.

## What is in scope

Some elements handle sensitive values, including passwords, one-time codes, and bank account numbers. Relevant reports include script injection through attributes or option content, values leaking to places a native field wouldn't put them, such as session history or attribute reflection, and format checks that accept input the documentation says they reject.

Format checks are not verification. An IBAN that passes its checks may not exist, and verifying accounts or codes is the application's responsibility, as [ADR-0007](docs/adr/0007-component-application-boundary.md) describes.
