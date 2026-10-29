# Everyday form controls

Checkbox, Radio Group, Number Input, Password Input, and Toggle Group use Zag 1.46.0 behind form-associated custom elements. The optional native Button stylesheet supplies the same theme contract without replacing HTML's button semantics. All six have Base and styled examples in the gallery; appearance, palette, and surface depth remain independent.

## Checkbox and table selection

```html
<h6-checkbox name="notifications" value="email" checked>
  Email notifications
</h6-checkbox>
<h6-checkbox id="select-all" indeterminate aria-label="Select all rows"></h6-checkbox>
```

`.checked` and `.indeterminate` are independent booleans, matching the native checkbox model. `indeterminate` displays a dash and exposes a mixed state to assistive technology. It does not change submission: the configured `value` (default `on`) contributes an entry only while checked. There is no automatic third submitted value.

`checked` and `indeterminate` attributes declare defaults. `.defaultChecked` and `.defaultIndeterminate` expose them; reset restores both. Programmatic state changes are silent. User activation clears the mixed state and toggles the underlying checked state. A mixed checkbox is not automatically a three-step click cycle. `readonly` prevents activation while retaining focus; `required` requires checked, independently of the mixed display.

The playground's header checkbox has no name. The small table controller derives its mixed state from selectable rows and applies a select-all action to those rows. Only selected row IDs appear as repeated `selected` entries. The application owns whether “all” means a page, a filtered result, or a larger collection. The checkbox has no table or record knowledge.

An internal native checkbox provides interaction, focus, and accessible semantics; it is not a second submission owner or a light-DOM proxy.

## Radio Group

```html
<label for="frequency">Notification frequency</label>
<h6-radio-group id="frequency" name="frequency" value="weekly" required>
  <option value="daily" data-description="A short summary every morning.">Daily</option>
  <option value="weekly" data-description="One digest each Friday.">Weekly</option>
  <option value="instant" disabled>Instant (unavailable)</option>
</h6-radio-group>
```

`.value` and `.defaultValue` are strings. Only the selected enabled identifier contributes an entry; empty, unknown, or disabled selections contribute none. Direct child options declare nonempty identifiers, labels, optional descriptions, and disabled state. The first duplicate identifier wins. Updating or reordering options preserves retained interaction nodes.

Arrow keys select and focus an enabled option, wrapping at the boundaries. Left/Right follow the current direction; Up/Down follow document order. Space selects the focused radio. The group defaults to vertical layout; `orientation="horizontal"` lays choices out in a row. `dir="rtl"` is supported. Labels focus the current selection or first enabled option. Required state means an enabled choice must be selected.

Native radio inputs are local to the shadow root; only the host contributes the group's value to its outer form.

## Toggle Group

```html
<h6-toggle-group name="formats" value='["csv","json"]' multiple aria-label="Export formats">
  <option value="csv">CSV</option>
  <option value="json">JSON</option>
  <option value="xml">XML</option>
</h6-toggle-group>
```

`.value` and `.defaultValue` are string arrays in both modes; declarative defaults use a JSON array. Without `multiple`, at most the first enabled selection contributes an entry and the active option may be cleared. With `multiple`, each selected enabled identifier contributes a repeated entry under `name`; duplicates are removed and supplied selection order is retained. `required` requires at least one enabled selection.

Zag uses a radio group with checked items in single mode and a group of pressed buttons in multiple mode. Arrow keys move focus without committing selection; Space or Enter activates the focused item. Home/End move focus to the first/last enabled item. Layout defaults to horizontal; `orientation="vertical"` and RTL are supported. Options use the same label, description, and dynamic-update contract as Radio Group.

## Number Input

```html
<label for="seats">Seats</label>
<h6-number-input id="seats" name="seats" value="3" min="1" max="20" step="1" required></h6-number-input>
```

`.value` is a canonical numeric string, or an empty string for empty/unparseable text. Assign canonical strings through `.value`, or numbers through `.valueAsNumber`. `.displayValue` and `.input` expose the native editor and its raw localized text. Empty/unparseable text produces `NaN` for `.valueAsNumber`; a partial draft remains visible and blocks submission when invalid. The host contributes one string entry, including an empty string while unanswered.

`locale` controls parsing and formatting, overriding the nearest inherited HTML `lang`, with browser language as fallback. Invalid locale identifiers fall back to `en-US`. FormData uses a decimal point regardless of locale. Dynamic language changes reformat complete values from their previous numeric meaning; invalid drafts stay invalid until edited or replaced. See [Functional locale formatting](LOCALE.md).

