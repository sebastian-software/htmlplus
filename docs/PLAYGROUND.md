# Playground design

## Purpose and layout

This is an operating surface for developers exploring form behavior. The main action is editing a real field and inspecting its submitted value. Put the actual form beside a live FormData inspector; keep the inspector sticky on wide screens and stack it after the form on small screens. Submission captures a local snapshot. Reset and fieldset disabling expose browser behavior directly.

The page opens with the playground rather than a marketing section. Component names annotate real fields; the lower section explains the integration. Tables preserve repeated keys. The JSON view explicitly groups repeated names into arrays rather than dropping them.

The eight fields are grouped into identifiers and verification, values with more to say, and choices and collections. Each added field demonstrates a distinct form contract: duration notation becomes seconds, an interval supplies two named entries, and segmented radio choices submit an identifier. The inspector remains sticky while browsing the longer form.

## Visual direction

Studio uses a pale lavender canvas (`#f5f4f9`), white field surface (`#ffffff`), plum text (`#292335`), violet accent (`#6540cb`), neutral border (`#dedbe7`), and a deep plum inspector (`#252034`). Humanist Avenir Next/system sans is the interface face; system monospace identifies code and submitted values. No remote fonts or image assets are required.

The inspector is the main visual contrast. Surrounding controls stay quiet, with clear labels, normal sentence case, limited motion, and visible focus. The second Utility theme uses blue, tighter corners, and different control parts to demonstrate the public styling surface with unchanged markup and form behavior. This directly tests the library's styling goal.

## Required states and evidence

Check populated and invalid fields, repeated keys, omitted unchecked values, disabled fieldsets, restored defaults, local submission feedback, and both data views. Verify narrow-screen overflow, keyboard access, and reduced motion. Keep error and submission feedback separate from the changing data panel; do not announce every keystroke as a live region.

Automated tests save desktop Studio and mobile Utility screenshots for visual review. Mobile viewport checks are layout evidence, not physical-device or OTP autofill certification.
