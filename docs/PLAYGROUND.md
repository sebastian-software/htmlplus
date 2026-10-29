# Playground design

## Purpose and layout

This is an operating surface for developers exploring form behavior. The main action is editing a real field and inspecting its submitted value. Put the actual form beside a live FormData inspector; keep the inspector sticky on wide screens and stack it after the form on small screens. Submission captures a local snapshot. Reset and fieldset disabling expose browser behavior directly.

The page opens with the playground rather than a marketing section. Component names annotate real fields; the lower section explains the integration. Tables preserve repeated keys. The JSON view explicitly groups repeated names into arrays rather than dropping them.

The twenty-four elements start with a Zag toggle, contact-detail tabs, and delivery-instruction accordion, followed by identifiers and verification, options and search, numeric choices, values with more to say, choices and collections, everyday controls, and styled native HTML. Each added field demonstrates a distinct form contract: duration notation becomes seconds, an interval supplies two named entries, and segmented radio choices submit an identifier. The inspector remains sticky while browsing the longer form, with its entry list scrolling inside a bounded height. The initial thirty-three entries include ordinary fields in inactive panels and three additional wrapped native controls. Pressing the priority toggle adds one entry; closing a section removes none. Interactive validation reveals the first invalid section, including nested form-associated fields.

## Visual direction

Use the **html+** wordmark and a simple plus favicon. The home link's accessible name spells out "html plus". Show **htmlplus.dev** as the project domain. [ADR-0006](adr/0006-project-identity.md) owns the project identity.

Base uses a neutral canvas (`#fafafa`), white field surface (`#ffffff`), dark text and primary actions (`#171717`), gray borders (`#d4d4d4`), and a charcoal inspector (`#171717`). System sans is the interface face; system monospace identifies code and submitted values. Component fallbacks are also neutral. No remote fonts or image assets are required.

The independent Palette picker adds the official Blue, Green, Orange, and Rose accent overlays, preserving Neutral and custom Utility. Appearance independently chooses Light or Dark. The header uses a two-column picker row on narrow screens. The inspector is the main visual contrast. Surrounding controls stay quiet, with clear labels, normal sentence case, limited motion, and visible focus. Dark uses a separate neutral palette, light text, and native dark color-scheme. Utility uses blue and tighter corners through semantic tokens alone to demonstrate the public styling surface with unchanged markup and form behavior. This directly tests the library's styling goal.

## Styling gallery

The playground links to `styling.html`, with direct fragment links from each element annotation. A compact element navigation leads to two live previews, their actual form entries, documented styling hooks, and selectable CSS/HTML source. The complete neutral base is built into each element. Native Field demonstrates ordinary child selectors rather than shadow parts. The downloadable `themes.css` provides prefixed Light/Dark palettes. The separate `shadcn.css` adapter connects existing application themes; the Base preview needs no adapter. Both pages have an Appearance picker. A Theme CSS disclosure in the playground and the gallery source tabs show the actual presets; the gallery also exposes the adapter source. Typography and SVG icon geometry follow the general shadcn/ui idea of a useful, editable starting point. Recipe CSS has one source shared by the live preview and copy panel. Mobile layouts stack the previews and wrap component navigation; source scrolls inside its own panel. Clipboard failure leaves the source selectable and explains how to copy it manually.

## Required states and evidence

Check populated and invalid fields, repeated keys, omitted unchecked values, disabled fieldsets, restored defaults, local submission feedback, and both data views. Verify narrow-screen overflow, keyboard access, and reduced motion. Keep error and submission feedback separate from the changing data panel; do not announce every keystroke as a live region.

Automated tests save desktop Light/Dark, mobile theme, and styling-gallery screenshots for visual review. Mobile viewport checks are layout evidence, not physical-device or OTP autofill certification.

The numeric section demonstrates a volume slider, a two-thumb price filter with explicit boundary names, and a clearable experience rating. Each has a styling deep link and a built-in current-value display. Rating preview does not enter FormData; clearing the sample score removes its entry.

The Options & search section adds a clearable Shipping method Select and searchable Destination country Combobox. Defaults submit `shipping=standard` and `country=DE`. Editing a query immediately removes the old country entry; selecting a result restores an identifier. Their top-layer popups stay themed in Light/Dark and link directly to individual styling recipes.

A required Delivery date joins Options & search. The en-US editor starts at `10/28/2026`, while FormData receives `delivery_date=2026-10-28`. Its calendar uses the shared themed top layer, with day/month/year navigation. Invalid or incomplete drafts stay visible and contribute no date entry. The Date Picker recipe includes Base and Framed calendar previews.

A required Travel period follows Delivery date. Its two labeled native editors start at `10/28/2026` and `11/03/2026`, contributing `period.start=2026-10-28` and `period.end=2026-11-03`. A new calendar start removes the previous end until the second selection. Hover never changes entries; unfinished ranges block native validation. The gallery compares Base and Outlined range with copyable source in Light/Dark.

The everyday controls section adds Radio Group, Number Input, Password Input, Toggle Group, and a tri-state table selection example. The header checkbox derives its state from the three example rows and contributes no entry. Two selected row identifiers and two export formats demonstrate repeated keys. The password is fictional and intentionally visible in the inspector. Native form actions use the optional Button stylesheet. Each new control and the Button family links to its Base/styled recipe.

IBAN displays uppercase groups of four while the inspector keeps its whitespace-free value. Verification code displays six decorative cells with one native text input; selection, arrows, paste, deletion, and undo stay within that editor. The gallery demonstrates underlined cells and the length option supports shorter codes. [Formatted fields](FORMATTED-FIELDS.md) records editing and compatibility details.

The Native HTML section demonstrates Reference input, Message textarea, and Reply via select inside `h6-field`. Their original controls own labels, values, validation, and reset, and their entries update the same inspector. Native fields in Tabs and Accordion use the wrapper too. The gallery compares Base and Underlined fields in Light/Dark; its copied HTML includes optional `native.css` for styling before registration or without JavaScript. [Native fields](NATIVE-FIELDS.md) documents the light-DOM contract and targeted base styles.
