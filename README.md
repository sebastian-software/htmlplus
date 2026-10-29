# html+

**More capable HTML. Ordinary forms.**

html+ provides framework-independent form controls and core UI primitives. Components handle interaction, value formats, and form participation. Your application supplies the data, business rules, and workflows.

**Status:** working prototype. Twenty-three elements (twenty-one form controls, Accordion, and Tabs), a native Button family, a live FormData playground, and a static Pages export are implemented. The project is named **html+**; its domain is [htmlplus.dev](https://htmlplus.dev). `htmlplus` is the technical slug and private package name. The `h6-` element prefix is still provisional; there is no published package.

**Demo:** [Form playground](https://sebastian-software.github.io/htmlplus/) · [Styling recipes](https://sebastian-software.github.io/htmlplus/styling.html) · [Deployment checks](https://github.com/sebastian-software/htmlplus/actions/workflows/pages.yml)

## What belongs in html+

Use native HTML when it meets the interaction, form, and styling requirements. html+ fills gaps with reusable controls that expose HTML attributes, properties, DOM events, and CSS styling hooks. Form controls participate through `name`, `FormData`, validation, disabled state, and reset. Accordion and Tabs organize content while contained fields keep their own form values.

The boundary is application knowledge. A component may know the rules of its value and interaction; the application decides what that value means in its workflow:

- An IBAN field checks supported national formats and check digits. The application verifies account ownership and initiates payments.
- An OTP field preserves the entered code and checks its configured format. The application delivers codes, verifies them, and manages expiry and retries.
- A rating control manages a chosen score and hover preview. The application decides who may rate, what is being rated, and how to save the result.

Applications can declare constraints and supply custom validity errors through the form API. Components expose values and events without fetching business records or starting application workflows.

The value is a maintained HTML, form, and CSS contract, backed by behavior checks. [ADR-0007](docs/adr/0007-component-application-boundary.md) records this scope and its tradeoffs, with Nolan Lawson's [discussion of web components and reuse](https://nolanlawson.com/2026/10/19/do-web-components-have-a-future-if-nobody-is-writing-them/) as a reference.

## Run the playground

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The dev command compiles TypeScript, watches source changes, and starts a local server. Refresh the page after source changes. Stop it with Ctrl+C.

The playground shows actual `new FormData(form)` entries as fields change. Switch between an entry table and a JSON view, submit locally, reset defaults, disable the fieldset, or compare Light/Dark appearances and Neutral, Blue, Green, Orange, Rose, and custom Utility palettes. Repeated field names remain separate entries; the JSON view groups repeated names into arrays. Demo submissions are captured in the browser and do not make a network request.

## Styling examples

Open **Styling** in the playground, or click an element's name beside a field. Each of the twenty-three elements has a live Base preview, a CSS variation, a list of public parts, and copyable HTML and CSS. The neutral base is built into the components. The optional `themes.css` supplies prefixed light/dark palettes; `shadcn.css` connects an existing shadcn palette through the `hp-shadcn` class. Both files are copied into `dist/` at build time. The Surface picker compares Layered and Flat finishes independently of appearance and palette. Five `--hp-shadow-*` roles control depth across buttons, fields, handles, and popovers, inspired by the React Aria examples. Semantic token suffixes and roles match the documented shadcn theme contract, with plain CSS and no additional dependency. See the [styling guide](docs/STYLING.md) for integration, tokens, parts, and states.

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
| `h6-slider` | Zag pointer/keyboard selection of one bounded number, with native form participation |
| `h6-range-slider` | Two stable Zag thumbs, ordered boundaries, and explicitly named form entries |
| `h6-select` | Zag single selection, supplied options, clearable identifier, and a themed top-layer listbox |
| `h6-date-range-picker` | Two native editors, Zag range selection, partial-state validation, and two named ISO date entries |
| `h6-date-picker` | Native localized editor and Zag calendar views, strict date-only submission, inclusive bounds, and a themed top-layer popup |
| `h6-combobox` | Zag searchable selection with a native editor, separate query, and no free-text form entry |
| `h6-checkbox` | Native checked/mixed states, labels, reset, and checkbox-like submission; Zag behavior |
| `h6-radio-group` | One supplied identifier, descriptions, disabled options, and keyboard selection |
| `h6-number-input` | Native localized editing, canonical numeric submission, constraints, and Zag stepping |
| `h6-password-input` | Native password editing and a keyboard-accessible visibility button |
| `h6-toggle-group` | Single or multiple selection with repeated form entries, using Zag |
| `h6-rating` | Clearable whole score, separate hover preview, and an unanswered required state; Zag behavior |

The optional `dist/native.css` styles real `<button class="hp-button">` elements with primary, secondary, outline, ghost, destructive, icon, size, and loading examples. Native submit/reset and submitter behavior stay intact without JavaScript. The gallery has a separate Button recipe. See [everyday controls](docs/EVERYDAY-CONTROLS.md) for all five new field APIs, mixed table selection, and the native button contract.

Every control includes a neutral base appearance, with consistent editor typography and centered SVG icons. No external component stylesheet is required. Override inherited `--hp-*` tokens or public parts to customize it.

The twenty-one form controls use `ElementInternals` for form participation. Accordion and Tabs keep their content in light DOM, so contained fields retain their own form association; those two hosts do not submit view state. The text controls keep a native input in shadow DOM. The text a person edits is separate from the canonical submission value: an IBAN displays `DE89 3704 0044 0532 0130 00` while the form receives `DE89370400440532013000`. Verification codes use visual character slots over one native input. Targeted native editing commands preserve undo during formatting; [formatted fields](docs/FORMATTED-FIELDS.md) documents the behavior and compatibility fallback.

## Use a control

After building, import `dist/src/index.js` as a browser ES module. It registers the twenty-three elements and exports their classes. Checkbox, Radio Group, Number Input, Password Input, Toggle Group, Toggle, Accordion, Tabs, Slider, Range Slider, Rating, Select, Combobox, Date Picker, and Date Range Picker use Zag's vanilla adapter internally; there is no runtime component framework dependency. The build type-checks TypeScript, emits declarations, and bundles browser modules with shared chunks using esbuild. Deploy the complete `dist/` tree so those chunks remain available. Source modules also export their individual classes for explicit registration. CSS parts and inherited `--hp-*` custom properties are the styling surface; the demo demonstrates both.

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

These are JavaScript-dependent controls. Select, Combobox, Date Picker, and Date Range Picker also require the native Popover API; see the [selection guide](docs/SELECTION-CONTROLS.md) for their popup and browser boundaries. A no-JavaScript fallback and server-side rendering integration are not implemented.

The bundled runtime dependencies' [third-party notices](THIRD_PARTY_NOTICES.txt) are copied into `dist/` and the static export. Keep them with the distributed browser modules.

## Current value contract

- Text fields expose canonical `.value`, raw `.displayValue`, and `.defaultValue`. Setting `.value` is programmatic and emits no user events. Formatting for IBAN and OTP uses native edits while retaining the browser's undo history. Other text fields keep their typed notation.
- Tags expose `.value` and `.defaultValue` as string arrays. Declarative defaults use a JSON array in the `value` attribute. Entries are trimmed and deduplicated with case-sensitive equality; their order is preserved. Enter, comma, or blur commits pending text. Backspace in an empty editor focuses the last remove button. Editing an existing tag in place is not implemented.
- Switches expose `.checked`, `.defaultChecked`, and `.value`. An unchecked switch contributes no entry. Text fields and tags support `readonly`; switches use `disabled`.
- Toggles expose `.pressed`, `.defaultPressed`, and the submitted string `.value` (default `on`). An unpressed toggle contributes no entry. User activation emits one `input`/`change` pair; assignment and reset emit no user events.
- Reset restores defaults. Explicit custom errors remain until cleared with `setCustomValidity("")`, as with native fields.
- Format checks are local. They do not establish account ownership, BIC registration, or authentication-code validity. The IBAN profiles cover AT, BE, CH, DE, ES, FR, GB, IE, IT, and NL; they are hand-authored factual format rules checked against [Swift Registry release 103](https://www.swift.com/swift-resource/9606/download), not a bundled copy of the registry. Full registry coverage and its ongoing data-management requirements remain future work.

Date Range Picker exposes `[start, end]` as ISO strings with `null` for empty boundaries. Its host name enables `name.start` and `name.end` entries, with explicit naming overrides. A partial selection is inspectable in FormData but blocks validation until both dates complete the range. See the [Date Range Picker guide](docs/DATE-RANGE-PICKER.md).

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

The [Pages workflow](.github/workflows/pages.yml) runs strict compilation, unit tests, and Chromium, Firefox, and WebKit browser checks on Linux, including the actual exported artifact under `/htmlplus/`. Successful pushes to `main` and manual runs upload that artifact and deploy to the `github-pages` environment. Pull requests run verification without deploying. The public [sebastian-software/htmlplus repository](https://github.com/sebastian-software/htmlplus) uses **GitHub Actions** as its Pages publishing source. Pushes to `main` publish the verified demo at [sebastian-software.github.io/htmlplus](https://sebastian-software.github.io/htmlplus/). The demo runs entirely in the browser; it has no application backend or analytics.

The intended custom-domain address is `https://htmlplus.dev/`. The local `/htmlplus/` route tests repository-subpath compatibility; it is not a required prefix on the custom domain. Domain DNS and GitHub Pages settings are separate deployment configuration and have not been changed by the project rename.

## Verify

Install the test browsers once:

```sh
npx playwright install chromium firefox webkit
npm test
```

The Actions verification job uses the official `mcr.microsoft.com/playwright:v1.64.1-noble` image with browsers and Linux system dependencies preinstalled. Keep its version aligned with Playwright in `package-lock.json` when upgrading.

`npm test` compiles with strict TypeScript, runs the validation unit tests, then runs the integrated browser tests. The default browser matrix is Chromium, Firefox, and WebKit. Desktop/mobile layout and light and dark themes are inspected from generated screenshots.

On this macOS host, Firefox exits before opening a page with `Could not find profile folder`; this resembles the [upstream Firefox/macOS app-data issue](https://github.com/microsoft/playwright/issues/42768). No system privacy settings were changed. Run the available-engine checks explicitly with:

```sh
npm test -- --project=chromium --project=webkit
```

Direct Firefox automation on this macOS host remains unavailable; the Linux container and CI include Firefox. Physical-device OTP autofill, assistive-technology combinations, and exact minimum browser versions are also unverified. A Playwright WebKit pass is not a claim of physical iPhone certification.

## Project documents

- [Component and application boundary](docs/adr/0007-component-application-boundary.md): the guiding principle, reusable component logic, and application responsibilities.
- [Project plan](docs/PLAN.md): current scope and delivery order. The initial requested catalog is implemented; later candidates are recorded in the plan.
- [Date Range Picker](docs/DATE-RANGE-PICKER.md): two named ISO boundaries, native drafts, range preview, validation, and styling.
- [Functional locale formatting](docs/LOCALE.md): inherited HTML language, Intl dates/numbers, dynamic changes, week information, and the demo locale picker.
- [Date Picker](docs/DATE-PICKER.md): ISO values, locale-aware parsing, raw drafts, constraints, calendar navigation, and styling.
- [Select and Combobox](docs/SELECTION-CONTROLS.md): identifiers, queries, options, form events, popup behavior, and styling.
- [Interaction elements](docs/INTERACTIONS.md): Toggle, Accordion, and Tabs APIs, section markup, events, native form behavior, and validation.
- [Headless interaction decision](docs/adr/0005-headless-interaction-logic.md): accepted Zag integration for ten interaction elements, form boundaries, and dependency upgrade checks.
- [Living architecture decisions](docs/adr/README.md): current rationale and browser evidence.
- [Project identity](docs/adr/0006-project-identity.md): the html+ name, htmlplus.dev domain, and technical naming boundary.
- [Playground design](docs/PLAYGROUND.md): layout and styling intent.
- [Glossary](GLOSSARY.md): shared field terminology.
- [Project instructions](AGENTS.md): US English, Conventional Commits, and living ADRs.

## Numeric choices

Slider, Range Slider, and Rating use Zag 1.46.0 with ElementInternals submission and no hidden inputs. Slider submits one numeric string; Range Slider submits two explicitly named boundaries; Rating submits one whole score or no entry while unanswered. Hover only previews a rating. Each has its own styling recipe and Light/Dark examples. See [numeric choice APIs and behavior](docs/NUMERIC-CHOICES.md).

The Palette picker adds Blue, Green, Orange, and Rose from the official [shadcn registry](https://github.com/shadcn-ui/ui/blob/4101ec98af37e2d812f859e3f540bceafbbc5200/apps/v4/registry/themes.ts), on the existing neutral base. These are a curated selection, not a measured popularity ranking. Appearance remains independent. Utility is retained as a custom example. Palette data is MIT-attributed in `THIRD_PARTY_NOTICES.txt`.
