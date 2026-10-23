# Styling html6 controls

The playground's **Styling** link opens a recipe for every element. Run `npm run dev`, then open [the local styling gallery](http://localhost:4173/styling.html). Each recipe has two live controls, their actual form entries, public part names, and copyable HTML and CSS. The variation uses exactly the CSS displayed in its source panel.

## Start with the neutral base

Download `base.css` from the gallery, or copy [demo/base.css](../demo/base.css). Load it after your application's reset and before your overrides. Add `h6-base` to a container or an individual control:

```html
<link rel="stylesheet" href="./html6-base.css">
<form class="h6-base">
  <label for="account">Bank account</label>
  <h6-iban id="account" name="iban" required></h6-iban>
</form>
```

The base uses semantic CSS tokens inspired by the [shadcn/ui theming convention](https://ui.shadcn.com/docs/theming). It is an independent plain-CSS example, with no shadcn/ui, React, or Tailwind dependency. The default palette is neutral: white surfaces, dark text and primary actions, gray borders and focus rings. Error and success feedback retain semantic colors.

The example token adapter maps application roles to the component contract:

| Application token | html6 token | Purpose |
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

## Recipes and public parts

The [recipe definitions](../demo/recipes.ts) are the single source for the gallery's preview CSS and displayed snippets.

| Element | Included variation | Public parts |
| --- | --- | --- |
| `h6-iban` | Underlined editor with monospaced text | `input` |
| `h6-bic` | Compact identifier field | `input` |
| `h6-otp` | Larger, spaced code with one native editor | `input` |
| `h6-duration` | Quiet surface with tabular figures | `input` |
| `h6-interval` | Compact numeric pair | `control`, `input`, `lower-input`, `upper-input`, `lower-label`, `upper-label`, `separator` |
| `h6-tags` | Outlined, rounded tokens | `control`, `tokens`, `input`, `tag`, `tag-label`, `remove-button` |
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

Stateful styles should preserve visible keyboard focus, disabled states, invalid borders, and readable text. Avoid changing a switch's geometry without adjusting its thumb travel. The base's smaller switch retains the native implementation's 18px travel. OTP styling retains one real input and does not introduce separate character boxes or automatic submission.

## Verification

The browser suite visits all eight recipes, compares base and variation form entries, checks deep links and matching source, exercises selection with the keyboard, and verifies copy success and failure paths. The clipboard tests stub the browser API; actual clipboard permission remains a browser decision. Desktop and mobile screenshots cover the neutral theme and gallery. The Pages check loads the gallery and base stylesheet under `/html6/`.
