# Numeric choices

`h6-slider`, `h6-range-slider`, and `h6-rating` use Zag 1.46.0 through the vanilla adapter. The form-associated host owns submission, validity, reset/restoration, and public events. No hidden input or duplicate submission owner is rendered. All three include neutral styles, inherited `--hp-*` theme roles, individual styling recipes, and live form examples.

## Slider

```html
<label for="volume">Volume</label>
<h6-slider id="volume" name="volume" min="0" max="100" step="5" value="35"></h6-slider>
```

`.value` and `.defaultValue` are numbers. Defaults are `min=0`, `max=100`, `step=1`, and an initial value at `min`. The `value` attribute describes the reset default. A property assignment or user edit makes the current value dirty; subsequent default changes affect reset without overwriting the current value. Programmatic non-finite values throw. Values clamp and snap to steps anchored at `min`; a nonaligned maximum uses the last valid step below it. FormData contains the numeric string under the host's name.

`min`, `max`, and `step` have numeric properties and attributes. Bounds must be finite with `min < max`, a finite span/step ratio, and a positive step. Invalid configuration sets custom validity, omits the submitted value, and uses safe geometry until the configuration is corrected. Changing valid bounds re-normalizes the current value without inventing user events. Required does not add an empty state: a valid slider always has a number.

Horizontal sliders support Left/Right, Home/End, Page Up/Down, and Shift with the arrow keys for larger steps. Set `orientation="vertical"` for Up/Down and vertical geometry. The large step is ten times `step`. Set `dir="rtl"` on the host for a runtime direction change; initial direction can also inherit from its context. Track click/tap and thumb drag use Zag's pointer geometry. The base has a 24px thumb and 40px control height at a 16px root.

## Range Slider

```html
<label for="price">Price filter (USD)</label>
<h6-range-slider id="price" name="price" value="[100,350]"
  min="0" max="500" step="10"
  lower-name="price_min" upper-name="price_max"
  lower-label="Minimum" upper-label="Maximum"></h6-range-slider>
```

`.value` and `.defaultValue` are readonly pairs of finite numbers. The initial default is `[min, max]`, normalized to the step grid. Declarative values use a JSON pair. Missing or malformed defaults fall back to the endpoints. Programmatic malformed pairs throw; inverted pairs throw rather than silently swapping boundary identities. Normalization clamps/snaps each boundary. Equal boundaries are allowed. This is a bounded interval, unlike the nullable endpoints in `h6-interval`.

The host requires `name` to contribute entries. Default names are `name.min` and `name.max`; `lower-name` and `upper-name` override them. FormData contains two independent numeric strings, not JSON or bracket notation. JSON is used only for declarative defaults and internal restoration state.

Each thumb has a separate accessible name composed from the field label and `lower-label` / `upper-label` (default Minimum / Maximum). Both are keyboard reachable. Thumbs stop at each other without pushing, swapping identities, or requiring a positive gap. Their accessible min/max values follow the other boundary. Slider bounds, orientation, direction, and step behavior also apply here.

## Rating

```html
<label for="experience">Experience</label>
<h6-rating id="experience" name="experience" count="5" required></h6-rating>
```

`.value` and `.defaultValue` are a whole score from 1 through `count`, or `null` for unanswered. The default is unanswered, not a score of zero. The default count is five; this first scope supports 1–10 whole items. Invalid declarative count falls back to five; invalid property assignments throw. A missing, invalid, or out-of-scale default is unanswered. Reducing the count clamps an existing score to the new maximum without user events.

An unanswered rating contributes no entry. A selected score contributes one numeric string. `required` rejects unanswered state. The built-in Clear button clears through Zag, emits one input/change pair, and returns focus to the first item. `.clear()` clears programmatically without user events. Required ratings can still be cleared; validation then explains that a score is needed.

Hover highlights a preview but does not change the value, FormData, or checked radio. A click, Enter, Space on the initially focused item, arrow key, or Home/End commits a score through Zag. RTL reverses horizontal arrow navigation. Only the committed score is checked; the first item remains keyboard reachable when unanswered. Keyboard input ends pointer preview before entering Zag's focused-key behavior. Native buttons have `type="button"` so choosing or clearing never submits the form.

`readonly` keeps values submitted and focusable while preventing edits. `disabled` and disabled fieldsets omit the field. A clear button is disabled when unanswered, readonly, or disabled. Half scores are outside this implementation.

## Common form and styling contract

All three support `name`, `form`, `disabled`, `readonly`, `required`, `.form`, `.labels`, the validity properties and methods, `setCustomValidity()`, and `focus()`. External labels focus the slider's first thumb or rating's current/first item. Custom errors persist until explicitly cleared. The form-associated host handles disabled fieldsets and form reset; resetting or assigning a value does not emit user input/change events. Restoration callbacks restore stored values, but physical-device/browser history restoration is not claimed from those callback tests alone.

A slider emits `input` for each changed user value and one `change` at the end of a changed drag/track gesture or keyboard action. No-op gestures emit neither. Assigning a value from an input listener does not cancel the pending user commit. Rating commits emit one `input` followed by one `change`; hover emits neither. Events bubble and are composed. Programmatic updates do not imitate user events.

| Element | Public parts |
| --- | --- |
| Slider | `root`, `value-text`, `control`, `track`, `range`, `thumb` |
| Range Slider | Slider parts plus `lower-thumb`, `upper-thumb` |
| Rating | `root`, `label`, `control`, `item`, `selected-item`, `icon`, `clear-button`, `value-text` |

Rating also exposes `:state(rated)` for a committed score. Shared colors use `--hp-primary`, `--hp-primary-foreground`, `--hp-background`, `--hp-muted`, `--hp-muted-foreground`, `--hp-input`, `--hp-ring`, and `--hp-destructive`. Standalone slider ranges/thumb borders and rating highlights mix primary (65%) with foreground (35%) in OKLCH, preserving palette identity while keeping deep dark-mode accents visible. Browser checks require at least 3:1 contrast against both the track and base surface for every bundled palette/mode. Filled selected-item recipes can use the original primary/primary-foreground pair directly. `--hp-control-height` sets horizontal slider control height. Parts provide shape/detail variants; Zag's internal geometry variables and data attributes are not public styling contracts. The [styling guide](STYLING.md) documents theme integration and the shadcn adapter.

## Evidence and limits

Integrated Chromium/WebKit checks cover named values, empty/hover/committed rating states, keyboard and RTL/vertical behavior, pointer dragging, touch emulation, boundary collision, dirty defaults, reset, disabled fieldsets, readonly controls, custom errors, external forms, restoration callbacks, reconnects, label focus, no hidden inputs, built-in typography/text scaling, all palette/mode combinations, and mobile recipes. Touch emulation is not physical-device certification. Firefox on this host, manual screen-reader use, and real history restoration remain unverified.
