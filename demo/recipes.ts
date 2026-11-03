export interface StylingRecipe {
  element: string;
  title: string;
  description: string;
  label: string;
  variant: string;
  className: string;
  markup: string;
  css: string;
  parts: string[];
  selectors?: string[];
  field?: boolean;
}

/** Trusted, static authoring examples. This CSS is both shown and used by the previews. */
export const recipes: readonly StylingRecipe[] = [
  {
    element: "hplus-field",
    title: "Native Field",
    label: "Native HTML controls",
    field: false,
    variant: "Underlined fields",
    className: "field-underlined",
    description:
      "Wrap a real input, textarea, or select. The wrapper supplies base styles; native controls retain labels, autocomplete, validation, editing, reset, and FormData. Optional native.css also works without JavaScript.",
    markup: `<label class="native-field">Text field<hplus-field><input name="reference" value="ORDER-1042" placeholder="Reference"></hplus-field></label>
<label class="native-field">Message<hplus-field><textarea name="message" rows="3">Leave the parcel at reception.</textarea></hplus-field></label>
<label class="native-field">Reply via<hplus-field><select name="reply_via"><option value="email" selected>Email</option><option value="phone">Phone</option></select></hplus-field></label>`,
    parts: [],
    selectors: ["hplus-field > input", "hplus-field > textarea", "hplus-field > select"],
    css: `hplus-field.field-underlined > :is(input, textarea, select) {
  border-width: 0 0 2px;
  border-radius: 0;
  background-color: transparent;
  box-shadow: none;
}
hplus-field.field-underlined { --hp-control-height: 2.75rem; }`,
  },
  {
    element: "hplus-checkbox",
    title: "Checkbox",
    label: "Notification choices",
    field: false,
    variant: "Outlined check",
    className: "checkbox-outlined",
    description:
      "Native checked and indeterminate states are independent. A mixed state displays a dash; checked determines form contribution.",
    markup: `<hplus-checkbox name="notifications" value="email" checked>Email notifications</hplus-checkbox>
<hplus-checkbox indeterminate aria-label="Some notifications selected">Some selected</hplus-checkbox>`,
    parts: ["root", "input", "control", "indicator", "label"],
    css: `hplus-checkbox.checkbox-outlined::part(control) { border-radius: 50%; width: 1.25rem; height: 1.25rem; box-shadow: none; }
hplus-checkbox.checkbox-outlined::part(label) { font-weight: 600; }`,
  },
  {
    element: "hplus-radio-group",
    title: "Radio Group",
    label: "Notification frequency",
    variant: "Choice cards",
    className: "radio-cards",
    description:
      "Choose one supplied identifier with native radio keys. Descriptions and disabled options stay with their choices.",
    markup: `<hplus-radio-group name="frequency" value="weekly" required>
  <option value="daily" data-description="A short summary every morning.">Daily</option>
  <option value="weekly" data-description="One digest each Friday.">Weekly</option>
  <option value="instant" disabled>Instant (unavailable)</option>
</hplus-radio-group>`,
    parts: ["root", "option", "selected-option", "input", "control", "label", "description"],
    css: `hplus-radio-group.radio-cards::part(option) { padding: .75rem; border: 1px solid var(--hp-input, #d4d4d4); border-radius: var(--hp-radius, .625rem); }
hplus-radio-group.radio-cards::part(selected-option) { border-color: var(--hp-primary, #171717); background: var(--hp-muted, #f5f5f5); }`,
  },
  {
    element: "hplus-number-input",
    title: "Number Input",
    label: "Seats",
    variant: "Tabular number",
    className: "number-tabular",
    description:
      "A native editor keeps its draft and undo. Zag handles arrow keys and step buttons; FormData receives a canonical number.",
    markup: '<hplus-number-input name="seats" value="3" min="1" max="20" step="1" required></hplus-number-input>',
    parts: ["control", "input", "increment-trigger", "decrement-trigger"],
    css: `hplus-number-input.number-tabular::part(input) { font-variant-numeric: tabular-nums; font-weight: 600; }
hplus-number-input.number-tabular::part(control) { box-shadow: none; background: var(--hp-muted, #f5f5f5); }`,
  },
  {
    element: "hplus-password-input",
    title: "Password Input",
    label: "Demo password",
    variant: "Underlined password",
    className: "password-underlined",
    description:
      "A single native password editor with an accessible visibility button. The example contains a fictional value; visibility does not change submission.",
    markup:
      '<hplus-password-input name="password" value="Demo-only-42!" autocomplete="new-password" minlength="8" required></hplus-password-input>',
    parts: ["control", "input", "visibility-trigger", "indicator"],
    css: `hplus-password-input.password-underlined::part(control) { border-width: 0 0 1px; border-radius: 0; box-shadow: none; background: transparent; }
hplus-password-input.password-underlined::part(visibility-trigger) { border-radius: 50%; }`,
  },
  {
    element: "hplus-toggle-group",
    title: "Toggle Group",
    label: "Export formats",
    variant: "Joined toggles",
    className: "toggles-joined",
    description:
      "Select multiple values or one optional value. Each selected identifier contributes one entry under the same name.",
    markup: `<hplus-toggle-group name="formats" value='["csv","json"]' multiple>
  <option value="csv">CSV</option><option value="json">JSON</option><option value="xml">XML</option>
</hplus-toggle-group>`,
    parts: ["root", "option", "selected-option", "label", "description"],
    css: `hplus-toggle-group.toggles-joined::part(root) { gap: 0; }
hplus-toggle-group.toggles-joined::part(option) { border-radius: 0; box-shadow: none; }
hplus-toggle-group.toggles-joined::part(selected-option) { text-decoration: underline; text-underline-offset: .2em; }`,
  },
  {
    element: "button",
    title: "Button",
    label: "Native action buttons",
    field: false,
    variant: "Pill buttons",
    className: "button-pill",
    description:
      "Import dist/native.css. Real buttons retain submitter, name/value, validation, reset, and external form behavior without JavaScript.",
    markup: `<button class="hp-button" type="submit" name="action" value="save">Save example</button>
<button class="hp-button" data-variant="outline" type="reset">Reset</button>
<button class="hp-button" data-variant="secondary" type="button">Secondary</button>
<button class="hp-button" data-variant="ghost" type="button">Ghost</button>
<button class="hp-button" data-variant="destructive" type="button">Delete</button>
<button class="hp-button" aria-busy="true" disabled type="button">Saving</button>
<button class="hp-button" data-variant="outline" data-size="icon" aria-label="Add example" type="button">+</button>`,
    parts: [],
    css: `.hp-button.button-pill { border-radius: 999px; }
.hp-button.button-pill:not([data-size=icon]) { padding-inline: 1.25rem; }`,
  },
  {
    element: "hplus-date-range-picker",
    title: "Date Range Picker",
    label: "Travel period",
    variant: "Outlined range",
    className: "date-range-outlined",
    description:
      "Two native editors and one Zag calendar submit explicitly named date boundaries. Preview a range without changing its form values.",
    markup: `<hplus-date-range-picker name="period" value='["2026-10-28","2026-11-03"]' min="2026-10-01" max="2027-12-31" required></hplus-date-range-picker>`,
    parts: [
      "root",
      "control",
      "input",
      "start-field",
      "end-field",
      "start-input",
      "end-input",
      "start-label",
      "end-label",
      "trigger",
      "clear-button",
      "positioner",
      "content",
      "navigation",
      "prev-button",
      "view-button",
      "next-button",
      "view",
      "day-view",
      "month-view",
      "year-view",
      "grid",
      "weekday",
      "day",
      "selected-day",
      "today",
      "month",
      "year",
      "range-start",
      "range-end",
      "in-range",
      "preview-day",
    ],
    css: `hplus-date-range-picker.date-range-outlined::part(control) {
  background: var(--hp-muted, #f5f5f5);
  box-shadow: none;
}
hplus-date-range-picker.date-range-outlined::part(content) {
  border-width: 2px;
}
hplus-date-range-picker.date-range-outlined::part(in-range) {
  border-radius: .375rem;
}
hplus-date-range-picker.date-range-outlined::part(range-start),
hplus-date-range-picker.date-range-outlined::part(range-end) {
  outline: 1px solid var(--hp-primary, #171717);
  outline-offset: 2px;
}`,
  },
  {
    element: "hplus-date-picker",
    title: "Date Picker",
    label: "Delivery date",
    variant: "Framed calendar",
    className: "date-framed",
    description:
      "A native text editor and Zag calendar share one date-only form value. Localized text stays separate from YYYY-MM-DD submission.",
    markup:
      '<hplus-date-picker name="delivery_date" value="2026-10-28" min="2026-10-01" max="2027-12-31" required></hplus-date-picker>',
    parts: [
      "root",
      "control",
      "input",
      "trigger",
      "clear-button",
      "positioner",
      "content",
      "navigation",
      "prev-button",
      "view-button",
      "next-button",
      "view",
      "day-view",
      "month-view",
      "year-view",
      "grid",
      "weekday",
      "day",
      "selected-day",
      "today",
      "month",
      "year",
    ],
    css: `hplus-date-picker.date-framed::part(control) {
  background: var(--hp-muted, #f5f5f5);
  box-shadow: none;
}
hplus-date-picker.date-framed::part(content) {
  border-radius: var(--hp-radius, .625rem);
  border-width: 2px;
}
hplus-date-picker.date-framed::part(selected-day) {
  border-radius: 999px;
}
hplus-date-picker.date-framed::part(weekday) {
  font-weight: 600;
}`,
  },
  {
    element: "hplus-select",
    title: "Select",
    label: "Shipping method",
    variant: "Quiet surface",
    className: "select-quiet",
    description: "A Zag listbox selects a supplied identifier. Its top-layer popup shares inherited theme tokens.",
    markup: `<hplus-select name="shipping" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
  <option value="pickup" disabled>Pickup (unavailable)</option>
</hplus-select>`,
    parts: [
      "root",
      "control",
      "trigger",
      "value-text",
      "indicator",
      "clear-button",
      "positioner",
      "content",
      "option",
      "selected-option",
      "option-label",
      "option-indicator",
      "empty",
    ],
    css: `hplus-select.select-quiet::part(control) {
  background: var(--hp-muted, #f5f5f5);
  box-shadow: none;
}
hplus-select.select-quiet::part(content) {
  padding: .5rem;
}
hplus-select.select-quiet::part(selected-option) {
  font-weight: 600;
}`,
  },
  {
    element: "hplus-combobox",
    title: "Combobox",
    label: "Destination country",
    variant: "Underlined search",
    className: "combobox-underlined",
    description:
      "Search supplied labels and choose an identifier. Editing clears the old selection; free text never submits as a country.",
    markup: `<hplus-combobox name="country" value="DE" placeholder="Search countries…" required>
  <option value="AT">Austria</option>
  <option value="DE">Germany</option>
  <option value="NL">Netherlands</option>
  <option value="US">United States</option>
</hplus-combobox>`,
    parts: [
      "root",
      "control",
      "input",
      "trigger",
      "indicator",
      "clear-button",
      "positioner",
      "content",
      "option",
      "selected-option",
      "option-label",
      "option-indicator",
      "empty",
    ],
    css: `hplus-combobox.combobox-underlined::part(control) {
  border-width: 0 0 1px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}
hplus-combobox.combobox-underlined::part(content) {
  border-radius: var(--hp-radius, .625rem);
}
hplus-combobox.combobox-underlined::part(selected-option) {
  font-weight: 600;
}`,
  },
  {
    element: "hplus-slider",
    title: "Slider",
    label: "Output level",
    variant: "Slim rail",
    className: "slider-slim",
    description:
      "A single Zag thumb submits one number. Theme its colors globally or restyle its track and thumb parts.",
    markup: '<hplus-slider name="level" value="35" min="0" max="100" step="5"></hplus-slider>',
    parts: ["root", "value-text", "control", "track", "range", "thumb"],
    css: `hplus-slider.slider-slim::part(track) {
  height: 2px;
  top: calc(50% - 1px);
}
hplus-slider.slider-slim::part(thumb) {
  border-width: 1px;
  box-shadow: none;
}`,
  },
  {
    element: "hplus-range-slider",
    title: "Range Slider",
    label: "Price filter (USD)",
    variant: "Square handles",
    className: "range-square",
    description:
      "Two independently labeled thumbs keep their identities. The form receives two explicit boundary entries.",
    markup: '<hplus-range-slider name="price" value="[100,350]" min="0" max="500" step="10"></hplus-range-slider>',
    parts: ["root", "value-text", "control", "track", "range", "thumb", "lower-thumb", "upper-thumb"],
    css: `hplus-range-slider.range-square::part(track) {
  border-radius: 0;
}
hplus-range-slider.range-square::part(thumb) {
  border-radius: 4px;
  border-width: 1px;
  box-shadow: none;
}`,
  },
  {
    element: "hplus-rating",
    title: "Rating",
    label: "Experience rating",
    variant: "Outlined score",
    className: "rating-outlined",
    description:
      "Hover is a preview, not a submitted score. Style each item and its committed selected-item part independently.",
    markup: '<hplus-rating name="rating" value="4"></hplus-rating>',
    parts: ["root", "label", "control", "item", "selected-item", "icon", "clear-button", "value-text"],
    css: `hplus-rating.rating-outlined::part(item) {
  border-color: var(--hp-input, #d4d4d4);
}
hplus-rating.rating-outlined::part(selected-item) {
  background: var(--hp-primary, #171717);
  color: var(--hp-primary-foreground, #fafafa);
}
hplus-rating.rating-outlined::part(icon) {
  fill: none;
  stroke-width: 2;
}`,
  },
  {
    element: "hplus-toggle",
    title: "Toggle",
    label: "Priority handling",
    variant: "Pill",
    className: "toggle-pill",
    description:
      "A pressed button submits one value. Restyle its public button part; :state(pressed) follows the same state.",
    markup: '<hplus-toggle name="priority" value="yes" pressed>Priority handling</hplus-toggle>',
    parts: ["button"],
    css: `hplus-toggle.toggle-pill::part(button) {
  border-radius: 999px;
  padding-inline: 1rem;
}
hplus-toggle.toggle-pill:state(pressed)::part(button) {
  background: var(--hp-muted, #f5f5f5);
  border-color: var(--hp-primary, #171717);
  color: var(--hp-primary, #171717);
}`,
  },
  {
    element: "hplus-accordion",
    title: "Accordion",
    label: "Delivery instructions",
    variant: "Boxed",
    className: "accordion-boxed",
    field: false,
    description:
      "Style the disclosure headers and content. Both ordinary inputs submit, including the field in a closed section.",
    markup: `<hplus-accordion value='["delivery"]'>
  <section data-value="delivery" data-label="Delivery">
    <label class="native-field">Delivery note<hplus-field><input name="delivery_note" value="Ring the bell"></hplus-field></label>
  </section>
  <section data-value="gift" data-label="Gift">
    <label class="native-field">Gift message<hplus-field><input name="gift_message" value="Enjoy your gift!"></hplus-field></label>
  </section>
</hplus-accordion>`,
    parts: ["root", "item", "heading", "trigger", "label", "indicator", "content"],
    css: `hplus-accordion.accordion-boxed::part(root) {
  border: 1px solid var(--hp-border, #d4d4d4);
  border-radius: var(--hp-radius, .5rem);
}
hplus-accordion.accordion-boxed::part(item) {
  border: 0;
}
hplus-accordion.accordion-boxed::part(trigger) {
  padding-inline: 1rem;
}
hplus-accordion.accordion-boxed::part(content) {
  padding: .25rem 1rem 1rem;
}`,
  },
  {
    element: "hplus-tabs",
    title: "Tabs",
    label: "Contact details",
    variant: "Underline",
    className: "tabs-underline",
    field: false,
    description:
      "A stateful part styles the selected tab. Panel selection is view state; both panels' inputs stay in FormData.",
    markup: `<hplus-tabs value="profile" aria-label="Contact details">
  <section data-value="profile" data-label="Profile">
    <label class="native-field">Display name<hplus-field><input name="display_name" value="Ada Lovelace"></hplus-field></label>
  </section>
  <section data-value="receipts" data-label="Receipts">
    <label class="native-field">Receipt email<hplus-field><input name="receipt_email" type="email" value="ada@example.test"></hplus-field></label>
  </section>
</hplus-tabs>`,
    parts: ["root", "list", "tab", "selected-tab", "panels", "panel"],
    css: `hplus-tabs.tabs-underline::part(list) {
  width: 100%;
  padding: 0;
  gap: 1rem;
  border-bottom: 1px solid var(--hp-border, #d4d4d4);
  border-radius: 0;
  background: transparent;
}
hplus-tabs.tabs-underline::part(tab) {
  min-height: 40px;
  padding-inline: .25rem;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
hplus-tabs.tabs-underline::part(selected-tab) {
  border-bottom-color: var(--hp-primary, #171717);
  color: var(--hp-primary, #171717);
}`,
  },
  {
    element: "hplus-iban",
    title: "IBAN",
    label: "Bank account",
    variant: "Underlined",
    className: "iban-underlined",
    description:
      "An IBAN is displayed in uppercase groups of four while the form receives the canonical identifier without spaces. Native edits retain undo.",
    markup: '<hplus-iban name="iban" value="DE89370400440532013000" required></hplus-iban>',
    parts: ["input"],
    css: `hplus-iban.iban-underlined::part(input) {
  border-width: 0 0 1px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.05em;
}`,
  },
  {
    element: "hplus-bic",
    title: "BIC / SWIFT",
    label: "Bank identifier",
    variant: "Compact",
    className: "bic-compact",
    description: "Give a short identifier a compact, monospaced treatment without changing validation.",
    markup: '<hplus-bic name="bic" value="COBADEFFXXX"></hplus-bic>',
    parts: ["input"],
    css: `hplus-bic.bic-compact::part(input) {
  max-width: 20ch;
  height: 36px;
  font-family: ui-monospace, monospace;
  font-weight: 600;
  letter-spacing: 0.08em;
}`,
  },
  {
    element: "hplus-otp",
    title: "Verification code",
    label: "Verification code",
    variant: "Underlined slots",
    className: "otp-underlined",
    description:
      "Six visual slots share one real input. Arrows, selection, paste, deletion, undo, and autofill use a single editing surface.",
    markup: '<hplus-otp name="code" value="004271" length="6" required></hplus-otp>',
    parts: ["control", "slots", "slot", "filled-slot", "active-slot", "selected-slot", "input"],
    css: `hplus-otp.otp-underlined {
  --hp-otp-gap: .375rem;
}
hplus-otp.otp-underlined::part(slot) {
  border-width: 0 0 2px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
hplus-otp.otp-underlined::part(active-slot) {
  border-color: var(--hp-primary, #171717);
}`,
  },
  {
    element: "hplus-duration",
    title: "Duration",
    label: "Session duration",
    variant: "Tabular",
    className: "duration-tabular",
    description: "Use tabular figures and a quiet surface for time notation. The submitted unit remains seconds.",
    markup: '<hplus-duration name="duration" value="1h 30m" min="60" required></hplus-duration>',
    parts: ["input"],
    css: `hplus-duration.duration-tabular::part(input) {
  max-width: 18rem;
  background: var(--hp-muted, #f5f5f5);
  font-family: ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}`,
  },
  {
    element: "hplus-interval",
    title: "Numeric interval",
    label: "Budget (USD)",
    variant: "Compact pair",
    className: "interval-compact",
    description: "Style both editors together, or target a boundary, its label, and the separator individually.",
    markup: '<hplus-interval name="budget" value="[200,800]" min="0" step="50" required></hplus-interval>',
    parts: ["control", "input", "lower-input", "upper-input", "lower-label", "upper-label", "separator"],
    css: `hplus-interval.interval-compact::part(control) {
  gap: 0.5rem;
}
hplus-interval.interval-compact::part(input) {
  height: 36px;
  font-variant-numeric: tabular-nums;
}
hplus-interval.interval-compact::part(separator) {
  align-self: end;
  display: grid;
  place-items: center;
  height: 36px;
  padding: 0;
}`,
  },
  {
    element: "hplus-tags",
    title: "Tags",
    label: "Topics",
    variant: "Outlined tokens",
    className: "tags-outlined",
    description: "Restyle the tokens and remove buttons without replacing the editor or the repeated form entries.",
    markup: `<hplus-tags name="topics" value='["html","forms"]'></hplus-tags>`,
    parts: ["control", "tokens", "input", "tag", "tag-label", "remove-button", "remove-icon"],
    css: `hplus-tags.tags-outlined::part(tag) {
  border: 1px solid var(--hp-border, #d4d4d4);
  border-radius: 999px;
  background: transparent;
}
hplus-tags.tags-outlined::part(remove-button) {
  border-radius: 50%;
}
hplus-tags.tags-outlined::part(remove-icon) {
  stroke-width: 1.75;
}`,
  },
  {
    element: "hplus-switch",
    title: "Switch",
    label: "Product updates",
    variant: "Square",
    className: "switch-square",
    description: "Change the track and thumb shape. The checked state is also available through :state(checked).",
    markup: '<hplus-switch name="updates" value="email" checked></hplus-switch>',
    parts: ["track", "thumb"],
    css: `hplus-switch.switch-square::part(track) {
  border-radius: 4px;
}
hplus-switch.switch-square::part(thumb) {
  border-radius: 2px;
  box-shadow: none;
}
hplus-switch.switch-square:state(checked)::part(track) {
  background: var(--hp-primary, #171717);
}`,
  },
  {
    element: "hplus-segmented",
    title: "Segmented choice",
    label: "Delivery speed",
    variant: "Outlined choices",
    className: "segmented-outlined",
    description:
      "Give the selected option its own appearance with a stateful part. Native radio navigation stays intact.",
    markup: `<hplus-segmented name="delivery" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
</hplus-segmented>`,
    parts: ["control", "option", "selected-option"],
    css: `hplus-segmented.segmented-outlined::part(control) {
  gap: 0.375rem;
  border: 0;
  padding: 0;
  background: transparent;
}
hplus-segmented.segmented-outlined::part(option) {
  border: 1px solid var(--hp-input, #d4d4d4);
  border-radius: var(--hp-radius, .5rem);
}
hplus-segmented.segmented-outlined::part(selected-option) {
  border-color: var(--hp-primary, #171717);
  background: var(--hp-primary, #171717);
  color: var(--hp-primary-foreground, #fff);
}`,
  },
];
