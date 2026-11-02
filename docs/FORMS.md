# Forms and validation

The twenty-one form controls are form-associated custom elements, so they use the same validation API as native fields: `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`. An invalid control blocks submission, and `form.reportValidity()` or a submit attempt shows the browser's validation UI.

Accordion, Tabs, and Native Field have no validity of their own. Accordion and Tabs reveal the section holding the first invalid field; see the [interaction guide](INTERACTIONS.md#validation-styling-and-evidence). Inside `h6-field`, the native control validates itself and its invalid border follows `:user-invalid` or `aria-invalid="true"`; see [native fields](NATIVE-FIELDS.md#boundaries).

## When errors appear

A control is invalid as soon as its value is, but it doesn't look invalid straight away. The host gets a `data-touched` attribute when focus leaves it or when validation fails. Form reset removes the attribute.

Built-in destructive styling and the inner control's `aria-invalid` both wait for `data-touched`. Use the same condition for your own styles:

```css
h6-iban[data-touched]:invalid::part(input) {
  border-color: var(--hp-destructive);
}
```

Plain `:invalid` matches from the first render, including an empty required field.

## Show a message

Controls don't render error text. Read `.validationMessage` and put it where your layout needs it:

```html
<label for="account">IBAN</label>
<h6-iban id="account" name="iban" required aria-describedby="account-error"></h6-iban>
<p id="account-error"></p>
```

```js
const form = document.querySelector("form");
const show = (field, message) => {
  const output = field.id && document.getElementById(`${field.id}-error`);
  if (output) output.textContent = message;
};
const update = ({ target }) => show(target, target.hasAttribute("data-touched") ? target.validationMessage : "");

form.addEventListener("input", update);
form.addEventListener("focusout", update);
// invalid doesn't bubble, and this capture listener runs before the host sets data-touched.
form.addEventListener("invalid", ({ target }) => show(target, target.validationMessage), true);
form.addEventListener("reset", () => {
  for (const output of form.querySelectorAll('[id$="-error"]')) output.textContent = "";
});
```

`aria-describedby` keeps the message available to assistive technology. Controls with a shadow editor copy the referenced text to that editor as its accessible description and update it when the text changes. Switch and Segmented leave the attribute on the host. Calling `preventDefault()` on `invalid` suppresses the browser's own message UI, as with native fields.

Text fields also have a `.detail` string: a neutral English hint such as "An 8- or 11-character business identifier." The playground shows it when there is no error to display. It exists only on text fields and isn't translated.

## Validity flags

Custom errors take precedence over every other flag. While one is set, the other flags read `false`.

| Element | Flags besides `customError` |
| --- | --- |
| `h6-iban`, `h6-bic` | `valueMissing`, `patternMismatch` (format and check digits), `tooShort`, `tooLong` |
| `h6-otp`, `h6-password-input` | `valueMissing`, `patternMismatch`, `tooShort`, `tooLong` |
| `h6-duration` | `valueMissing`, `badInput`, `rangeUnderflow`, `rangeOverflow`, `patternMismatch`, `tooShort`, `tooLong` |
| `h6-number-input` | `valueMissing`, `badInput`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch` |
| `h6-interval` | `valueMissing`, `badInput`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, from its native inputs |
| `h6-date-picker`, `h6-date-range-picker` | `valueMissing`, `badInput`, `rangeUnderflow`, `rangeOverflow` |
| `h6-switch`, `h6-checkbox`, `h6-toggle`, `h6-tags`, `h6-rating` | `valueMissing` |
| `h6-segmented`, `h6-radio-group`, `h6-toggle-group`, `h6-select`, `h6-combobox` | `valueMissing` |
| `h6-slider`, `h6-range-slider` | None; a valid slider always has a number, so `required` adds nothing |

Some conditions report `customError` without an application setting one, and `setCustomValidity("")` doesn't clear them:

- Invalid configuration on Number Input, Slider, Range Slider, Date Picker, and Date Range Picker, such as inverted bounds or an invalid date `locale`.
- A lower Interval boundary above the upper one.
- A start date after the end date.

A partial date range reports `valueMissing` even without `required`, because both dates are needed once either is present.

Text fields and Interval report no errors at all while `readonly`, including custom errors, in line with native read-only fields.

## Custom and server errors

`setCustomValidity(message)` works as on a native field: the error stays until you clear it with `setCustomValidity("")`, including across form reset. Clear it when the person edits the field:

```js
const field = form.elements.iban;
field.setCustomValidity("This account is already registered.");
field.reportValidity();
field.addEventListener("input", () => field.setCustomValidity(""), { once: true });
```

Clearing a custom error doesn't clear format errors. They come back as soon as the custom error is gone, so an invalid IBAN stays invalid.

## Replace the English messages

Built-in messages are hardcoded US English, and no attribute or property replaces them. Interval is the exception for its native-input errors, which carry the browser's own message; its ordering message is still English.

To translate, read the flags and supply your own text through `setCustomValidity`. Because a custom error hides the other flags, clear it before reading them:

```js
const messages = {
  valueMissing: translate("required"),
  patternMismatch: translate("format"),
  badInput: translate("unreadable"),
};

function localize(field) {
  field.setCustomValidity("");
  const flag = Object.keys(messages).find(name => field.validity[name]);
  if (flag) field.setCustomValidity(messages[flag]);
}
```

`translate` stands for your own message lookup. Run `localize` on load and on each `input`. Programmatic changes emit no user events, so also run it after assigning a value, after changing a constraint, and after a form reset. A reset listener needs a task delay, because the `reset` event fires before controls restore their defaults.

Invalid configuration can't be replaced this way, but it signals a markup problem to fix rather than a message for the person filling in the form. Interface labels, such as Clear, are also English; [locale formatting](LOCALE.md) describes what is and isn't localized.

## Use with a framework

html+ has no framework adapters, and the project's tests don't exercise any framework. These rules follow from the elements themselves, and apply wherever you create them:

- **Attributes declare defaults; properties hold current state.** A `value` attribute sets the reset default, and it updates the current value only until a user edit or property assignment. Set `.value` for controlled updates.
- **Some values are not strings.** Tags, Toggle Group, Accordion, Interval, Range Slider, and Date Range Picker take arrays through `.value`, and a JSON array in the `value` attribute. Slider and Rating take numbers through `.value`. See the [element reference](ELEMENTS.md).
- **Boolean attributes work by presence.** `disabled="false"` still disables. Remove the attribute, or set the property, such as `.disabled = false`.
- **Assignment order is safe.** Value and state properties assigned before the element upgrades are applied when it connects.
- **Standard events report user changes.** Read the new state from `input` and `change`, which bubble and are composed, so one listener on the form covers its controls. Assigning a property emits nothing, so a controlled update can't loop through these events.
- **Two elements add their own events.** Accordion and Tabs emit a bubbling, composed `valuechange` with `detail.value`. Password Input emits `visibilitychange` with `detail.visible`, only on the host; it doesn't bubble.
- **Forms read values directly.** `new FormData(form)` includes each control's entries, so a framework doesn't need its own hidden inputs.
- **Types:** the build emits declarations, and `dist/src/index.d.ts` adds the elements to `HTMLElementTagNameMap`. It has no JSX typings.
