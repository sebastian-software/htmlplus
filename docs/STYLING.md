# Styling html+ controls

The playground's **Styling** link opens a recipe for every element. Run `npm run dev`, then open [the local styling gallery](http://localhost:4173/styling.html). Each recipe has two live controls, their actual form entries, public part names, and copyable HTML and CSS. The variation uses exactly the CSS displayed in its source panel.

## Built-in base, optional theme adapter

Every component includes its neutral base in shadow DOM. Import the element module and use it directly: no external stylesheet or `h6-base` class is required. The gallery's Base preview uses this built-in styling.

```html
<script type="module" src="./dist/src/index.js"></script>
<form>
  <label for="account">Bank account</label>
  <h6-iban id="account" name="iban" required></h6-iban>
</form>
```

The typography and geometry take visual cues from shadcn/ui's [Input](https://ui.shadcn.com/docs/components/input) and [Badge](https://ui.shadcn.com/docs/components/badge): consistent editor metrics, medium-weight token text, compact gaps, and SVG icons. The implementation is independent plain CSS without React, Tailwind, or shadcn/ui dependencies. Controls use a system sans face, 14px/20px editor text, and a 40px base editor height at a 16px root. Tags use 12px/16px text with a centered 12px close icon and a 24px remove button. These dimensions use root-relative units and scale with text size. Tag tokens are taller than a static badge to accommodate their interactive remove button.

To connect a semantic application theme, optionally copy [demo/base.css](../demo/base.css), then apply `h6-base` to a wrapper or individual control. This file maps tokens; it does not supply structural component styles.

```html
<link rel="stylesheet" href="./htmlplus-base.css">
<form class="h6-base">
  <!-- Labeled controls go here. -->
</form>
```

The example token adapter maps application roles to the component contract:

| Application token | html+ token | Purpose |
| --- | --- | --- |
| `--primary` | `--h6-accent` | Checked switches and selected choices |
| `--background` / `--foreground` | `--h6-surface` / `--h6-text` | Editor surface and text |
| `--input` | `--h6-border` | Control borders |
| `--ring` | `--h6-focus` | Keyboard focus |
| `--muted-foreground` | `--h6-placeholder` | Placeholder text and small boundary labels |
| `--muted` / `--foreground` | `--h6-tag-background` / `--h6-tag-color` | Token appearance |
| `--destructive` | `--h6-danger` | Invalid state |
| `--radius` | `--h6-radius` | Control corners |

Change tokens on the same wrapper as `h6-base`, or on a descendant control. For example:

```css
.h6-base.settings-form {
  --radius: 4px;
  --input: #a3a3a3;
  --ring: #525252;
}
```

If an application already defines these semantic tokens, remove the example token declarations at the top of `base.css` and keep the `--h6-*` mapping and part rules. Consumers can also map their own tokens directly without loading this example stylesheet.

Typography can be overridden with `--h6-font-family`, `--h6-font-size`, and `--h6-line-height`. `--h6-control-height` sets the base text/numeric editor height and minimum tag-control height. Use an inherited `--h6-*` token for a group or `::part(...)` for an individual detail. Keep font size, line height, and height compatible when changing density.

## Recipes and public parts

The [recipe definitions](../demo/recipes.ts) are the single source for the gallery's preview CSS and displayed snippets.

| Element | Included variation | Public parts |
| --- | --- | --- |
| `h6-iban` | Underlined editor with monospaced text | `input` |
| `h6-bic` | Compact identifier field | `input` |
| `h6-otp` | Larger, spaced code with one native editor | `input` |
| `h6-duration` | Quiet surface with tabular figures | `input` |
| `h6-interval` | Compact numeric pair | `control`, `input`, `lower-input`, `upper-input`, `lower-label`, `upper-label`, `separator` |
| `h6-tags` | Outlined, rounded tokens | `control`, `tokens`, `input`, `tag`, `tag-label`, `remove-button`, `remove-icon` |
| `h6-switch` | Square track and thumb | `track`, `thumb` |
| `h6-segmented` | Outlined choices with a dark selected option | `control`, `option`, `selected-option` |

Target a public part directly. Shadow descendants are intentionally not a styling API:

```css
h6-tags.outlined::part(tag) {
  border: 1px solid var(--h6-border);
  border-radius: 999px;
  background: transparent;
}
```

Switches expose their live checked state through `:state(checked)`. Use it instead of `[checked]`, which describes the initial default. Segmented choices expose `selected-option` on the currently selected option; it moves when selection changes by pointer, keyboard, assignment, or reset. It is also an `option` part. `::part(option):checked` cannot observe the adjacent private radio input.

Stateful styles should preserve visible keyboard focus, disabled states, invalid borders, and readable text. Avoid changing a switch's geometry without adjusting its thumb travel. The default switch keeps its thumb travel in step with its root-relative track dimensions. OTP styling retains one real input and does not introduce separate character boxes or automatic submission.

## Verification

The browser suite checks all eight elements without any document stylesheet, tag text/icon alignment, keyboard removal, long labels, 200% root text sizing, and direct public overrides. It also visits all eight recipes, compares base and variation form entries, checks deep links and matching source, exercises selection with the keyboard, and verifies copy success and failure paths. The clipboard tests stub the browser API; actual clipboard permission remains a browser decision. Desktop and mobile screenshots cover the neutral theme and gallery. The Pages check loads the gallery and base stylesheet under `/htmlplus/`.
