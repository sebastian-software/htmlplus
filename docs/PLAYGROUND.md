# Playground design

## Purpose and layout

This is an operating surface for developers exploring form behavior. The main action is editing a real field and inspecting its submitted value. Put the actual form beside a live FormData inspector; keep the inspector sticky on wide screens and stack it after the form on small screens. Submission captures a local snapshot. Reset and fieldset disabling expose browser behavior directly.

The page opens with the playground rather than a marketing section. Component names annotate real fields; the lower section explains the integration. Tables preserve repeated keys. The JSON view explicitly groups repeated names into arrays rather than dropping them.

The eleven elements start with a Zag toggle, contact-detail tabs, and delivery-instruction accordion, followed by identifiers and verification, values with more to say, and choices and collections. Each added field demonstrates a distinct form contract: duration notation becomes seconds, an interval supplies two named entries, and segmented radio choices submit an identifier. The inspector remains sticky while browsing the longer form, with its entry list scrolling inside a bounded height. The initial fourteen entries include ordinary fields in inactive panels. Pressing the priority toggle adds one entry; closing a section removes none. Interactive validation reveals the first invalid section, including nested form-associated fields.

## Visual direction

Use the **html+** wordmark and a simple plus favicon. The home link's accessible name spells out "html plus". Show **htmlplus.dev** as the project domain. [ADR-0006](adr/0006-project-identity.md) owns the project identity.

Base uses a neutral canvas (`#fafafa`), white field surface (`#ffffff`), dark text and primary actions (`#171717`), gray borders (`#d4d4d4`), and a charcoal inspector (`#171717`). System sans is the interface face; system monospace identifies code and submitted values. Component fallbacks are also neutral. No remote fonts or image assets are required.

The inspector is the main visual contrast. Surrounding controls stay quiet, with clear labels, normal sentence case, limited motion, and visible focus. The second Utility theme uses blue, tighter corners, and different control parts to demonstrate the public styling surface with unchanged markup and form behavior. This directly tests the library's styling goal.

## Styling gallery

The playground links to `styling.html`, with direct fragment links from each element annotation. A compact element navigation leads to two live previews, their actual form entries, documented parts, and selectable CSS/HTML source. The complete neutral base is built into each element. The downloadable `base.css` is an optional token adapter; the Base preview uses no adapter class. Typography and SVG icon geometry follow the general shadcn/ui idea of a useful, editable starting point. Recipe CSS has one source shared by the live preview and copy panel. Mobile layouts stack the previews and wrap component navigation; source scrolls inside its own panel. Clipboard failure leaves the source selectable and explains how to copy it manually.

## Required states and evidence

Check populated and invalid fields, repeated keys, omitted unchecked values, disabled fieldsets, restored defaults, local submission feedback, and both data views. Verify narrow-screen overflow, keyboard access, and reduced motion. Keep error and submission feedback separate from the changing data panel; do not announce every keystroke as a live region.

Automated tests save desktop Base, mobile Utility, and styling-gallery screenshots for visual review. Mobile viewport checks are layout evidence, not physical-device or OTP autofill certification.
