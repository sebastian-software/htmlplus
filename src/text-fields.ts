import { normalizeIdentifier, validateBic, validateIban } from "./validation.js";
import type { FieldValidation } from "./validation.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  :host { display: block; font: inherit; }
  input { box-sizing: border-box; display: block; width: 100%; min-width: 0; height: 47px; padding: 11px 13px; border: 1px solid var(--h6-border, #d8d3e3); border-radius: var(--h6-radius, 9px); background: var(--h6-surface, white); color: inherit; outline: none; font: inherit; font-size: 14px; }
  input:focus { border-color: var(--h6-accent, #6540cb); box-shadow: 0 0 0 3px var(--h6-focus-soft, #eee8fc); }
  input::placeholder { color: var(--h6-placeholder, #96909e); }
  input:disabled { opacity: .5; }
  :host([data-touched]:invalid) input { border-color: var(--h6-danger, #af3c41); }
</style><input part="input" type="text">`;

/** A native editor with a separate canonical value owned by ElementInternals. */
export class H6TextField extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "readonly", "required", "pattern", "minlength", "maxlength", "placeholder", "autocomplete", "inputmode", "aria-label"];
  #internals = this.attachInternals();
  #input: HTMLInputElement;
  #dirty = false;
  #formDisabled = false;
  #externalError = "";
  #touched = false;
  detail = "";

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.append(template.content.cloneNode(true));
    this.#input = root.querySelector("input")!;
    this.#input.spellcheck = false;
    this.#internals.role = "group";
    this.#input.addEventListener("input", this.#onInput);
    this.#input.addEventListener("change", (event) => {
      event.stopPropagation();
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.#input.addEventListener("compositionend", () => this.refresh());
    this.#input.addEventListener("blur", () => { this.#touched = true; this.refresh(); });
    this.addEventListener("invalid", () => { this.#touched = true; this.refresh(); });
  }

  connectedCallback(): void { this.refresh(); queueMicrotask(() => this.#label()); }
  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.#dirty) this.#input.value = this.defaultValue;
    this.refresh();
  }
  get input(): HTMLInputElement { return this.#input; }
  get value(): string { return this.normalizeValue(this.#input.value); }
  set value(value: string) { this.#dirty = true; this.#input.value = this.normalizeValue(String(value)); this.refresh(); }
  get displayValue(): string { return this.#input.value; }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  set defaultValue(value: string) { this.setAttribute("value", value); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
  get form(): HTMLFormElement | null { return this.#internals.form; }
  get labels(): NodeList { return this.#internals.labels; }
  get validity(): ValidityState { return this.#internals.validity; }
  get validationMessage(): string { return this.#internals.validationMessage; }
  get willValidate(): boolean { return this.#internals.willValidate; }
  get defaultPattern(): string { return ""; }
  get defaultInputMode(): string { return "text"; }
  get defaultAutocomplete(): AutoFill { return "off"; }
  normalizeValue(value: string): string { return value; }
  validateValue(_value: string): FieldValidation { return { message: "", detail: "" }; }

  refresh(): void {
    const input = this.#input;
    input.disabled = this.disabled || this.#formDisabled;
    input.readOnly = this.readOnly;
    input.placeholder = this.getAttribute("placeholder") ?? "";
    input.inputMode = this.getAttribute("inputmode") ?? this.defaultInputMode;
    input.setAttribute("autocomplete", this.getAttribute("autocomplete") ?? this.defaultAutocomplete);
    input.setAttribute("aria-required", String(this.required));
    for (const attribute of ["minlength", "maxlength"]) {
      if (this.hasAttribute(attribute)) input.setAttribute(attribute, this.getAttribute(attribute)!);
      else input.removeAttribute(attribute);
    }
    this.#label();
    const value = this.value;
    this.#internals.setFormValue(value, input.value);
    const result = this.validateValue(value);
    this.detail = result.detail;
    let flags: ValidityStateFlags = {};
    let message = "";
    if (!this.readOnly) {
      if (this.#externalError) { flags = { customError: true }; message = this.#externalError; }
      else if (this.required && !value) { flags = { valueMissing: true }; message = "Fill out this field."; }
      else if (value && result.message) { flags = { customError: true }; message = result.message; }
      else if (value) {
        const pattern = this.getAttribute("pattern") ?? this.defaultPattern;
        let mismatch = false;
        if (pattern) {
          try { mismatch = !new RegExp(`^(?:${pattern})$`, "v").test(value); } catch { /* HTML ignores invalid patterns. */ }
        }
        const min = this.getAttribute("minlength");
        const max = this.getAttribute("maxlength");
        if (mismatch) { flags = { patternMismatch: true }; message = "Match the requested format."; }
        else if (min !== null && value.length < Number(min)) { flags = { tooShort: true }; message = `Use at least ${min} characters.`; }
        else if (max !== null && value.length > Number(max)) { flags = { tooLong: true }; message = `Use no more than ${max} characters.`; }
      }
    }
    this.#internals.setValidity(flags, message, input);
    this.toggleAttribute("data-touched", this.#touched);
    input.setAttribute("aria-invalid", String(this.#touched && !this.validity.valid));
  }
  setCustomValidity(message: string): void { this.#externalError = String(message); this.refresh(); }
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  override focus(options?: FocusOptions): void { this.#input.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.refresh(); }
  formResetCallback(): void { this.#dirty = false; this.#input.value = this.defaultValue; this.#touched = false; this.refresh(); }
  formStateRestoreCallback(state: string): void { this.#dirty = true; this.#input.value = state; this.refresh(); }
  #label(): void {
    this.#input.setAttribute("aria-label", this.getAttribute("aria-label") || Array.from(this.labels).map((label) => label.textContent?.trim()).filter(Boolean).join(" ") || "Text field");
  }
  #onInput = (event: Event): void => {
    this.#dirty = true;
    if (event instanceof InputEvent && event.isComposing) return;
    // The editor's raw text is never rewritten, preserving native undo and selection.
    this.refresh();
  };
}

export class H6Iban extends H6TextField {
  override normalizeValue(value: string): string { return normalizeIdentifier(value); }
  override validateValue(value: string): FieldValidation { return validateIban(value); }
}
export class H6Bic extends H6TextField {
  override normalizeValue(value: string): string { return normalizeIdentifier(value); }
  override validateValue(value: string): FieldValidation { return validateBic(value); }
}
export class H6Otp extends H6TextField {
  override get defaultPattern(): string { return "[0-9]{6}"; }
  override get defaultInputMode(): string { return "numeric"; }
  override get defaultAutocomplete(): AutoFill { return "one-time-code"; }
  override normalizeValue(value: string): string { return value.replace(/\s/g, ""); }
  override validateValue(_value: string): FieldValidation { return { message: "", detail: "One text input. Leading zeros stay intact." }; }
}
