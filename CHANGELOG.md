# Changelog

User-visible changes to html+. No package has been published yet, so everything is unreleased and element APIs may still change. Earlier history is in the Git log.

## Unreleased

### Added

- One import per element, such as `htmlplus/iban`, that registers just that element. `htmlplus` registers all of them, and every entry is safe to import during server rendering.
- A packable npm structure with separate modules for bundlers, a prebuilt `browser/` folder, and JSX types for React 19 in `htmlplus/react`.
- [Element sizes](docs/SIZES.md), generated per element.
- Project site at the root of the Pages deployment. The playground and styling gallery moved to `/demo/`.
- Generated [element reference](docs/ELEMENTS.md) and `custom-elements.json` manifest.
- Apache License 2.0.
- `CONTRIBUTING.md`, `SECURITY.md`, and a [forms and validation guide](docs/FORMS.md).

### Changed

- Assigning the value a focused editor already holds no longer rewrites its text, so controlled frameworks keep the caret, undo, and drafts.
- Modules no longer expose unregistered classes at `dist/src/<name>.js` as an API. Import `htmlplus/<name>`.
- Enter in a text editor now submits the form like a native field.
- Number Input no longer accepts group separators; they produce an invalid draft.
- `aria-invalid` and error styling now appear on every control only after a blur or a failed submission.
- `<option>` handling is the same on Select, Combobox, Segmented, Radio Group, and Toggle Group. A selection whose option is disabled or removed returns if the option comes back.
- IBAN and BIC format errors report `patternMismatch`; Duration bounds report `rangeUnderflow` and `rangeOverflow`.
- Host `change` events are composed on every control. Password Input's `visibilitychange` no longer bubbles.
- Browser modules are minified.

### Fixed

- Number Input erased a value containing a separator on blur, and could read `1,5` as `15`.
- An unusable inherited `lang` disabled date fields and blocked their form.
- Password Input kept its plaintext in session history.
- Properties set before an element upgraded were ignored or inconsistent.
- Accessible names could include option text or go stale after a label changed.
- `step="any"` disabled Number Input and Slider.
- Date fields corrupted values in the `te` and `ky` locales on WebKit.
- Assigning `null` or a number to `.value` could throw or produce the text `NULL`.
- IBAN accepted check digits outside 02–98, and `maxlength` on IBAN blocked valid input.
