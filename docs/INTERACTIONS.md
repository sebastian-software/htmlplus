# Toggle, Accordion, and Tabs

These three elements use Zag 1.46.0 through its official vanilla adapter. Their public surface is ordinary custom elements and DOM events. Import the built `dist/src/index.js` to register them, or import each class from its individual module and register it explicitly. Keep the complete built `dist/` tree available: the browser modules share bundled chunks.

## Toggle: a form field with a pressed state

```html
<form>
  <h6-toggle name="priority" value="yes">Priority handling</h6-toggle>
  <button>Submit</button>
</form>
```

The shadow control is a native `type="button"` with `aria-pressed`. Enter, Space, clicking the button, an external label, and `host.click()` activate it. Activating it does not submit the form. Keep its visible label stable between states.

- `.pressed` is the current boolean state. The `pressed` attribute and `.defaultPressed` declare the reset default. Changing a default after user/programmatic editing does not overwrite the current state.
- `.value` is the submitted string, defaulting to `on`. A named pressed toggle contributes that value once; an unpressed toggle contributes no entry.
- `name`, `form`, `disabled`, `required`, disabled fieldsets, reset, labels, and explicit custom validity follow the form-associated host contract. `required` requires the pressed state. Explicit custom errors persist until cleared.
- User activation emits one bubbling, composed `input` event followed by one `change` event on the host. Assignments, reset, and restoration do not emit user events.
- The public part is `button`; `:state(pressed)` exposes the current state. The default attribute `[pressed]` describes a default, not a styling hook for the live state.

This is a pressed button, while `h6-switch` represents an on/off setting with switch semantics.

## Shared section markup

Accordion and Tabs accept direct light-DOM `<section>` children. Give each a unique, nonempty `data-value` and a readable `data-label`. The label defaults to the value. `data-disabled` prevents activating that section through its header/tab; it does not disable its contained fields. The component manages the sections' slot names. Their content stays in its original DOM and form.

Dynamic additions, removals, ordering, labels, values, and disabled states are observed. The first section for a duplicate value participates in navigation; missing/duplicate-value sections remain visible as unmanaged fallback content. Avoid these malformed configurations. The original inputs are never cloned or rebuilt.

Neither component is form-associated. A host `name` does not submit section identifiers. Panel visibility does not disable or omit its fields. A form reset restores the fields through their native/form-associated mechanisms and leaves view state in place. Set `.value` when the application wants to reset the visible section as well.

## Accordion: disclosure sections

```html
<h6-accordion value='["delivery"]'>
  <section data-value="delivery" data-label="Delivery">
    <label>Delivery note <input name="delivery_note" value="Ring the bell"></label>
  </section>
  <section data-value="gift" data-label="Gift">
    <label>Gift message <input name="gift_message" value="Enjoy your gift!"></label>
  </section>
</h6-accordion>
```

`.value` is an array of expanded identifiers. The `value` attribute accepts a JSON string array and updates current view state when changed. Unknown identifiers and duplicates are removed. One section can open by default; add `multiple` to allow several. Every section can close, including the last open section. The initial default without `value` is all closed.

Headings contain native buttons linked to their content regions inside one shadow root. Enter/Space expand or collapse; Up/Down and Home/End move header focus, skipping disabled headers. `heading-level` controls the heading's accessible level from 1 through 6, defaulting to 3. `disabled` prevents header activation without disabling the content's fields. Programmatic `.value` assignment can reveal disabled sections.

User changes emit `valuechange`, a bubbling, composed `CustomEvent` whose `detail.value` is a new string array. Programmatic changes do not emit it. `multiple`, `disabled`, and `.value` are properties; their corresponding attributes can also be changed declaratively.

Parts: `root`, `item`, `heading`, `trigger`, `label`, `indicator`, and `content`.

## Tabs: one visible panel

```html
<h6-tabs value="profile" aria-label="Contact details">
  <section data-value="profile" data-label="Profile">
    <label>Display name <input name="display_name" value="Ada Lovelace"></label>
  </section>
  <section data-value="receipts" data-label="Receipts">
    <label>Receipt email <input name="receipt_email" type="email" value="ada@example.test"></label>
  </section>
</h6-tabs>
```

`.value` is the selected identifier; changing the `value` attribute updates it. An unknown/missing selection falls back to the first enabled section, then the first section if all are disabled. An empty component has an empty string value. Programmatic selection can reveal a disabled section. `disabled` prevents tab activation and does not disable contained fields.

The tablist uses the host's `aria-label`, defaulting to "Sections". Give it an appropriate name. Tabs and panels reference each other within the shadow root; the selected tab exposes the extra `selected-tab` part.

- Horizontal Left/Right and Home/End move through enabled tabs. `dir="rtl"` reverses horizontal arrow direction.
- `orientation="vertical"` uses Up/Down. `.orientation` exposes the same setting.
- Automatic activation selects on keyboard navigation. `activation-mode="manual"` moves focus first and selects with Enter/Space or click. `.activationMode` exposes the same setting.
- Selected panels are keyboard reachable; their ordinary controls retain their natural tab order.
- User selection emits `valuechange` with `detail.value` as a string. Assignments and automatic invalid-field revelation do not emit user events.

Parts: `root`, `list`, `tab`, `selected-tab`, `panels`, and `panel`.

## Validation, styling, and evidence

Native interactive validation reveals the first invalid field's section before the browser focuses it, including nested Tabs/Accordion and form-associated custom fields. If other invalid fields remain in hidden sibling sections during the same validation task, their native validation UI is suppressed to avoid invisible focus targets; the fields remain invalid and continue to block submission. The next validation attempt can reveal them after the earlier field is fixed. Programmatically closing a section that contains focus returns focus to its header/tab when available.

All three elements include a neutral base, inherited `--hp-*` tokens, and deliberate CSS parts. The styling gallery includes Pill, Boxed, and Underline variations with the exact CSS used by their previews. The examples' labels and native inputs are application content: style them with ordinary CSS, as demonstrated by `.native-field` in [demo/styles.css](../demo/styles.css). They are not private shadow editors or component parts.

The [browser checks](../test/interactions.spec.mjs) cover keyboard modes, RTL, vertical tabs, actual FormData, defaults/errors/labels, fieldset disabling, nested invalid fields, multiple invalid panels, native undo, dynamic sections, cleanup/reconnection, built-in styles, text scaling, and mobile recipe layout. Chromium and WebKit are the locally available engines. Screen-reader usability, physical touch devices, and real browser history restoration remain separate evidence tasks.

Slider, Range Slider, and Rating use the same Zag/ElementInternals boundary. See [numeric choices](NUMERIC-CHOICES.md) for their value, event, label, and styling contracts.
