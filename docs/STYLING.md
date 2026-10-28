# Styling html+ controls

The playground and styling gallery share independent Light/Dark appearances, Layered/Flat surfaces, and Neutral, Blue, Green, Orange, Rose, and custom Utility palettes. Their appearance changes through inherited `--hp-*` properties. Each of the eighteen elements also has its own Base preview, part-based variation, actual form entries, and copyable source. Run `npm run dev`, then open [the playground](http://localhost:4173/) or [the gallery](http://localhost:4173/styling.html).

## Built-in base

Every component includes its neutral light base in shadow DOM. No external stylesheet, theme class, React, or Tailwind is required. Defaults are fallbacks at the point of use, not public declarations on `:host`, so a parent theme can flow into every component.

```html
<script type="module" src="./dist/src/index.js"></script>
<form>
  <label for="account">Bank account</label>
  <h6-iban id="account" name="iban" required></h6-iban>
</form>
```

The components use system sans text at 14px/20px and 40px base editors at a 16px root. Tags use 12px/16px text, a centered 12px SVG close icon, and a 24px remove button. Root-relative dimensions scale with text size. Their geometry takes cues from shadcn/ui while retaining an independent plain CSS implementation.

## Surface depth

The default Layered finish uses a small shared set of surface roles inspired by the [React Aria Button](https://react-aria.adobe.com/Button) and [TextField](https://react-aria.adobe.com/TextField) examples, inspected on 2026-10-29. Raised controls combine a top highlight, lower edge, inner shading, and a small contact shadow. Editors have an inset shadow; thumbs and popovers have their own elevation. These are independently implemented effects on the existing html+ geometry and semantic colors.

| Public token | Role |
| --- | --- |
| `--hp-shadow-raised` | Toggle buttons, Select surfaces, selected tabs/segments, tags, and secondary actions |
| `--hp-shadow-pressed` | Momentarily pressed Toggle and demo action buttons |
| `--hp-shadow-inset` | Editors, editable compound fields, tab/segmented tracks, and switch/slider tracks |
| `--hp-shadow-thumb` | Switch and slider handles |
| `--hp-shadow-popover` | Selection lists and calendars |

Each token accepts a complete `box-shadow` value, including `none`. They are html+ extensions; the shadcn adapter continues to bridge colors and the base radius. Defaults resolve where they are consumed, so a nested or host-level override wins without `::part`.

Light and dark highlights follow the consuming element's `color-scheme` through `light-dark()`. The bundled `.hp-light` and `.hp-dark` presets set it explicitly, so the demo appearance does not depend on the operating system preference. Set `color-scheme: dark` when supplying a custom dark palette. Actual borders and focus outlines remain independent of decorative shadows; forced-colors mode removes the shadows.

Both demos expose an independent Surface selector. `Layered` uses the built-in defaults; `Flat` applies `.hp-flat` from `themes.css`, setting all five roles to `none`. Changing finish preserves the DOM, edited values, native history, and form entries. The gallery's Theme CSS view includes the exact flat preset.

```css
.flat-form {
  --hp-shadow-raised: none;
  --hp-shadow-pressed: none;
  --hp-shadow-inset: none;
  --hp-shadow-thumb: none;
  --hp-shadow-popover: none;
}

h6-date-picker {
  --hp-shadow-inset: inset 0 1px 2px rgb(0 0 0 / .12);
}
```

## Semantic theme contract

Token suffixes and roles follow [shadcn/ui's current theming contract](https://ui.shadcn.com/docs/theming), checked on 2026-10-23. Color values are complete CSS colors: hex, RGB, OKLCH, or another supported color syntax, including alpha. Do not wrap them in `hsl()`. Compatibility covers these semantic roles and the radius scale, not pixel-identical component layouts or automatic tracking of future upstream changes.

| Public token | Current role |
| --- | --- |
| `--hp-background`, `--hp-foreground` | Editors, selected tab/segment surfaces, and default component text |
| `--hp-primary`, `--hp-primary-foreground` | Pressed toggles, checked switches, slider ranges/thumbs, and highlighted rating items |
| `--hp-popover`, `--hp-popover-foreground` | Select, Combobox, Date Picker, and Date Range Picker popup surfaces and text |
| `--hp-secondary`, `--hp-secondary-foreground` | Tag tokens |
| `--hp-muted`, `--hp-muted-foreground` | Tab/segmented tracks, inactive tabs, placeholders, and interval labels |
| `--hp-accent`, `--hp-accent-foreground` | Toggle and remove-button hover; highlighted Select/Combobox options |
| `--hp-destructive` | Invalid controls |
| `--hp-border` | Accordion separators, popup borders, and recipe borders |
| `--hp-input` | Editor, tag-control, toggle, segmented-control, and rating clear-button borders; unchecked switch tracks |
| `--hp-ring` | Focus borders and keyboard focus outlines |
| `--hp-radius` | Base for the component radius scale |

The complete palette also reserves `--hp-card` / `--hp-card-foreground`, `--hp-chart-1` through `--hp-chart-5`, and the sidebar family: `--hp-sidebar`, `--hp-sidebar-foreground`, `--hp-sidebar-primary`, `--hp-sidebar-primary-foreground`, `--hp-sidebar-accent`, `--hp-sidebar-accent-foreground`, `--hp-sidebar-border`, `--hp-sidebar-ring`. These roles are included in the presets and adapter. The demo shell uses `--hp-card`; current library elements do not yet consume the card, chart, or sidebar roles. There is no promise of an observable change for an element that does not use a role.

Set public tokens on `:root`, a wrapper, or an individual host. More local declarations inherit normally:

```css
.checkout {
  --hp-primary: #166534;
  --hp-primary-foreground: #ffffff;
  --hp-input: #a3a3a3;
  --hp-ring: #15803d;
  --hp-radius: .625rem;
}
.checkout h6-otp { --hp-radius: 0; }
```

`--hp-radius` defaults to `.625rem`. Derived sizes use the current shadcn factors: `sm` = 0.6, `md` = 0.8, `lg` = 1, `xl` = 1.4, `2xl` = 1.8, `3xl` = 2.2, `4xl` = 2.6. Editors and toggles use `md`; tag tokens and inner tabs/segments use `sm`; tab/segmented tracks use `lg`. Explicit `--hp-radius-sm`, `--hp-radius-md`, and `--hp-radius-lg` override those sizes. The larger sizes are reserved for future consumers. Values derive at the consuming element, so a locally overridden base takes effect without inheriting a stale computed scale from an ancestor. Explicit size overrides are inherited as supplied. Capsule switches and circular thumbs retain their functional shapes; use their parts for a different shape.

Typography and density are html+ extensions: `--hp-font-family`, `--hp-font-size`, `--hp-line-height`, and `--hp-control-height`. The last controls text/numeric editor height, minimum tag-control height, and minimum toggle/tab-list height and horizontal slider control height. Keep these values compatible when changing density. These extensions are not a claim about shadcn's base theme schema.

## Light and dark presets

The optional [themes.css](../demo/themes.css) defines complete `.hp-light` and `.hp-dark` palettes. After `npm run build`, it is also available as `dist/themes.css`. Apply a class to the document or a nested wrapper; the dark preset also sets `color-scheme: dark` for native controls. Dark mode is explicit rather than inferred from an operating-system preference. Applications own that preference logic.

```html
<link rel="stylesheet" href="./dist/themes.css">
<form class="hp-dark">
  <!-- Labeled html+ controls and ordinary form fields go here. -->
</form>
```

The playground's **Theme CSS** disclosure displays the exact preset file it uses. Both pages' Appearance and Palette pickers change the theme without replacing fields or modifying their values. The independent Palette picker combines either appearance with Neutral, Blue, Green, Orange, Rose, or custom Utility. The four new palettes copy the official shadcn accent overlays at [source revision 4101ec9](https://github.com/shadcn-ui/ui/blob/4101ec98af37e2d812f859e3f540bceafbbc5200/apps/v4/registry/themes.ts), retrieved 2026-10-23, over html+'s existing neutral base. They are a curated selection, not a measured popularity ranking. MIT attribution ships with the browser artifact. Utility retains a smaller radius and now has a dark variant. Apply the appearance and palette classes to the same scope, for example `class="hp-dark hp-blue"`; use both classes again for a nested theme scope. Part-based recipes remain separate examples.

## Optional shadcn adapter

An existing shadcn application can load [shadcn.css](../demo/shadcn.css), also copied to `dist/shadcn.css` at build time. Add `hp-shadcn` to the theme scope or directly to a component. Keep the application's existing light and dark variables unchanged:

```html
<link rel="stylesheet" href="./dist/shadcn.css">
<form class="hp-shadcn">
  <!-- Existing shadcn CSS supplies --background, --primary, --input, etc. -->
  <label for="account">Bank account</label>
  <h6-iban id="account" name="iban"></h6-iban>
  <section class="dark">
    <!-- Nested application theme tokens are resolved on each html+ host. -->
  </section>
</form>
```

The adapter maps the same 31 color roles and base `--radius` into private fallback properties. Components resolve **explicit `--hp-*` → adapter value → built-in default**. This preserves inherited as well as local prefixed overrides. A missing application token falls back to the component default. The adapter supplies no palette, font, layout, structural part rules, or public-token declarations; it does not overwrite the host application's variables. Nested `.dark` scopes and generic overrides directly on a component resolve locally. The selector lists the current elements and must be extended when the catalog grows.

Only the base radius is bridged. Tailwind's derived `--radius-*` variables can hold ancestor-computed values, so components derive their own scale locally. If an application intentionally customizes an individual size, map it explicitly, for example `--hp-radius-md: var(--radius-md)` on the desired scope. Internal `--_hp-shadcn-*` properties are implementation details, not an override API.

The prefixed presets and adapter are alternative sources of the same palette. Loading a preset on an ancestor creates explicit inherited `--hp-*` values, which intentionally win over generic shadcn tokens inside that scope. Use the adapter with the application's palette, or the prefixed presets with html+ overrides.

## Migration from the prototype

This is an intentional pre-release CSS API change. Element names remain `h6-*`; the CSS prefix is now `--hp-`. There are no ambiguous compatibility aliases.

| Previous token | Replacement |
| --- | --- |
| `--h6-text`, `--h6-surface` | `--hp-foreground`, `--hp-background` |
| `--h6-accent`, `--h6-accent-foreground` | `--hp-primary`, `--hp-primary-foreground` |
| `--h6-border` | `--hp-input` for controls, `--hp-border` for separators |
| `--h6-focus`, `--h6-placeholder`, `--h6-danger` | `--hp-ring`, `--hp-muted-foreground`, `--hp-destructive` |
| `--h6-track`, `--h6-muted` | `--hp-muted`, `--hp-input` |
| `--h6-tag-background`, `--h6-tag-color`, `--h6-tag-hover` | `--hp-secondary`, `--hp-secondary-foreground`, `--hp-accent` |
| `--h6-radius`, `--h6-tag-radius` | `--hp-radius`, `--hp-radius-sm` |
| `--h6-font-*`, `--h6-line-height`, `--h6-control-height` | Same suffixes under `--hp-` |

`--h6-focus-soft` is removed; focus appearance uses `--hp-ring` and public parts. The old `demo/base.css` and `h6-base` class are replaced by the separate presets and `hp-shadcn` adapter. In particular, new `accent` means an interaction surface, not the old primary action color.

## Recipes and public parts

The [recipe definitions](../demo/recipes.ts) are the single source for the gallery's preview CSS and displayed snippets.

| Element | Included variation | Public parts |
| --- | --- | --- |
| `h6-date-range-picker` | Outlined range | Date Picker parts plus `start-field`, `end-field`, `start-input`, `end-input`, `start-label`, `end-label`, `range-start`, `range-end`, `in-range`, `preview-day` |
| `h6-date-picker` | Framed calendar | `root`, `control`, `input`, `trigger`, `clear-button`, `positioner`, `content`, `navigation`, `prev-button`, `view-button`, `next-button`, `view`, `day-view`, `month-view`, `year-view`, `grid`, `weekday`, `day`, `selected-day`, `today`, `month`, `year` |
| `h6-select` | Quiet surface | `root`, `control`, `trigger`, `value-text`, `indicator`, `clear-button`, `positioner`, `content`, `option`, `selected-option`, `option-label`, `option-indicator`, `empty` |
| `h6-combobox` | Underlined search | Select parts with `input` instead of `value-text` |
| `h6-slider` | Slim rail | `root`, `value-text`, `control`, `track`, `range`, `thumb` |
| `h6-range-slider` | Square handles | Slider parts plus `lower-thumb`, `upper-thumb` |
| `h6-rating` | Outlined score | `root`, `label`, `control`, `item`, `selected-item`, `icon`, `clear-button`, `value-text` |
| `h6-iban` | Underlined editor with monospaced text | `input` |
| `h6-bic` | Compact identifier field | `input` |
| `h6-otp` | Larger, spaced code with one native editor | `input` |
| `h6-duration` | Quiet surface with tabular figures | `input` |
| `h6-interval` | Compact numeric pair | `control`, `input`, `lower-input`, `upper-input`, `lower-label`, `upper-label`, `separator` |
| `h6-tags` | Outlined, rounded tokens | `control`, `tokens`, `input`, `tag`, `tag-label`, `remove-button`, `remove-icon` |
| `h6-switch` | Square track and thumb | `track`, `thumb` |
| `h6-segmented` | Outlined choices with a dark selected option | `control`, `option`, `selected-option` |
| `h6-toggle` | Pill with a light pressed state | `button` |
| `h6-accordion` | Boxed disclosure sections | `root`, `item`, `heading`, `trigger`, `label`, `indicator`, `content` |
| `h6-tabs` | Underlined selected tab | `root`, `list`, `tab`, `selected-tab`, `panels`, `panel` |

Target a public part directly. Shadow descendants are intentionally not a styling API:

```css
h6-tags.outlined::part(tag) {
  border: 1px solid var(--hp-border);
  border-radius: 999px;
  background: transparent;
}
```

Toggles expose `:state(pressed)`; Tabs expose `selected-tab` alongside `tab`. Their recipes follow those live states. Accordion and Tabs project author-owned sections; native inputs inside them are styled with ordinary application CSS, not shadow parts. See the [interaction guide](INTERACTIONS.md).

Switches expose their live checked state through `:state(checked)`. Use it instead of `[checked]`, which describes the initial default. Segmented choices expose `selected-option` on the currently selected option; it moves when selection changes by pointer, keyboard, assignment, or reset. It is also an `option` part. `::part(option):checked` cannot observe the adjacent private radio input.

Stateful styles should preserve visible keyboard focus, disabled states, invalid borders, and readable text. Avoid changing a switch's geometry without adjusting its thumb travel. The default switch keeps its thumb travel in step with its root-relative track dimensions. OTP styling retains one real input and does not introduce separate character boxes or automatic submission.

## Verification

The browser suite checks built-in styling without application CSS, typography, tag text/icon alignment, keyboard removal, long labels, 200% root text sizing, and direct overrides. Theme checks cover every element's inherited text, distinct semantic roles, nested and per-host scopes, missing shadcn values, full OKLCH colors, prefixed override precedence, radius scaling and zero radius, light/dark text and focus contrast, forced colors, surface-token inheritance and local overrides, and unchanged edited FormData while switching appearances, palettes, and finishes on mobile. Gallery tests cover all eighteen recipes, shared displayed source, deep links, and clipboard success/failure. The Pages fixture loads presets and adapter from the exported artifact under `/htmlplus/`. Chromium and WebKit pass locally; Firefox cannot launch on this macOS host and remains a Linux CI check. Physical-device and manual assistive-technology coverage remain open.

Select, Combobox, Date Picker, and Date Range Picker keep their popup in shadow DOM while entering the native top layer. Inherited theme tokens, the shadcn bridge, and public popup parts still apply. Use `--hp-popover` and `--hp-popover-foreground` for its surface and text, and accent tokens for highlighted options. `:state(selected)` and `:state(open)` expose current state. See the [selection guide](SELECTION-CONTROLS.md).

Date Picker uses primary tokens for its selected day and accent tokens for calendar hover. `selected-day` and `today` parts expose independent live states. Calendar navigation buttons use the common ring and radius contract. The [Date Picker guide](DATE-PICKER.md) records input and popup behavior.

Date Range Picker shares the calendar base. Primary tokens mark the two selected boundaries; accent tokens fill the selected or previewed span. `range-start`, `range-end`, `in-range`, and `preview-day` expose these states without private DOM selectors. Its Outlined range recipe changes the control surface, popup border, and boundary outline. See the [range guide](DATE-RANGE-PICKER.md).
