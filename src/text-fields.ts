import { normalizeIdentifier, validateBic, validateIban } from "./validation.js";
import type { FieldValidation } from "./validation.js";
import { hostStyles, inputStyles } from "./styles.js";
import { fieldLabel, referencedText } from "./field-label.js";
import { NativeTextFormat, groupedIban, ibanFormat } from "./native-format.js";
import { OtpPresentation } from "./otp-presentation.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  ${inputStyles}
</style><input part="input" type="text">`;

/** A native editor with a separate canonical value owned by ElementInternals. */
export class H6TextField extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "readonly", "required", "pattern", "minlength", "maxlength", "placeholder", "autocomplete", "inputmode", "aria-label"];
  protected readonly internals = this.attachInternals();
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
    this.internals.role = "group";
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
    if (name === "value" && !this.#dirty) this.#input.value = this.defaultDisplayValue;
    this.refresh();
  }
  get input(): HTMLInputElement { return this.#input; }
  get value(): string { return this.normalizeValue(this.#input.value); }
  set value(value: string) { this.#dirty = true; this.#input.value = this.presentValue(String(value)); this.refresh(); }
  get displayValue(): string { return this.#input.value; }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  protected get defaultDisplayValue(): string { return this.defaultValue; }
  protected get dirty(): boolean { return this.#dirty; }
  protected markDirty(): void { this.#dirty = true; }
  protected presentValue(value: string): string { return this.normalizeValue(value); }
  set defaultValue(value: string) { this.setAttribute("value", value); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
  get form(): HTMLFormElement | null { return this.internals.form; }
  get labels(): NodeList { return this.internals.labels; }
  get validity(): ValidityState { return this.internals.validity; }
  get validationMessage(): string { return this.internals.validationMessage; }
  get willValidate(): boolean { return this.internals.willValidate; }
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
    this.internals.setFormValue(value, input.value);
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
    this.internals.setValidity(flags, message, input);
    this.toggleAttribute("data-touched", this.#touched);
    input.setAttribute("aria-invalid", String(this.#touched && !this.validity.valid));
  }
  setCustomValidity(message: string): void { this.#externalError = String(message); this.refresh(); }
  checkValidity(): boolean { return this.internals.checkValidity(); }
  reportValidity(): boolean { return this.internals.reportValidity(); }
  override focus(options?: FocusOptions): void { this.#input.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.refresh(); }
  formResetCallback(): void { this.#dirty = false; this.#input.value = this.defaultDisplayValue; this.#touched = false; this.refresh(); }
  formStateRestoreCallback(state: string): void { this.#dirty = true; this.#input.value = state; this.refresh(); }
  #label(): void {
    this.#input.setAttribute("aria-label", fieldLabel(this, this.labels, "Text field"));
    this.#input.setAttribute("aria-description", referencedText(this, "aria-describedby"));
  }
  #onInput = (event: Event): void => {
    this.#dirty = true;
    if (event instanceof InputEvent && event.isComposing) return;
    // Canonical serialization does not assign the editor's value.
    this.refresh();
  };
}

export class H6Iban extends H6TextField {
  #format = new NativeTextFormat(this.input, ibanFormat);
  protected override get defaultDisplayValue(): string { return groupedIban(this.defaultValue); }
  protected override presentValue(value: string): string { return groupedIban(value); }
  override connectedCallback(): void { this.#format.connect(); super.connectedCallback(); }
  disconnectedCallback(): void { this.#format.disconnect(); }
  override normalizeValue(value: string): string { return normalizeIdentifier(value); }
  override validateValue(value: string): FieldValidation { return validateIban(value); }
}
export class H6Bic extends H6TextField {
  override normalizeValue(value: string): string { return normalizeIdentifier(value); }
  override validateValue(value: string): FieldValidation { return validateBic(value); }
}
export class H6Otp extends H6TextField {
  static override observedAttributes = [...H6TextField.observedAttributes, "length"];
  #presentation = new OtpPresentation(this.input);
  #format = new NativeTextFormat(this.input, (value, caret) => ({ value: value.replace(/\s/g, "").slice(0, this.length), caret: Math.min(value.slice(0, caret).replace(/\s/g, "").length, this.length) }));
  get length(): number { const length = Number(this.getAttribute("length") ?? 6); return Number.isInteger(length) && length >= 1 && length <= 12 ? length : 6; }
  set length(value: number) { this.setAttribute("length", String(value)); }
  protected override get defaultDisplayValue(): string { return this.normalizeValue(this.defaultValue); }
  override connectedCallback(): void { this.#presentation.connect(); this.#format.connect(); super.connectedCallback(); }
  disconnectedCallback(): void { this.#presentation.disconnect(); this.#format.disconnect(); }
  override refresh(): void { super.refresh(); if (!this.hasAttribute("maxlength")) this.input.maxLength = this.length; this.#presentation?.sync(this.length); }
  override get defaultPattern(): string { return `[0-9]{${this.length}}`; }
  override get defaultInputMode(): string { return "numeric"; }
  override get defaultAutocomplete(): AutoFill { return "one-time-code"; }
  override normalizeValue(value: string): string { return value.replace(/\s/g, ""); }
  override validateValue(_value: string): FieldValidation { return { message: "", detail: `${this.length} visual slots, one text input. Leading zeros stay intact.` }; }
}
