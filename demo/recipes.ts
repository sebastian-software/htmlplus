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
}

/** Trusted, static authoring examples. This CSS is both shown and used by the previews. */
export const recipes: readonly StylingRecipe[] = [
  {
    element: "h6-iban", title: "IBAN", label: "Bank account", variant: "Underlined", className: "iban-underlined",
    description: "Change the editor's presentation while the form keeps its canonical, whitespace-free IBAN.",
    markup: '<h6-iban name="iban" value="DE89370400440532013000" required></h6-iban>',
    parts: ["input"],
    css: `h6-iban.iban-underlined::part(input) {
  border-width: 0 0 1px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.05em;
}`,
  },
  {
    element: "h6-bic", title: "BIC / SWIFT", label: "Bank identifier", variant: "Compact", className: "bic-compact",
    description: "Give a short identifier a compact, monospaced treatment without changing validation.",
    markup: '<h6-bic name="bic" value="COBADEFFXXX"></h6-bic>', parts: ["input"],
    css: `h6-bic.bic-compact::part(input) {
  max-width: 20ch;
  height: 36px;
  font-family: ui-monospace, monospace;
  font-weight: 600;
  letter-spacing: 0.08em;
}`,
  },
  {
    element: "h6-otp", title: "Verification code", label: "Verification code", variant: "Spaced code", className: "otp-spaced",
    description: "A more prominent code field still uses one native input for paste, selection, undo, and autofill hints.",
    markup: '<h6-otp name="code" value="004271" required></h6-otp>', parts: ["input"],
    css: `h6-otp.otp-spaced::part(input) {
  max-width: 14ch;
  height: 48px;
  font: 24px ui-monospace, monospace;
  letter-spacing: 0.25em;
  text-align: center;
}`,
  },
  {
    element: "h6-duration", title: "Duration", label: "Session duration", variant: "Tabular", className: "duration-tabular",
    description: "Use tabular figures and a quiet surface for time notation. The submitted unit remains seconds.",
    markup: '<h6-duration name="duration" value="1h 30m" min="60" required></h6-duration>', parts: ["input"],
    css: `h6-duration.duration-tabular::part(input) {
  max-width: 18rem;
  background: var(--h6-track, #f5f5f5);
  font-family: ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}`,
  },
  {
    element: "h6-interval", title: "Numeric interval", label: "Budget (USD)", variant: "Compact pair", className: "interval-compact",
    description: "Style both editors together, or target a boundary, its label, and the separator individually.",
    markup: '<h6-interval name="budget" value="[200,800]" min="0" step="50" required></h6-interval>',
    parts: ["control", "input", "lower-input", "upper-input", "lower-label", "upper-label", "separator"],
    css: `h6-interval.interval-compact::part(control) {
  gap: 0.5rem;
}
h6-interval.interval-compact::part(input) {
  height: 36px;
  font-variant-numeric: tabular-nums;
}
h6-interval.interval-compact::part(separator) {
  align-self: end;
  display: grid;
  place-items: center;
  height: 36px;
  padding: 0;
}`,
  },
  {
    element: "h6-tags", title: "Tags", label: "Topics", variant: "Outlined tokens", className: "tags-outlined",
    description: "Restyle the tokens and remove buttons without replacing the editor or the repeated form entries.",
    markup: `<h6-tags name="topics" value='["html","forms"]'></h6-tags>`,
    parts: ["control", "tokens", "input", "tag", "tag-label", "remove-button", "remove-icon"],
    css: `h6-tags.tags-outlined::part(tag) {
  border: 1px solid var(--h6-border, #d4d4d4);
  border-radius: 999px;
  background: transparent;
}
h6-tags.tags-outlined::part(remove-button) {
  border-radius: 50%;
}
h6-tags.tags-outlined::part(remove-icon) {
  stroke-width: 1.75;
}`,
  },
  {
    element: "h6-switch", title: "Switch", label: "Product updates", variant: "Square", className: "switch-square",
    description: "Change the track and thumb shape. The checked state is also available through :state(checked).",
    markup: '<h6-switch name="updates" value="email" checked></h6-switch>', parts: ["track", "thumb"],
    css: `h6-switch.switch-square::part(track) {
  border-radius: 4px;
}
h6-switch.switch-square::part(thumb) {
  border-radius: 2px;
  box-shadow: none;
}
h6-switch.switch-square:state(checked)::part(track) {
  background: var(--h6-accent, #171717);
}`,
  },
  {
    element: "h6-segmented", title: "Segmented choice", label: "Delivery speed", variant: "Outlined choices", className: "segmented-outlined",
    description: "Give the selected option its own appearance with a stateful part. Native radio navigation stays intact.",
    markup: `<h6-segmented name="delivery" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
</h6-segmented>`, parts: ["control", "option", "selected-option"],
    css: `h6-segmented.segmented-outlined::part(control) {
  gap: 0.375rem;
  border: 0;
  padding: 0;
  background: transparent;
}
h6-segmented.segmented-outlined::part(option) {
  border: 1px solid var(--h6-border, #d4d4d4);
  border-radius: var(--h6-radius, .5rem);
}
h6-segmented.segmented-outlined::part(selected-option) {
  border-color: var(--h6-accent, #171717);
  background: var(--h6-accent, #171717);
  color: var(--h6-accent-foreground, #fff);
}`,
  },
];
