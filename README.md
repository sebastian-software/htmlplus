# html+

Form controls that extend HTML's vocabulary and participate in ordinary web forms.

**Status:** working prototype. Fourteen elements (twelve form controls, Accordion, and Tabs), a live FormData playground, and a static Pages export are implemented. The project is named **html+**; its domain is [htmlplus.dev](https://htmlplus.dev). `htmlplus` is the technical slug and private package name. The `h6-` element prefix is still provisional; there is no published package.

## Run the playground

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The dev command compiles TypeScript, watches source changes, and starts a local server. Refresh the page after source changes. Stop it with Ctrl+C.

The playground shows actual `new FormData(form)` entries as fields change. Switch between an entry table and a JSON view, submit locally, reset defaults, disable the fieldset, or compare Light/Dark appearances and Neutral, Blue, Green, Orange, Rose, and custom Utility palettes. Repeated field names remain separate entries; the JSON view groups repeated names into arrays. Demo submissions are captured in the browser and do not make a network request.

## Styling examples

Open **Styling** in the playground, or click an element's name beside a field. Each of the fourteen elements has a live Base preview, a CSS variation, a list of public parts, and copyable HTML and CSS. The neutral base is built into the components. The optional `themes.css` supplies prefixed light/dark palettes; `shadcn.css` connects an existing shadcn palette through the `hp-shadcn` class. Both files are copied into `dist/` at build time. Semantic token suffixes and roles match the documented shadcn theme contract, with plain CSS and no additional dependency. See the [styling guide](docs/STYLING.md) for integration, tokens, parts, and states.

## Implemented elements

| Element | Behavior |
| --- | --- |
| `h6-switch` | Checkbox-like form value, keyboard activation, labels, required state, disabled fieldsets, and reset |
| `h6-iban` | Canonical uppercase submission without whitespace; ten national-format profiles and the IBAN checksum |
| `h6-bic` | Canonical uppercase submission; 8- or 11-character BIC structure checks |
| `h6-otp` | One native text editor, numeric keyboard and OTP autofill hints, configurable pattern, preserved leading zeros |
| `h6-duration` | Native text notation such as `1h 30m`, `90m`, or `01:30`; canonical whole seconds; `min`/`max` in seconds |
| `h6-interval` | Two native numeric editors, explicit boundary names, order and numeric constraints, optional open ends |
| `h6-segmented` | Compact single selection using native radio inputs and caller-supplied options |
| `h6-tags` | Add with Enter or comma, remove individual tags, trim and deduplicate, submit repeated names, and reset |
| `h6-toggle` | Native pressed button, checkbox-like form contribution, labels, required state, fieldsets, and reset; Zag behavior |
| `h6-accordion` | Zag disclosure navigation, one/multiple open sections, light-DOM content, and invalid-field revelation |
| `h6-tabs` | Zag automatic/manual activation, horizontal/vertical and RTL keys, linked panels, and contained form fields |

Every control includes a neutral base appearance, with consistent editor typography and centered SVG icons. No external component stylesheet is required. Override inherited `--hp-*` tokens or public parts to customize it.

The twelve form controls use `ElementInternals` for form participation. Accordion and Tabs keep their content in light DOM, so contained fields retain their own form association; those two hosts do not submit view state. The text controls keep a native input in shadow DOM. The text a person edits is separate from the canonical submission value: typing `de89 3704 0044 0532 0130 00` leaves that text untouched while the form receives `DE89370400440532013000`. This separation preserves native text editing and undo.

## Use a control

After building, import `dist/src/index.js` as a browser ES module. It registers the fourteen elements and exports their classes. Toggle, Accordion, Tabs, Slider, Range Slider, and Rating use Zag's vanilla adapter internally; there is no runtime component framework dependency. The build type-checks TypeScript, emits declarations, and bundles browser modules with shared chunks using esbuild. Deploy the complete `dist/` tree so those chunks remain available. Source modules also export their individual classes for explicit registration. CSS parts and inherited `--hp-*` custom properties are the styling surface; the demo demonstrates both.

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

The bundled runtime dependencies' [third-party notices](THIRD_PARTY_NOTICES.txt) are copied into `dist/` and the static export. Keep them with the distributed browser modules.

## Current value contract

- Text fields expose canonical `.value`, raw `.displayValue`, and `.defaultValue`. Setting `.value` is programmatic and emits no user events. User edits keep the native editor's text intact.
- Tags expose `.value` and `.defaultValue` as string arrays. Declarative defaults use a JSON array in the `value` attribute. Entries are trimmed and deduplicated with case-sensitive equality; their order is preserved. Enter, comma, or blur commits pending text. Backspace in an empty editor focuses the last remove button. Editing an existing tag in place is not implemented.
- Switches expose `.checked`, `.defaultChecked`, and `.value`. An unchecked switch contributes no entry. Text fields and tags support `readonly`; switches use `disabled`.
- Toggles expose `.pressed`, `.defaultPressed`, and the submitted string `.value` (default `on`). An unpressed toggle contributes no entry. User activation emits one `input`/`change` pair; assignment and reset emit no user events.
- Reset restores defaults. Explicit custom errors remain until cleared with `setCustomValidity("")`, as with native fields.
- Format checks are local. They do not establish account ownership, BIC registration, or authentication-code validity. The IBAN profiles cover AT, BE, CH, DE, ES, FR, GB, IE, IT, and NL; they are hand-authored factual format rules checked against [Swift Registry release 103](https://www.swift.com/swift-resource/9606/download), not a bundled copy of the registry. Full registry coverage and its ongoing data-management requirements remain future work.

## Additional value contracts

```html
<h6-duration name="duration" value="1h 30m" min="60"></h6-duration>
<h6-interval name="budget" lower-name="budget_min" upper-name="budget_max"
  value="[200,800]" min="0" max="10000" step="50" required></h6-interval>
<h6-segmented name="delivery" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
</h6-segmented>
```

- Duration: `.value` is seconds as a string, `.displayValue` is the editor text. Bare integers are seconds. `HH:MM[:SS]` means hours, minutes, and optional seconds; units accept whole `h`, `m`, and `s` in that order. Reject fractions, negatives, unsafe integers, and calendar units. An optional empty field submits an empty string, like a native text input.
- Interval: `.value` and `.defaultValue` are `[number | null, number | null]`; a JSON `value` attribute declares defaults. A host `name` enables submission; keys default to `name.min` and `name.max` unless overridden. Blank boundaries are omitted, and `required` requires both. Both inputs use `min`, `max`, and `step` (native default step: 1); ordering is validated without swapping. `readonly` supports inspection without editing. Restoration preserves the raw numeric editor strings.
- Segmented: `.value` and `.defaultValue` are strings. Direct child options provide labels and nonempty values; the first duplicate value wins. Unknown or disabled selections are omitted. `required` needs an enabled selection. Options can be added, removed, or updated. Native radio arrow keys and Space select; a label click focuses the selected option. Use `disabled` for a noninteractive choice.
- All three support ordinary form association, fieldset disabling, reset, `setCustomValidity`, `checkValidity`, and `reportValidity`. Programmatic assignments emit no user events.

Public styling hooks: duration exposes `input`; interval exposes `control`, `input`, `lower-input`, `upper-input`, `lower-label`, `upper-label`, and `separator`; segmented exposes `control` and `option`. All inherit the existing `--hp-*` theme properties.

## Static demo and GitHub Pages

```sh
npm run build:demo
node scripts/serve.mjs --site --port 48165
```

Open `http://127.0.0.1:48165/htmlplus/`. The `site/` export contains only the demo HTML, CSS, favicon, and compiled browser modules. Relative URLs support GitHub repository subpaths and custom domains. Generated files are ignored in Git; source stays authoritative.

The [Pages workflow](.github/workflows/pages.yml) runs strict compilation, unit tests, and Chromium, Firefox, and WebKit browser checks on Linux, including the actual exported artifact under `/htmlplus/`. Successful pushes to `main` and manual runs upload that artifact and deploy to the `github-pages` environment. Pull requests run verification without deploying. Pages must be enabled with **GitHub Actions** as the build source in repository settings. The demo runs entirely in the browser; it has no application backend or analytics.

The intended custom-domain address is `https://htmlplus.dev/`. The local `/htmlplus/` route tests repository-subpath compatibility; it is not a required prefix on the custom domain. Domain DNS and GitHub Pages settings are separate deployment configuration and have not been changed by the project rename.

## Verify

Install the test browsers once:

```sh
npx playwright install chromium firefox webkit
npm test
```

`npm test` compiles with strict TypeScript, runs the validation unit tests, then runs the integrated browser tests. The default browser matrix is Chromium, Firefox, and WebKit. Desktop/mobile layout and light and dark themes are inspected from generated screenshots.

On this macOS host, Firefox exits before opening a page with `Could not find profile folder`; this resembles the [upstream Firefox/macOS app-data issue](https://github.com/microsoft/playwright/issues/42768). No system privacy settings were changed. Run the available-engine checks explicitly with:

```sh
npm test -- --project=chromium --project=webkit
```

Firefox behavior remains unverified here. Physical-device OTP autofill, assistive-technology combinations, and exact minimum browser versions are also unverified. A Playwright WebKit pass is not a claim of physical iPhone certification.

## Project documents

- [Project plan](docs/PLAN.md): current scope and delivery order. Select, Combobox, and Date Picker remain planned.
- [Interaction elements](docs/INTERACTIONS.md): Toggle, Accordion, and Tabs APIs, section markup, events, native form behavior, and validation.
- [Headless interaction decision](docs/adr/0005-headless-interaction-logic.md): accepted Zag integration for the six interaction elements, build boundaries, and remaining popup work.
- [Living architecture decisions](docs/adr/README.md): current rationale and browser evidence.
- [Project identity](docs/adr/0006-project-identity.md): the html+ name, htmlplus.dev domain, and technical naming boundary.
- [Playground design](docs/PLAYGROUND.md): layout and styling intent.
- [Glossary](GLOSSARY.md): shared field terminology.
- [Project instructions](AGENTS.md): US English, Conventional Commits, and living ADRs.

## Numeric choices

Slider, Range Slider, and Rating use Zag 1.46.0 with ElementInternals submission and no hidden inputs. Slider submits one numeric string; Range Slider submits two explicitly named boundaries; Rating submits one whole score or no entry while unanswered. Hover only previews a rating. Each has its own styling recipe and Light/Dark examples. See [numeric choice APIs and behavior](docs/NUMERIC-CHOICES.md).

The Palette picker adds Blue, Green, Orange, and Rose from the official [shadcn registry](https://github.com/shadcn-ui/ui/blob/4101ec98af37e2d812f859e3f540bceafbbc5200/apps/v4/registry/themes.ts), on the existing neutral base. These are a curated selection, not a measured popularity ranking. Appearance remains independent. Utility is retained as a custom example. Palette data is MIT-attributed in `THIRD_PARTY_NOTICES.txt`.
