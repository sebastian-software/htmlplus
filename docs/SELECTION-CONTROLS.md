# Select and Combobox

`h6-select` and `h6-combobox` use Zag 1.46.0 behind native form-associated custom elements. Both support one selected identifier from direct child options. Combobox adds an editable query over supplied option labels. Applications own the options and any remote requests.

```html
<label for="shipping">Shipping method</label>
<h6-select id="shipping" name="shipping" value="standard" required>
  <option value="economy">Economy</option>
  <option value="standard">Standard</option>
  <option value="express">Express</option>
</h6-select>

<label for="destination">Destination country</label>
<h6-combobox id="destination" name="country" value="DE" required>
  <option value="AT">Austria</option>
  <option value="DE">Germany</option>
  <option value="NL">Netherlands</option>
</h6-combobox>
```

## Values, queries, and options

- `.value` is the selected identifier or `""` while unanswered. Only an enabled, known identifier contributes a form entry. Empty or unknown selections contribute none. Labels and queries are never submitted in its place.
- `.defaultValue` reflects the `value` attribute. Changing the attribute updates the current value until user interaction or property assignment makes it dirty. Reset restores the declared default. No option is automatically selected merely because it is first.
- Combobox `.query` exposes its editor text separately. User editing immediately clears the previous selection, even when undo later restores the old label or the text exactly matches another option. Choose an option to establish a selection again. Programmatic `.query` changes clear a selection when the text differs from its label.
- User queries filter labels using a trimmed, case-insensitive substring match. Opening with the arrow button or keyboard shows the full supplied collection. This first version does not support custom submitted text, multiple selection, option groups, virtualization, or remote fetching.
- Direct `<option>` children supply nonempty identifiers, text or `label`, and `disabled`. The first duplicate identifier wins. Options can be added, removed, relabeled, reordered, and disabled. Invalidating a selected option clears that selection; a Combobox query remains editable. An invalidated selection does not silently return when the option returns.
- The visible Clear button returns to unanswered. `.clear()` does the same programmatically. Unknown property values produce no entry; a matching option supplied later can resolve that identifier.

## Events and forms

Selecting a different identifier or clearing a selected value emits one bubbling, composed `input`/`change` pair after form state is updated. Choosing the current identifier emits no duplicate commit. Combobox query edits emit one `input`; the first edit that invalidates a selection also emits `change`. Clearing query text without a selection emits `input` only. Native query blur does not create another selection commit.

Property assignment, changed options, reset, disabling, and restoration are silent. Native editor text remains in place during typing, undo, and composition; selecting or programmatically setting a value replaces it with the supplied label. Composition does not commit an option.

Both elements expose `name`, `form`, `labels`, `disabled`, `readOnly`, `required`, `placeholder`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`, and `setCustomValidity()`. The `form` attribute associates an external form. Disabled fieldsets omit their values. Readonly fields stay focusable and retain a selected value; opening, editing, and clearing are blocked. Custom errors persist until explicitly cleared. Interactive native validation focuses the trigger/editor and can reveal its containing Tabs or Accordion section.

`ElementInternals` is the only submission owner. There is no hidden select, hidden input, or named shadow input. Restoration state contains the selected identifier and query; exercising the restoration callback is not evidence of real history restoration.

## Popup, focus, and styling

Zag owns listbox navigation, typeahead for Select, query navigation for Combobox, highlighting, dismissal, and collision-aware positioning. Select uses a button with combobox semantics; Combobox uses a native text editor. Arrow keys navigate enabled options, Enter commits, Escape dismisses, and Tab leaves without committing a highlighted suggestion. External labels focus the trigger/editor. Clear returns focus there.

The popup stays in the component's shadow root and enters the native top layer through a manual popover. Floating UI, through Zag, uses fixed placement with viewport collision handling and the control's width. This escapes clipping ancestors while retaining inherited tokens and same-root ARIA references. Zag owns outside/Escape dismissal; native auto-popover dismissal is not a second state owner. No body portal is used. The current implementation requires the Popover API; it has no older-browser fallback.

Both elements include the neutral base. Select exposes `root`, `control`, `trigger`, `value-text`, `indicator`, `clear-button`, `positioner`, `content`, `option`, `selected-option`, `option-label`, `option-indicator`, and `empty`. Combobox replaces `value-text` with `input`. `:state(selected)` and `:state(open)` describe current state. `--hp-popover` / `--hp-popover-foreground` color the popup; `--hp-accent` / `--hp-accent-foreground` color highlighted options. The shadcn adapter resolves these on each host, including nested themes.

The gallery includes Quiet surface Select and Underlined search Combobox recipes, each beside its Base preview, with copyable HTML/CSS and Light/Dark appearances. The playground submits `shipping=standard` and `country=DE` by default. Search text alone removes the country entry and makes the required example unanswered.

## Evidence and limits

The browser checks cover selection, query invalidation, no-result queries, native undo, composition, disabled options and fieldsets, defaults, reset/restoration callbacks, reconnection, external form association, labels/descriptions, dynamic options, invalid-field revelation, clipping, viewport collision, dismissal, focus, and Light/Dark mobile recipes. The exported artifact includes both modules, positioning dependencies, presets, adapter, and third-party notices.

Physical-device pickers/autofill, manual assistive-technology combinations, real history restoration, and exact minimum browser versions remain unverified. Firefox cannot launch on this macOS host; the Linux CI matrix remains the verification path for that engine. These custom controls do not provide the native select's operating-system picker or browser-autofill integration.

See [ADR-0008](adr/0008-selection-popups.md) for rationale and tradeoffs and [ADR-0007](adr/0007-component-application-boundary.md) for application responsibilities.
