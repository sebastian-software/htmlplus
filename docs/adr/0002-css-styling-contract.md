# ADR-0002: Expose a deliberate CSS styling contract

- Status: accepted
- Scope: initial prototype
- Created: 2026-10-22
- Updated: 2026-10-29
- Lifecycle: living

## Context and decision

The controls should fit existing visual systems while remaining usable on first insertion. Use a restrained default appearance, inheritable CSS custom properties, documented `::part(...)` hooks for shadow internals, and custom states where they express actual interaction state. The specialized native editors expose `::part(input)`. The complete neutral base belongs inside the components, with shared internal CSS primitives for consistent typography, spacing, focus, and editor sizes. A consumer can insert an element without loading another stylesheet. Slots may expose meaningful content customization.

This gives consumers stable styling surfaces while allowing internal markup to evolve. A fully opaque theme API would restrict integration; treating all internal markup as public would make maintenance costly.

## Semantic theme decision

Use `--hp-` for the public CSS-property prefix. Adopt shadcn/ui's semantic token suffixes and meanings for the color palette and base radius, as inspected on 2026-10-23. Keep typography and density as explicitly documented html+ extensions. Primary actions, interaction accents, input borders, and general separators are distinct roles. Align the derived radius scale with shadcn's current multiplicative model and compute it at use so nested themes can override the base reliably.

Retain complete neutral component fallbacks. Add optional prefixed light/dark presets and a separate shadcn adapter, with neither React nor Tailwind required. The adapter resolves generic application tokens on each current html+ host through private fallbacks; explicit inherited or local `--hp-*` properties take precedence. It supplies no palette or structural rules. Bridge only the base radius to avoid freezing ancestor-derived sizes. The full palette reserves card, chart, and sidebar roles without implying that current elements consume them. Select and Combobox consume the popover roles.

This replaces the old ad hoc `--h6-*` CSS roles before release rather than preserving conflicting aliases, particularly the old use of accent for primary actions. Element names and class exports are unchanged. Token compatibility is a documented snapshot, not a promise of identical component geometry or automatic adoption of upstream schema changes.

## Surface depth decision

Add five html+ surface-shadow extensions to the color/radius contract: raised, pressed, inset, thumb, and popover. The default Layered finish uses layered light/shadow cues; an optional Flat preset removes every role. Keep finish independent of palette and Light/Dark appearance. React Aria's Button and TextField examples are mechanism references, inspected on 2026-10-29; html+ retains its own colors, layout, and component behavior.

Resolve the effects at use through `--hp-shadow-*` fallbacks and the consuming scope's `color-scheme`. Do not use the system dark-mode media query to override an explicitly selected appearance. Preserve real borders and focus outlines when decorative shadows disappear, including in forced-colors mode. Surface changes update CSS without remounting native editors or changing submitted values. See the [styling guide](../STYLING.md#surface-depth) for the exact contract and flat preset.

## Consequences and validation

- Theme common colors and rounding without `::part`. Keep deliberate parts and custom states for detailed component variants; do not expose arbitrary shadow descendants as API.
- Public defaults remain consumption fallbacks, not declarations that shadow inherited tokens. The adapter's internal properties are not public API. Its current-element selector must grow with the catalog.
- Light/Dark appearances with independently selected palettes in both demo pages use tokens for the common theme. All twenty-four elements retain an individual CSS recipe with the exact preview source available for copying; Native Field uses ordinary child selectors and other elements use public parts.
- Focus, invalid, disabled, and selected states retain visible behavior. Browser checks cover nested and host overrides, semantic role separation, adapter precedence and missing values, radius derivation, light/dark contrast, forced colors, and FormData preservation. Firefox runs in the Linux CI container; direct macOS Firefox automation remains unavailable.
- `selected-option` and `selected-tab` parts follow live state; Toggle exposes pressed and Switch exposes checked custom states. Native light-DOM fields can opt into `h6-field` for the shared base and use ordinary application CSS for details.
- Revisit when a reasonable design requires private DOM access or a new element needs an additional semantic role. Keep exact values and the token inventory in the styling guide and stylesheet sources.

Select and Combobox consume `--hp-popover` / `--hp-popover-foreground` for popup surfaces and text, with accent roles for highlighted options. The shadow-local top-layer approach in [ADR-0008](0008-selection-popups.md) preserves inherited tokens and public parts.

