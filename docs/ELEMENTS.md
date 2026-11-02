# Element reference

Generated from the running browser modules by `npm run docs:api`. Do not edit it by hand; `npm test` fails if it is out of date. Behavior, value formats, and events are described in each element's guide. Machine-readable data is in [`custom-elements.json`](../custom-elements.json).

Parts are the shadow parts present after rendering, including the open calendar for date elements. Options add `option`-related parts where the element renders them.

## `h6-field`

Shared base styling around a real light-DOM input, textarea, or select. [Guide](NATIVE-FIELDS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-field)

- **Submits through its host:** no
- **Attributes:** None
- **Properties:** None
- **Methods:** `focus`
- **Parts:** None

## `h6-switch`

On/off setting with a checkbox-like form value. [Guide](../README.md#current-value-contract) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-switch)

- **Submits through its host:** yes
- **Attributes:** `checked`, `disabled`, `required`, `value`
- **Properties:** `checked`, `defaultChecked`, `disabled`, `form`, `labels`, `name`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `reportValidity`, `setCustomValidity`
- **Parts:** `thumb`, `track`

## `h6-iban`

IBAN editor with readable groups, canonical submission, and format checks. [Guide](FORMATTED-FIELDS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-iban)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `disabled`, `inputmode`, `maxlength`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `name`, `readOnly`, `required`, `restorationState`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `input`

## `h6-bic`

BIC/SWIFT editor with uppercase submission and structure checks. [Guide](../README.md#current-value-contract) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-bic)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `disabled`, `inputmode`, `maxlength`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `name`, `readOnly`, `required`, `restorationState`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `input`

## `h6-otp`

One native verification-code editor with visual character slots. [Guide](FORMATTED-FIELDS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-otp)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `disabled`, `inputmode`, `length`, `maxlength`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `length`, `name`, `readOnly`, `required`, `restorationState`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `control`, `input`, `slot`, `slots`

## `h6-duration`

Elapsed-time notation that submits whole seconds. [Guide](../README.md#additional-value-contracts) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-duration)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `disabled`, `inputmode`, `max`, `maxlength`, `min`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `name`, `readOnly`, `required`, `restorationState`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `input`

## `h6-interval`

Two numeric boundaries with explicit form names and optional open ends. [Guide](../README.md#additional-value-contracts) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-interval)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `disabled`, `lower-label`, `lower-name`, `max`, `min`, `name`, `readonly`, `required`, `step`, `upper-label`, `upper-name`, `value`
- **Properties:** `defaultValue`, `disabled`, `form`, `labels`, `name`, `readOnly`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `input`, `lower-input`, `lower-label`, `separator`, `upper-input`, `upper-label`

## `h6-segmented`

Compact single selection using native radio inputs. [Guide](../README.md#additional-value-contracts) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-segmented)

- **Submits through its host:** yes
- **Attributes:** `aria-label`, `aria-labelledby`, `disabled`, `name`, `required`, `value`
- **Properties:** `defaultValue`, `disabled`, `form`, `labels`, `name`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `option`

## `h6-tags`

Add and remove tags that submit as repeated entries. [Guide](../README.md#current-value-contract) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-tags)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `disabled`, `name`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultValue`, `disabled`, `form`, `labels`, `name`, `readOnly`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `input`, `tokens`

## `h6-toggle`

Persistent pressed button with a checkbox-like form value. [Guide](INTERACTIONS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-toggle)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `disabled`, `pressed`, `required`, `value`
- **Properties:** `defaultPressed`, `disabled`, `form`, `labels`, `name`, `pressed`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `button`

## `h6-accordion`

Disclosure sections around ordinary form fields. [Guide](INTERACTIONS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-accordion)

- **Submits through its host:** no
- **Attributes:** `dir`, `disabled`, `heading-level`, `multiple`, `value`
- **Properties:** `disabled`, `multiple`, `value`
- **Methods:** None
- **Parts:** `content`, `heading`, `indicator`, `item`, `label`, `root`, `trigger`

## `h6-tabs`

Tabbed panels around ordinary form fields. [Guide](INTERACTIONS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-tabs)

- **Submits through its host:** no
- **Attributes:** `activation-mode`, `aria-label`, `dir`, `disabled`, `orientation`, `value`
- **Properties:** `activationMode`, `disabled`, `orientation`, `value`
- **Methods:** None
- **Parts:** `list`, `panel`, `panels`, `root`, `selected-tab`, `tab`

## `h6-slider`

One bounded number chosen by pointer or keyboard. [Guide](NUMERIC-CHOICES.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-slider)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `lower-label`, `lower-name`, `max`, `min`, `name`, `orientation`, `readonly`, `required`, `step`, `upper-label`, `upper-name`, `value`
- **Properties:** `defaultValue`, `defaults`, `disabled`, `form`, `labels`, `max`, `min`, `name`, `orientation`, `readOnly`, `required`, `step`, `validationMessage`, `validity`, `value`, `values`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `range`, `root`, `thumb`, `track`, `value-text`

## `h6-range-slider`

Two ordered boundaries with explicitly named form entries. [Guide](NUMERIC-CHOICES.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-range-slider)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `lower-label`, `lower-name`, `max`, `min`, `name`, `orientation`, `readonly`, `required`, `step`, `upper-label`, `upper-name`, `value`
- **Properties:** `defaultValue`, `defaults`, `disabled`, `form`, `labels`, `max`, `min`, `name`, `orientation`, `readOnly`, `required`, `step`, `validationMessage`, `validity`, `value`, `values`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `lower-thumb`, `range`, `root`, `thumb`, `track`, `upper-thumb`, `value-text`

## `h6-rating`

Clearable whole score with a separate hover preview. [Guide](NUMERIC-CHOICES.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-rating)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `count`, `dir`, `disabled`, `readonly`, `required`, `value`
- **Properties:** `count`, `defaultValue`, `disabled`, `form`, `labels`, `name`, `readOnly`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `clear`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `clear-button`, `control`, `icon`, `item`, `label`, `root`, `value-text`

## `h6-select`

Single selection from supplied options in a top-layer listbox. [Guide](SELECTION-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-select)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `name`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultValue`, `disabled`, `form`, `labels`, `name`, `placeholder`, `queryText`, `readOnly`, `required`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `clear`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `clear-button`, `content`, `control`, `empty`, `indicator`, `option`, `option-indicator`, `option-label`, `positioner`, `root`, `selected-option`, `trigger`, `value-text`

## `h6-combobox`

Searchable selection that keeps query and selected identifier apart. [Guide](SELECTION-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-combobox)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `name`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultValue`, `disabled`, `form`, `labels`, `name`, `placeholder`, `query`, `queryText`, `readOnly`, `required`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `clear`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `clear-button`, `content`, `control`, `empty`, `indicator`, `input`, `option`, `option-indicator`, `option-label`, `positioner`, `root`, `selected-option`, `trigger`

## `h6-date-picker`

Localized date editor and calendar with one ISO form entry. [Guide](DATE-PICKER.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-date-picker)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `lang`, `locale`, `max`, `min`, `name`, `placeholder`, `readonly`, `required`, `value`
- **Properties:** `defaultValue`, `disabled`, `displayValue`, `form`, `labels`, `locale`, `max`, `min`, `name`, `placeholder`, `readOnly`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `clear`, `focus`, `hidePicker`, `reportValidity`, `setCustomValidity`, `showPicker`
- **Parts:** `clear-button`, `content`, `control`, `day`, `day-view`, `grid`, `input`, `month`, `month-view`, `navigation`, `next-button`, `positioner`, `prev-button`, `root`, `today`, `trigger`, `view`, `view-button`, `weekday`, `year`, `year-view`

## `h6-date-range-picker`

Two native editors and a range calendar with two named ISO entries. [Guide](DATE-RANGE-PICKER.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-date-range-picker)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `end-label`, `end-name`, `lang`, `locale`, `max`, `min`, `name`, `placeholder`, `readonly`, `required`, `start-label`, `start-name`, `value`
- **Properties:** `defaultValue`, `disabled`, `displayValue`, `endName`, `form`, `labels`, `locale`, `max`, `min`, `name`, `placeholder`, `readOnly`, `required`, `startName`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `clear`, `focus`, `hidePicker`, `reportValidity`, `setCustomValidity`, `showPicker`
- **Parts:** `clear-button`, `content`, `control`, `day`, `day-view`, `end-field`, `end-input`, `end-label`, `grid`, `input`, `month`, `month-view`, `navigation`, `next-button`, `positioner`, `prev-button`, `root`, `start-field`, `start-input`, `start-label`, `today`, `trigger`, `view`, `view-button`, `weekday`, `year`, `year-view`

## `h6-checkbox`

Native checked and mixed states with checkbox-like submission. [Guide](EVERYDAY-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-checkbox)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `checked`, `disabled`, `indeterminate`, `readonly`, `required`, `value`
- **Properties:** `checked`, `defaultChecked`, `defaultIndeterminate`, `disabled`, `form`, `indeterminate`, `labels`, `name`, `readOnly`, `required`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `indicator`, `input`, `label`, `root`

## `h6-radio-group`

One supplied identifier, with descriptions and disabled options. [Guide](EVERYDAY-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-radio-group)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `name`, `orientation`, `required`, `value`
- **Properties:** `defaultValue`, `defaults`, `disabled`, `form`, `labels`, `multiple`, `name`, `orientation`, `required`, `selected`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `assign`, `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `control`, `description`, `input`, `label`, `option`, `root`, `selected-option`

## `h6-toggle-group`

Single or multiple selection with repeated form entries. [Guide](EVERYDAY-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-toggle-group)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `dir`, `disabled`, `multiple`, `name`, `orientation`, `required`, `value`
- **Properties:** `defaultValue`, `defaults`, `disabled`, `form`, `labels`, `multiple`, `name`, `orientation`, `required`, `selected`, `validationMessage`, `validity`, `value`, `willValidate`
- **Methods:** `assign`, `checkValidity`, `focus`, `reportValidity`, `setCustomValidity`
- **Parts:** `description`, `label`, `option`, `root`, `selected-option`

## `h6-number-input`

Localized numeric editing, canonical submission, and stepping. [Guide](EVERYDAY-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-number-input)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `decrement-label`, `dir`, `disabled`, `increment-label`, `inputmode`, `lang`, `locale`, `max`, `maxlength`, `min`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `step`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `locale`, `max`, `min`, `name`, `readOnly`, `required`, `restorationState`, `step`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `valueAsNumber`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `control`, `decrement-trigger`, `increment-trigger`, `input`

## `h6-password-input`

Native password editing and a visibility button. [Guide](EVERYDAY-CONTROLS.md) | [Styling recipe](https://sebastian-software.github.io/htmlplus/demo/styling.html#h6-password-input)

- **Submits through its host:** yes
- **Attributes:** `aria-describedby`, `aria-label`, `aria-labelledby`, `autocomplete`, `disabled`, `hide-label`, `inputmode`, `maxlength`, `minlength`, `name`, `pattern`, `placeholder`, `readonly`, `required`, `show-label`, `value`
- **Properties:** `defaultAutocomplete`, `defaultDisplayValue`, `defaultInputMode`, `defaultPattern`, `defaultValue`, `dirty`, `disabled`, `displayValue`, `form`, `input`, `labels`, `name`, `readOnly`, `required`, `restorationState`, `upgradedProperties`, `validationMessage`, `validity`, `value`, `visible`, `willValidate`
- **Methods:** `checkValidity`, `editorLength`, `focus`, `markDirty`, `normalizeValue`, `presentValue`, `refresh`, `reportValidity`, `setCustomValidity`, `validateValue`
- **Parts:** `control`, `indicator`, `input`, `visibility-trigger`
