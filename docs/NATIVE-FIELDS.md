# Native fields

`h6-field` gives an existing native `<input>`, `<textarea>`, or `<select>` the html+ base appearance. The control remains in light DOM and owns its value and every native form behavior. The wrapper adds presentation only.

## Use a native control

Import the component module and place one native control directly inside each wrapper. Labels target the native control's ID; constraints and form attributes belong on that control too.

```html
<script type="module" src="./dist/src/index.js"></script>
<form>
  <label for="email">Email</label>
  <h6-field>
    <input id="email" name="email" type="email"
      autocomplete="email" required aria-describedby="email-help">
  </h6-field>
  <p id="email-help">Used for the receipt.</p>

  <label for="message">Message</label>
  <h6-field>
    <textarea id="message" name="message" rows="3"></textarea>
  </h6-field>

  <label for="reply">Reply via</label>
  <h6-field>
    <select id="reply" name="reply">
      <option value="email">Email</option>
      <option value="phone">Phone</option>
    </select>
  </h6-field>
  <button>Submit</button>
</form>
```

An implicit label can also contain the wrapper and its control. Keep label/helper layout in application CSS. Only direct child controls receive the base; a nested layout container is not traversed.

Read or set the native control's `.value`, `.defaultValue`, constraints, and validity methods. `h6-field` does not mirror those APIs or forward attributes. It is not form-associated and contributes no additional entry to `form.elements` or `FormData`. Native reset, disabled fieldsets, external `form` association, editing, selection, and undo remain browser-owned. Calling the wrapper's `.focus()` forwards to its first native control; normal label activation targets the native control directly.

## Theme and customize

The base uses the same `--hp-*` colors, radius, typography, control height, and inset shadow as the custom controls. It includes placeholder, focus, disabled, invalid, and forced-colors styles. The optional presets and shadcn adapter work on the wrapper and its native child. See the [styling guide](STYLING.md) for the shared token contract.

Use ordinary CSS selectors for details; there are no shadow parts for the native control:

```css
h6-field.quiet {
  --hp-control-height: 2.75rem;
}
h6-field.quiet > :is(input, textarea, select) {
  border-width: 0 0 2px;
  border-radius: 0;
  background-color: transparent;
  box-shadow: none;
}
```

The wrapper's shadow root contains a slot and scoped default styles. A slotted control remains in light DOM, so application CSS can still target it. Normal application declarations take precedence over the component's normal slotted defaults. This provides an editable base, not isolation from an application's existing global input styles.

Shadow DOM itself does not remove user-agent styling. Native editors inside a shadow root still have browser defaults; selectors from the page usually cannot reach those internals, while inherited properties and custom properties can cross the boundary. html+ sets the properties needed for its base explicitly rather than applying `all: unset` or a document-wide reset.

## Without JavaScript

Load the optional generated `native.css` to get the same base before registration or when JavaScript is unavailable:

```html
<link rel="stylesheet" href="./dist/native.css">
<label for="reference">Reference</label>
<h6-field>
  <input id="reference" name="reference" value="ORDER-1042">
</h6-field>
```

This stylesheet styles only controls directly inside `h6-field` and the opt-in `hp-button` family. It uses the `hp-native` cascade layer, so ordinary application CSS can override it. Unwrapped inputs are unchanged. The component and standalone stylesheet are generated from the same base rules. JavaScript is not needed for the native control's form behavior in either case.

## Boundaries

Text-like inputs, textarea, and select receive the base. Checkbox, radio, range, color, file, hidden, and button input types are excluded; wrapping them does not create a new html+ control. Use the dedicated html+ controls or native HTML for those interactions. A hidden control or wrapper stays hidden.

The native select arrow and popup remain platform-controlled. Native number, date, and time inputs keep browser formatting, stepping, and editor behavior; use `h6-number-input` or the date pickers when their additional behavior and locale contract are required. The wrapper does not add formatting or parsing.

Invalid borders follow native `:user-invalid`, or caller-supplied `aria-invalid="true"`. Applications still own error messages, accessible descriptions, and validation timing. Autofill hints remain on the original editor; physical-device autofill, password-manager combinations, and manual assistive-technology coverage remain unverified.

The [gallery](https://sebastian-software.github.io/htmlplus/styling.html#h6-field) compares Base and Underlined fields in Light/Dark. The playground includes native reference, message, and reply controls in its live FormData inspector.