Date Range Picker uses the same popup tokens, primary boundary colors, accent span colors, and a separate preview part. Its Base/Outlined range examples extend the adapter host selector without new theme roles.

## References

- [Playground design](../PLAYGROUND.md)
- [Theme resolution](../../src/theme.ts)
- [Light/dark presets](../../demo/themes.css)
- [shadcn adapter](../../demo/shadcn.css)
- [React Aria Button](https://react-aria.adobe.com/Button)
- [React Aria TextField](https://react-aria.adobe.com/TextField)
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming)
- [Styling guide](../STYLING.md)

- [MDN: CSS shadow parts](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::part)
- [MDN: custom state selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:state)

Native Button primitives use an optional generated `dist/native.css` and the `hp-button` class, rather than a shadow wrapper. The stylesheet shares the same token, radius, and surface helpers, preserves ordinary CSS overrides, and works without JavaScript. The gallery includes a native Button recipe alongside twenty-four element recipes. Shadow controls continue to include their complete neutral bases. Checkbox, Radio Group, Number Input, Password Input, and Toggle Group follow the existing parts and semantic-theme contract.

Native Field applies scoped defaults to its slotted input, textarea, or select using the same semantic tokens. It leaves the editor in light DOM: ordinary application selectors can override its base, and the control exposes no shadow part. This deliberately preserves native ownership and editable CSS at the cost of isolation from existing application input styles. The shadcn adapter resolves on both the wrapper and native child for local theme overrides.

Shadow DOM does not remove user-agent styling. Set the properties needed for the base explicitly; do not use `all: unset` or a document-wide reset. A shared CSS factory produces Native Field's built-in slotted styles and the optional `native.css` rules, which opt in only through `h6-field`. The stylesheet uses a cascade layer and supplies the same base before registration or without JavaScript. Native select appearance and platform popups remain browser-controlled. The [native fields guide](../NATIVE-FIELDS.md) records integration, supported types, and override behavior.

## Changes

- 2026-10-22: Proposed a platform CSS contract and a two-theme validation experiment. The prototype now exercises the styling surface through Studio and Utility themes; the surface can still change before publication.
- 2026-10-23: Replaced violet defaults with a neutral Base palette. Added copyable recipes for all eight elements, a shared semantic-token adapter, and the stateful segmented-option part.

- 2026-10-23: Moved the complete base into shadow styles, reduced the external CSS to a theme adapter, aligned type and editor metrics, and replaced font glyphs with centered SVG icons. Added the `remove-icon` part and checks without application CSS.

- 2026-10-23: Added built-in styles and Pill, Boxed, and Underline recipes for Toggle, Accordion, and Tabs; selected-tab and pressed state expose live styling hooks.

- 2026-10-23: Adopted the `--hp-` semantic theme contract, multiplicative radii, separate prefixed presets and shadcn adapter, and Light/Dark examples. Replaced the pre-release ad hoc tokens; preserved component parts and form behavior.

- 2026-10-23: Added numeric-element parts/recipes and independent palette selection. Included MIT-attributed official Blue, Green, Orange, and Rose accent overlays as a curated selection; retained Neutral and custom Utility, without claiming popularity statistics.

- 2026-10-23: Derive numeric marks from primary/foreground rather than using deep primary surfaces as standalone icon/stroke colors; verify at least 3:1 track/surface contrast for every bundled palette and appearance.

- 2026-10-24: Added Select/Combobox recipes, host-local shadcn mappings, and real consumers of popover surface/text roles, retaining tokens in the native top layer.

- 2026-10-24: Added Date Picker parts and Base/Framed calendar recipes, including selected-day/today states and inherited popup tokens.

- 2026-10-26: Added Date Range Picker under ADR-0010 with two native editors, shared calendar views, named ISO boundaries, and inherited theme recipes.

- 2026-10-29: Added shared surface-shadow roles inspired by React Aria, explicit-scheme Light/Dark shading, and an independent Layered/Flat comparison in both demos. Preserve the shadcn color/radius contract and existing form behavior.

- 2026-10-29: Added everyday controls and the native Button contract; documented mixed selection, host-owned forms, and the required Zag/native editing adaptations.

- 2026-10-29: Added targeted native-field defaults through `h6-field`, ordinary CSS overrides, and a shared optional stylesheet for operation without JavaScript. Documented the distinction between shadow encapsulation and browser default styles.
