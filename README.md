# html6

Form controls that extend HTML's vocabulary and participate in ordinary web forms.

**Status:** local prototype. Five controls and a live FormData playground are implemented. The project name and `h6-` prefix are working names; there is no published package.

## Run the playground

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The dev command compiles TypeScript, watches source changes, and starts a local server. Refresh the page after source changes. Stop it with Ctrl+C.

The playground shows actual `new FormData(form)` entries as fields change. Switch between an entry table and a JSON view, submit locally, reset defaults, disable the fieldset, or compare the Studio and Utility CSS themes. Repeated field names remain separate entries; the JSON view groups repeated names into arrays. Demo submissions are captured in the browser and do not make a network request.

## Implemented controls

| Element | Behavior |
| --- | --- |
| `h6-switch` | Checkbox-like form value, keyboard activation, labels, required state, disabled fieldsets, and reset |
| `h6-iban` | Canonical uppercase submission without whitespace; ten national-format profiles and the IBAN checksum |
| `h6-bic` | Canonical uppercase submission; 8- or 11-character BIC structure checks |
| `h6-otp` | One native text editor, numeric keyboard and OTP autofill hints, configurable pattern, preserved leading zeros |
| `h6-tags` | Add with Enter or comma, remove individual tags, trim and deduplicate, submit repeated names, and reset |

Every control uses `ElementInternals` for form participation. The text controls keep a native input in shadow DOM. The text a person edits is separate from the canonical submission value: typing `de89 3704 0044 0532 0130 00` leaves that text untouched while the form receives `DE89370400440532013000`. This separation preserves native text editing and undo.

## Use a control

After building, import `dist/src/index.js` as a browser ES module. It registers the five elements and exports their classes. There is no runtime framework dependency. Source modules also export their individual classes for explicit registration. CSS parts and inherited `--h6-*` custom properties are the styling surface; the demo demonstrates both.

```html
<script type="module" src="/dist/src/index.js"></script>
<form>
  <label for="account">IBAN</label>
  <h6-iban id="account" name="iban" required></h6-iban>
  <label for="topics">Topics</label>
  <h6-tags id="topics" name="topics" value='["html", "forms"]'></h6-tags>
  <label for="updates">Product updates</label>
  <h6-switch id="updates" name="updates" value="email"></h6-switch>
  <button>Submit</button>
</form>
```

These are JavaScript-dependent controls. A no-JavaScript fallback and server-side rendering integration are not implemented.

## Current value contract

- Text fields expose canonical `.value`, raw `.displayValue`, and `.defaultValue`. Setting `.value` is programmatic and emits no user events. User edits keep the native editor's text intact.
- Tags expose `.value` and `.defaultValue` as string arrays. Declarative defaults use a JSON array in the `value` attribute. Entries are trimmed and deduplicated with case-sensitive equality; their order is preserved. Enter, comma, or blur commits pending text. Backspace in an empty editor focuses the last remove button. Editing an existing tag in place is not implemented.
- Switches expose `.checked`, `.defaultChecked`, and `.value`. An unchecked switch contributes no entry. Text fields and tags support `readonly`; switches use `disabled`.
- Reset restores defaults. Explicit custom errors remain until cleared with `setCustomValidity("")`, as with native fields.
- Format checks are local. They do not establish account ownership, BIC registration, or authentication-code validity. The IBAN profiles cover AT, BE, CH, DE, ES, FR, GB, IE, IT, and NL; they are hand-authored factual format rules checked against [Swift Registry release 103](https://www.swift.com/swift-resource/9606/download), not a bundled copy of the registry. Full registry coverage and its ongoing data-management requirements remain future work.

## Verify

Install the test browsers once:

```sh
npx playwright install chromium firefox webkit
npm test
```

`npm test` compiles with strict TypeScript, runs the validation unit tests, then runs the integrated browser tests. The default browser matrix is Chromium, Firefox, and WebKit. Desktop/mobile layout and the two themes are inspected from generated screenshots.

On this macOS host, Firefox exits before opening a page with `Could not find profile folder`; this resembles the [upstream Firefox/macOS app-data issue](https://github.com/microsoft/playwright/issues/42768). No system privacy settings were changed. Run the available-engine checks explicitly with:

```sh
npm test -- --project=chromium --project=webkit
```

Firefox behavior remains unverified here. Physical-device OTP autofill, assistive-technology combinations, and exact minimum browser versions are also unverified. A Playwright WebKit pass is not a claim of physical iPhone certification.

## Project documents

- [Project plan](docs/PLAN.md): current scope and remaining work.
- [Living architecture decisions](docs/adr/README.md): current rationale and browser evidence.
- [Playground design](docs/PLAYGROUND.md): layout and styling intent.
- [Glossary](GLOSSARY.md): shared field terminology.
- [Project instructions](AGENTS.md): US English, Conventional Commits, and living ADRs.
