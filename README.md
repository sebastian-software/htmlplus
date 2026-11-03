# html+

**More capable HTML. Ordinary forms.**

html+ provides framework-independent form controls and core UI primitives. Components handle interaction, value formats, and form participation. Your application supplies the data, business rules, and workflows. [ADR-0007](docs/adr/0007-component-application-boundary.md) records that boundary: an IBAN field checks format and check digits, while the application verifies the account and starts the payment.

**Status:** prototype. Element APIs may still change before a release. There is no npm package: `npm i htmlplus` installs an unrelated third-party package. The name `htmlplus.dev` is reserved and not live yet.

**Try it:** [project site](https://sebastian-software.github.io/htmlplus/) · [form playground](https://sebastian-software.github.io/htmlplus/demo/) · [styling gallery](https://sebastian-software.github.io/htmlplus/demo/styling.html)

## Install today

No package is published yet, so build a tarball from a clone. Requires Node.js 22 or later and npm.

```sh
git clone https://github.com/sebastian-software/htmlplus.git
cd htmlplus
npm ci
npm pack
```

Then install `htmlplus-0.1.0.tgz` in your project. A Git dependency does not work, because the built files are ignored in Git. The name `htmlplus` in these examples is a placeholder until the [package name](docs/PLAN.md#open-decisions) is decided.

To explore the source instead, run `npm run dev`. The project site is at <http://127.0.0.1:4173/>, the playground at <http://127.0.0.1:4173/demo/>, and the gallery at <http://127.0.0.1:4173/demo/styling.html>. Refresh the page after source changes.

## Use a control

Import an element once and use it in ordinary markup. Importing registers it, so there is nothing else to call.

```js
import "htmlplus/iban";
import "htmlplus/tags";
import "htmlplus/switch";
```

```html
<form>
  <label for="account">IBAN</label>
  <hplus-iban id="account" name="iban" required></hplus-iban>
  <label for="topics">Topics</label>
  <hplus-tags id="topics" name="topics" value='["html", "forms"]'></hplus-tags>
  <label for="updates">Product updates</label>
  <hplus-switch id="updates" name="updates" value="email"></hplus-switch>
  <button>Submit</button>
</form>
```

`new FormData(form)` and native submission receive the values, and labels, validation, reset, and disabled fieldsets work as with native fields. [Forms and validation](docs/FORMS.md) covers showing errors and using the elements with React.

| Import | What it does |
| --- | --- |
| `htmlplus/<name>`, such as `htmlplus/date-picker` | Registers that element and exports its class |
| `htmlplus` | Registers all twenty-four elements and exports their classes |
| `htmlplus/react` | JSX types for React 19 |
| `htmlplus/native.css`, `themes.css`, `shadcn.css` | The optional stylesheets |

Each entry is safe to import during server rendering, where it does nothing. Without a bundler, use the prebuilt modules in `browser/`, such as `<script type="module" src="/htmlplus/browser/elements/iban.js"></script>`. Keep that folder together with its `chunks/`, and keep `THIRD_PARTY_NOTICES.txt` with the distributed modules.

Each element has a built-in neutral base, so no stylesheet is required. Customize it with inherited `--hp-*` tokens, CSS parts, and ordinary CSS on wrapped native fields. Optional `themes.css` adds Light/Dark palettes, `shadcn.css` connects an existing shadcn theme, and `native.css` styles `hplus-field` and `<button class="hp-button">` without JavaScript. See the [styling guide](docs/STYLING.md).

## Elements

There are twenty-one form controls using `ElementInternals`, plus Accordion, Tabs, and Native Field, which submit nothing themselves. Fifteen elements use Zag's vanilla adapter internally; there is no runtime component framework. [The element reference](docs/ELEMENTS.md) lists each element's attributes, properties, methods, and parts.

| Element | Behavior | Reference |
| --- | --- | --- |
| [`hplus-field`](docs/NATIVE-FIELDS.md) | Shared base styling around a real light-DOM input, textarea, or select | [API](docs/ELEMENTS.md#hplus-field) |
| [`hplus-switch`](#current-value-contract) | On/off setting with a checkbox-like form value | [API](docs/ELEMENTS.md#hplus-switch) |
| [`hplus-checkbox`](docs/EVERYDAY-CONTROLS.md#checkbox-and-table-selection) | Independent checked and mixed states; checkbox-like submission | [API](docs/ELEMENTS.md#hplus-checkbox) |
| [`hplus-toggle`](docs/INTERACTIONS.md#toggle-a-form-field-with-a-pressed-state) | Pressed button with a checkbox-like form contribution | [API](docs/ELEMENTS.md#hplus-toggle) |
| [`hplus-iban`](docs/FORMATTED-FIELDS.md#iban) | Grouped display, whitespace-free submission, ten national formats, and check digits | [API](docs/ELEMENTS.md#hplus-iban) |
| [`hplus-bic`](#current-value-contract) | Uppercase submission and 8- or 11-character structure checks | [API](docs/ELEMENTS.md#hplus-bic) |
| [`hplus-otp`](docs/FORMATTED-FIELDS.md#otp-and-pin-presentation) | Character slots over one native editor, autofill hints, and preserved leading zeros | [API](docs/ELEMENTS.md#hplus-otp) |
| [`hplus-password-input`](docs/EVERYDAY-CONTROLS.md#password-input) | Native password editing and a keyboard-accessible visibility button | [API](docs/ELEMENTS.md#hplus-password-input) |
| [`hplus-number-input`](docs/EVERYDAY-CONTROLS.md#number-input) | Localized editing, canonical numeric submission, constraints, and stepping | [API](docs/ELEMENTS.md#hplus-number-input) |
| [`hplus-duration`](#additional-value-contracts) | Notation such as `1h 30m` or `01:30`, submitted as whole seconds | [API](docs/ELEMENTS.md#hplus-duration) |
| [`hplus-interval`](#additional-value-contracts) | Two numeric editors with named boundaries and optional open ends | [API](docs/ELEMENTS.md#hplus-interval) |
| [`hplus-slider`](docs/NUMERIC-CHOICES.md#slider) | One bounded number by pointer or keyboard | [API](docs/ELEMENTS.md#hplus-slider) |
| [`hplus-range-slider`](docs/NUMERIC-CHOICES.md#range-slider) | Two stable thumbs with explicitly named form entries | [API](docs/ELEMENTS.md#hplus-range-slider) |
| [`hplus-rating`](docs/NUMERIC-CHOICES.md#rating) | Clearable whole score, hover preview, and an unanswered state | [API](docs/ELEMENTS.md#hplus-rating) |
| [`hplus-segmented`](#additional-value-contracts) | Compact single selection using native radio inputs | [API](docs/ELEMENTS.md#hplus-segmented) |
| [`hplus-radio-group`](docs/EVERYDAY-CONTROLS.md#radio-group) | One identifier with descriptions and disabled options | [API](docs/ELEMENTS.md#hplus-radio-group) |
| [`hplus-toggle-group`](docs/EVERYDAY-CONTROLS.md#toggle-group) | Single or multiple selection with repeated form entries | [API](docs/ELEMENTS.md#hplus-toggle-group) |
| [`hplus-select`](docs/SELECTION-CONTROLS.md) | Single selection from supplied options in a top-layer listbox | [API](docs/ELEMENTS.md#hplus-select) |
| [`hplus-combobox`](docs/SELECTION-CONTROLS.md) | Searchable selection; query text never becomes a form entry | [API](docs/ELEMENTS.md#hplus-combobox) |
| [`hplus-tags`](#current-value-contract) | Add and remove tags that submit as repeated entries | [API](docs/ELEMENTS.md#hplus-tags) |
| [`hplus-date-picker`](docs/DATE-PICKER.md) | Localized editor and calendar with strict date-only submission | [API](docs/ELEMENTS.md#hplus-date-picker) |
| [`hplus-date-range-picker`](docs/DATE-RANGE-PICKER.md) | Two editors, range selection, and two named ISO entries | [API](docs/ELEMENTS.md#hplus-date-range-picker) |
| [`hplus-accordion`](docs/INTERACTIONS.md#accordion-disclosure-sections) | Disclosure sections; contained fields keep their own form values | [API](docs/ELEMENTS.md#hplus-accordion) |
| [`hplus-tabs`](docs/INTERACTIONS.md#tabs-one-visible-panel) | Linked panels; contained fields keep their own form values | [API](docs/ELEMENTS.md#hplus-tabs) |

Actions stay real buttons: the [native Button family](docs/EVERYDAY-CONTROLS.md#native-buttons) is `<button class="hp-button">` styled by `native.css`.

## Browser support

html+ assumes every feature that is [Baseline](https://web-platform-dx.github.io/web-features/), newly or widely available, and adds no fallbacks for them. Features that are not yet Baseline are only used as progressive enhancement. [ADR-0013](docs/adr/0013-platform-first.md) records this floor. CI runs current stable Chromium, Firefox, and WebKit through Playwright.

The elements rely on these platform features:

- Custom elements, shadow DOM, and `ElementInternals`, on every form control.
- `ElementInternals.states` and `:state()`, for live state on the controls that expose it.
- The Popover API, on Select, Combobox, Date Picker, and Date Range Picker. There is no older-browser fallback.
- CSS `light-dark()` and `color-mix()`, in surface shadows and derived colors.
- `document.execCommand("insertText")`, as a fallback role only. It keeps native undo while IBAN and OTP format text. If the command is unavailable or fails, ordinary native editing, canonical values, and validation keep working. See [formatted fields](docs/FORMATTED-FIELDS.md#compatibility-decision-and-evidence).

Physical devices, OTP autofill, password managers, manual assistive-technology combinations, and real browser history restoration are unverified. Automated axe checks and a Playwright WebKit pass don't establish them.

## Size

[Element sizes](docs/SIZES.md) lists what each element costs on its own, from about 2 KB gzipped for `hplus-switch` to about 50 KB for `hplus-date-range-picker`. All twenty-four elements together are about 120 KB, and importing only the ones a page uses keeps the rest out of its bundle.

## Current value contract

Text fields are IBAN, BIC, OTP, Duration, Number Input, and Password Input. Their shared rules are below, along with the contracts for Switch, BIC, and Tags, which have no separate guide. Other elements are described in the guides linked from the [element table](#elements).

- **Text fields** expose canonical `.value`, raw `.displayValue`, and `.defaultValue`. An IBAN displays `DE89 3704 0044 0532 0130 00` while the form receives `DE89370400440532013000`. Enter submits the form like a native field. Enter that chooses a Combobox option or commits a tag does not submit.
- **Assignment** is programmatic and emits no user events. `null` or `undefined` empties a string `.value`; other values use `String()`. Properties assigned before an element upgrades are applied when it connects.
- **Events:** host `input` and `change` bubble and are composed.
- **Reset** restores defaults and clears `data-touched`. Explicit custom errors remain until cleared with `setCustomValidity("")`. See [forms and validation](docs/FORMS.md).
- **Switch** exposes `.checked`, `.defaultChecked`, and `.value` (default `on`). An unchecked switch contributes no entry. It supports `disabled`, not `readonly`.
- **BIC** normalizes case and whitespace and keeps the entered 8- or 11-character form, without adding or removing a branch identifier.
- **Tags** expose `.value` and `.defaultValue` as string arrays; declarative defaults use a JSON array in the `value` attribute. Entries are trimmed and deduplicated with case-sensitive equality, in order. Enter, comma, or blur commits pending text. Backspace in an empty editor focuses the last remove button. Editing an existing tag in place is not implemented.
- **Format checks are local.** They don't establish account ownership, BIC registration, or authentication-code validity.
- **IBAN coverage** is AT, BE, CH, DE, ES, FR, GB, IE, IT, and NL. A well-formed IBAN from any other country fails validation with `patternMismatch` and blocks submission. The profiles are hand-authored format rules checked against [Swift Registry release 103](https://www.swift.com/swift-resource/9606/download), not a bundled copy of the registry.

## Additional value contracts

```html
<hplus-duration name="duration" value="1h 30m" min="60"></hplus-duration>
<hplus-interval name="budget" lower-name="budget_min" upper-name="budget_max"
  value="[200,800]" min="0" max="10000" step="50" required></hplus-interval>
<hplus-segmented name="delivery" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
</hplus-segmented>
```

- **Duration:** `.value` is seconds as a string, and `.displayValue` is the editor text. Bare integers are seconds. `HH:MM[:SS]` means hours, minutes, and optional seconds; units accept whole `h`, `m`, and `s` in that order. Fractions, negatives, unsafe integers, and calendar units are rejected. `min` and `max` are in seconds; empty attributes are ignored. An optional empty field submits an empty string, like a native text input.
- **Interval:** `.value` and `.defaultValue` are `[number | null, number | null]`; a JSON `value` attribute declares defaults. A host `name` enables submission; keys default to `name.min` and `name.max` unless `lower-name` and `upper-name` override them. `lower-label` and `upper-label` set the visible boundary labels (default From and To). Blank boundaries are omitted, and `required` requires both. Both inputs use `min`, `max`, and `step` (native default step: 1); ordering is validated without swapping. `readonly` allows inspection without editing. Restoration preserves the raw numeric editor strings.
- **Segmented:** `.value` and `.defaultValue` are strings. Direct child options follow native defaults for values and labels; the first duplicate value wins. Unknown or disabled selections report `""`, are omitted, and return with their option. `required` needs an enabled selection. Options can be added, removed, or updated. Native radio arrow keys and Space select; a label click focuses the selected option. Use `disabled` for a noninteractive choice.

All three support ordinary form association, fieldset disabling, reset, `setCustomValidity`, `checkValidity`, and `reportValidity`. Programmatic assignments emit no user events.

## Without JavaScript and server rendering

The custom form controls depend on JavaScript. There is no no-JavaScript fallback for them and no server-rendering integration: elements render no Declarative Shadow DOM, and the modules read `document` on import, so they can't be imported in a server runtime. A server can still emit the element tags and attributes for the browser to upgrade.

Native Field and the Button family keep native behavior without JavaScript, and `native.css` supplies their base appearance. Accordion and Tabs keep their sections in light DOM, so that content is present before upgrade.

Before upgrade, an element has no shadow root or layout, and child `<option>` elements can show as plain text. html+ ships no pre-upgrade CSS. Use `:defined` to reserve space and hide raw options, adjusting the selectors to the elements you use:

```css
:is(hplus-iban, hplus-select, hplus-combobox):not(:defined) {
  display: block;
  min-height: var(--hp-control-height, 2.5rem);
}
:is(hplus-select, hplus-combobox, hplus-segmented, hplus-radio-group, hplus-toggle-group):not(:defined) > option {
  display: none;
}
```

This is ordinary CSS and the project's tests don't exercise it.

## Documents

**Using the elements**

- [Element reference](docs/ELEMENTS.md): generated attributes, properties, methods, and parts for each element. [`custom-elements.json`](custom-elements.json) holds the same data for tools.
- [Forms and validation](docs/FORMS.md): showing errors, validity flags per element, replacing messages, and framework use.
- [Styling](docs/STYLING.md): tokens, parts, states, presets, and the shadcn adapter.
- [Native fields](docs/NATIVE-FIELDS.md): styled native input, textarea, and select.
- [Everyday controls](docs/EVERYDAY-CONTROLS.md): Checkbox, Radio Group, Toggle Group, Number Input, Password Input, and native buttons.
- [Formatted fields](docs/FORMATTED-FIELDS.md): IBAN and OTP presentation and editing.
- [Interaction elements](docs/INTERACTIONS.md): Toggle, Accordion, and Tabs.
- [Numeric choices](docs/NUMERIC-CHOICES.md): Slider, Range Slider, and Rating.
- [Select and Combobox](docs/SELECTION-CONTROLS.md): identifiers, queries, options, and popups.
- [Date Picker](docs/DATE-PICKER.md) and [Date Range Picker](docs/DATE-RANGE-PICKER.md): ISO values, parsing, and calendars.
- [Locale formatting](docs/LOCALE.md): inherited language, Intl dates and numbers, and week information.

**The project**

- [Project plan](docs/PLAN.md): status, open decisions, and next steps.
- [Architecture decisions](docs/adr/README.md): current rationale and browser evidence.
- [Playground design](docs/PLAYGROUND.md): layout and styling intent of the demo.
- [Glossary](GLOSSARY.md): shared field terminology.
- [Changelog](CHANGELOG.md): user-visible changes.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, adding an element, and deployment, and [SECURITY.md](SECURITY.md) to report a vulnerability. Repository conventions are in [AGENTS.md](AGENTS.md).

html+ is licensed under the [Apache License 2.0](LICENSE). Bundled dependencies are listed in the [third-party notices](THIRD_PARTY_NOTICES.txt).