`min`, `max`, and `step` are numeric properties and attributes. Bounds default to the safe integer limits; step defaults to one. A step is anchored at an explicit minimum or zero. Native validity distinguishes missing, unparseable, underflow, overflow, and step-mismatch states. Invalid configuration is a custom error. Typed out-of-range text remains visible and invalid; blur does not clamp it. Step actions stay within bounds. This is a number editor, not a currency or arbitrary-unit parser.

Arrow Up/Down and the +/- buttons use Zag stepping, including a held pointer press. Mouse-wheel changes are disabled. Native input/composition and undo remain with the editor; automatic machine input synchronization and normalized default-value binding are deliberately excluded. Formatting is only applied by explicit value assignment or step actions. Canonical serialization does not rewrite typed text.

`increment-label` and `decrement-label` override the step button names. The actual editor is outside Zag's input lookup so deferred synchronization cannot overwrite newer native edits or resets.

## Password Input

```html
<label for="password">Password</label>
<h6-password-input id="password" name="password" autocomplete="new-password"
  minlength="8" required show-label="Show password" hide-label="Hide password">
</h6-password-input>
```

The control retains one native editor. `.value`, `.defaultValue`, `.displayValue`, `.input`, `required`, `readonly`, `pattern`, `minlength`, and `maxlength` follow the shared text-field contract. No whitespace or case normalization is applied. Use `autocomplete="new-password"` for a new password; the default is `current-password`. Physical-device password-manager integration remains unverified.

`.visible` controls whether the editor displays text. The visibility button is keyboard reachable and has caller-overridable names through `show-label` and `hide-label`. Visibility changes preserve the selected range and do not emit value input/change events. User visibility changes emit `visibilitychange` with `{ visible }`. Reset, restoration, and successful form submission hide the password; a submission blocked by validation does not hide it. Disconnection removes the outer-form listener.

The playground uses a fictional password. Its value is intentionally shown in the FormData inspector; masking the editor does not change its submitted value. Remote verification, password policy, strength estimation, and authentication belong to the application.

## Native buttons

```html
<link rel="stylesheet" href="./dist/native.css">
<button class="hp-button" type="submit" name="action" value="save">Save</button>
<button class="hp-button" data-variant="outline" type="reset">Reset</button>
<button class="hp-button" data-variant="ghost" data-size="icon"
  aria-label="Add item" type="button">+</button>
```

`hp-button` styles actual native buttons. Variants are the default primary style, `secondary`, `outline`, `ghost`, and `destructive`. Sizes are the default, `sm`, `lg`, and `icon`. Use `aria-busy="true"` for a loading indicator; it does not prevent activation. The application must set `disabled` when activation should be blocked. Navigation can use a real anchor with the same class; `aria-disabled` does not disable an anchor.

The stylesheet uses `--hp-*`, the shadcn bridge, and the shared shadow roles. It is generated from the same TypeScript token helpers as the custom elements and needs no JavaScript at runtime. Standard submitter name/value, native validation, `form*` overrides, reset, and external `form` association stay with the browser. `new FormData(form)` has no activated submitter; use `new FormData(form, event.submitter)` when capturing a submit event and its action value. The Button gallery demonstrates that distinction.

## Shared contract and evidence

All five hosts support name/form association, external labels, disabled fieldsets, native validation, persistent custom errors, defaults/reset, silent property assignment, and state-restoration callbacks. User value changes emit one bubbling input/change pair for checkbox and group changes. Native text input events remain native; step actions emit one pair for each changed value. All internal interaction controls remain in shadow DOM and do not duplicate outer form entries.

`test/everyday-controls.spec.mjs` checks table aggregation, independent mixed/checked submission, keyboard groups, disabled/dynamic options, localized numeric values, undo, password selection and visibility, outer forms, reset/reconnects, Light/Dark, surfaces, mobile, text scaling, and native buttons without JavaScript. Real browser-history restoration, physical touch devices, password managers, and manual assistive-technology checks remain separate evidence gaps. Full Palamedes message integration remains planned.

Deferred components are tracked separately: [File Upload](https://github.com/sebastian-software/htmlplus/issues/2), [Color Picker](https://github.com/sebastian-software/htmlplus/issues/3), and [Tree View](https://github.com/sebastian-software/htmlplus/issues/4).
