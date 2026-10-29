# Formatted identifiers and verification codes

Formatting is presentation and editing behavior, separate from validation and submission. IBAN and OTP each retain one real text input in shadow DOM; their form-associated hosts contribute one canonical string. Neither control adds proxy fields, multiple character editors, or automatic submission.

## IBAN

```html
<label for="account">IBAN</label>
<h6-iban id="account" name="iban" value="DE89370400440532013000" required></h6-iban>
```

The editor displays `DE89 3704 0044 0532 0130 00`; FormData receives `DE89370400440532013000`. Defaults and silent `.value` assignments use uppercase groups of four. `.value` remains canonical, `.displayValue` returns the current editor string, and `.defaultValue` describes the declared default.

Typing and paste normalize case and grouping. Generated separators are presentation, so a collapsed Backspace/Delete skips a separator to delete a neighboring character; explicitly selecting a separator does not delete an additional character. Invalid non-whitespace characters remain available for correction and validation. Grouping does not establish account existence or ownership.

The browser retains the native caret, selection, horizontal scrolling, copy/cut, and undo/redo. Formatting replaces the smallest changed text range through native editing commands, rather than assigning `input.value` during user edits. History operations are not immediately reformatted, so undo can restore the earlier text exactly.

## OTP and PIN presentation

```html
<label for="verification">Verification code</label>
<h6-otp id="verification" name="code" value="004271" length="6" required></h6-otp>

<label for="pin">Four-digit code</label>
<h6-otp id="pin" name="pin" length="4" autocomplete="off" required></h6-otp>
```

`length` defaults to six and accepts integers from one through twelve; unsupported values fall back to six. It controls the number of decorative cells, default numeric pattern, and default native maximum length. Set `pattern`, `inputmode`, and `autocomplete` explicitly for other character policies. An explicit pattern or maximum length remains the caller's policy when length changes.

There is one input and one Tab stop. Its native text is spaced to match the decorative cells. Arrow keys move within that input; Shift+Arrow and Select All select a continuous range, and Backspace/Delete operate on that range. The active cell, selected cells, and caret reflect the native selection. Pointer selection still belongs to the native input. Cells are hidden from assistive technology; the input retains the field's accessible name and complete value.

The string retains leading zeros. Whitespace-separated pasted codes use one native edit and contribute the unspaced value. Native maximum length limits user entry; an overlong programmatic value remains visible in a plain editor with validation instead of hiding characters beyond the cells. This is visible code entry, not password masking. No focus advance between editors or completion-triggered submission occurs.

The default hints are `inputmode="numeric"` and `autocomplete="one-time-code"`. These are hints, not certification of mobile SMS autofill or password-manager integration. Physical-device and manual assistive-technology checks remain open.

## Styling

Both controls retain their built-in neutral base, inherited `--hp-*` tokens, Light/Dark themes, and Layered/Flat surfaces. The gallery supplies an underlined IBAN recipe and an underlined-slot OTP recipe using the displayed CSS.

OTP exposes `control`, `slots`, `slot`, `filled-slot`, `active-slot`, `selected-slot`, and `input` parts. `--hp-otp-slot-size` controls preferred cell width (default `2.5rem`); `--hp-otp-gap` controls spacing (default `.5rem`); `--hp-otp-font-size` controls digit size (default `1.25rem`). Height follows `--hp-control-height`. The layout adapts to available width and root text size. Focus and selection remain distinct, and the decorative caret respects reduced motion and forced colors.

Use parts for cell borders, surfaces, and radius, and the tokens for dimensions. The native input's padding, letter spacing, and width are geometry owned by the presentation layer; overriding those directly can misalign its text and pointer selection with the cells.

## Compatibility decision and evidence

There is currently no standard input replacement API that preserves native undo across this formatting step. The implementation uses the legacy `execCommand("insertText")` editing command with a reentrancy guard and minimal changed ranges. This API is deprecated and needs compatibility checks. It does not access the clipboard. Paste reads the event's supplied text, not the system clipboard through a separate permission.

Unsupported or failed commands leave ordinary native editing available, with canonical normalization and validation still active. The component does not substitute direct value assignment or a separate undo stack. Composition is not rewritten while active. History restore/reset and explicit property assignments may replace native text as programmatic operations.

The browser suite checks grouped defaults, assignments, invalid characters, middle edits, separator deletion, native undo/redo, whitespace paste and event counts, one-editor OTP selection, four-digit configuration, reset, fieldsets, overlong drafts, unsupported-command fallback, responsive geometry, Light/Dark, text scaling, and forced colors. Browser-engine checks do not establish device autofill or assistive-technology usability.

References: [native edit history and execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand), [beforeinput limits](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event), and [input-otp's one-input presentation model](https://input-otp.rodz.dev/). input-otp is a mechanism reference, not a runtime dependency or a source of copied implementation code.
