import { normalizeIdentifier, validateBic, validateIban } from "./validation.js";
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
    #input;
    #dirty = false;
    #formDisabled = false;
    #externalError = "";
    #touched = false;
    detail = "";
    constructor() {
        super();
        const root = this.attachShadow({ mode: "open", delegatesFocus: true });
        root.append(template.content.cloneNode(true));
        this.#input = root.querySelector("input");
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
    connectedCallback() { this.refresh(); queueMicrotask(() => this.#label()); }
    attributeChangedCallback(name) {
        if (name === "value" && !this.#dirty)
            this.#input.value = this.defaultValue;
        this.refresh();
    }
    get input() { return this.#input; }
    get value() { return this.normalizeValue(this.#input.value); }
    set value(value) { this.#dirty = true; this.#input.value = this.normalizeValue(String(value)); this.refresh(); }
    get displayValue() { return this.#input.value; }
    get defaultValue() { return this.getAttribute("value") ?? ""; }
    set defaultValue(value) { this.setAttribute("value", value); }
    get name() { return this.getAttribute("name") ?? ""; }
    set name(value) { this.setAttribute("name", value); }
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(value) { this.toggleAttribute("disabled", Boolean(value)); }
    get required() { return this.hasAttribute("required"); }
    set required(value) { this.toggleAttribute("required", Boolean(value)); }
    get readOnly() { return this.hasAttribute("readonly"); }
    set readOnly(value) { this.toggleAttribute("readonly", Boolean(value)); }
    get form() { return this.#internals.form; }
    get labels() { return this.#internals.labels; }
    get validity() { return this.#internals.validity; }
    get validationMessage() { return this.#internals.validationMessage; }
    get willValidate() { return this.#internals.willValidate; }
    get defaultPattern() { return ""; }
    get defaultInputMode() { return "text"; }
    get defaultAutocomplete() { return "off"; }
    normalizeValue(value) { return value; }
    validateValue(_value) { return { message: "", detail: "" }; }
    refresh() {
        const input = this.#input;
        input.disabled = this.disabled || this.#formDisabled;
        input.readOnly = this.readOnly;
        input.placeholder = this.getAttribute("placeholder") ?? "";
        input.inputMode = this.getAttribute("inputmode") ?? this.defaultInputMode;
        input.setAttribute("autocomplete", this.getAttribute("autocomplete") ?? this.defaultAutocomplete);
        input.setAttribute("aria-required", String(this.required));
        for (const attribute of ["minlength", "maxlength"]) {
            if (this.hasAttribute(attribute))
                input.setAttribute(attribute, this.getAttribute(attribute));
            else
                input.removeAttribute(attribute);
        }
        this.#label();
        const value = this.value;
        this.#internals.setFormValue(value, input.value);
        const result = this.validateValue(value);
        this.detail = result.detail;
        let flags = {};
        let message = "";
        if (!this.readOnly) {
            if (this.#externalError) {
                flags = { customError: true };
                message = this.#externalError;
            }
            else if (this.required && !value) {
                flags = { valueMissing: true };
                message = "Fill out this field.";
            }
            else if (value && result.message) {
                flags = { customError: true };
                message = result.message;
            }
            else if (value) {
                const pattern = this.getAttribute("pattern") ?? this.defaultPattern;
                let mismatch = false;
                if (pattern) {
                    try {
                        mismatch = !new RegExp(`^(?:${pattern})$`, "v").test(value);
                    }
                    catch { /* HTML ignores invalid patterns. */ }
                }
                const min = this.getAttribute("minlength");
                const max = this.getAttribute("maxlength");
                if (mismatch) {
                    flags = { patternMismatch: true };
                    message = "Match the requested format.";
                }
                else if (min !== null && value.length < Number(min)) {
                    flags = { tooShort: true };
                    message = `Use at least ${min} characters.`;
                }
                else if (max !== null && value.length > Number(max)) {
                    flags = { tooLong: true };
                    message = `Use no more than ${max} characters.`;
                }
            }
        }
        this.#internals.setValidity(flags, message, input);
        this.toggleAttribute("data-touched", this.#touched);
        input.setAttribute("aria-invalid", String(this.#touched && !this.validity.valid));
    }
    setCustomValidity(message) { this.#externalError = String(message); this.refresh(); }
    checkValidity() { return this.#internals.checkValidity(); }
    reportValidity() { return this.#internals.reportValidity(); }
    focus(options) { this.#input.focus(options); }
    formDisabledCallback(disabled) { this.#formDisabled = disabled; this.refresh(); }
    formResetCallback() { this.#dirty = false; this.#input.value = this.defaultValue; this.#touched = false; this.refresh(); }
    formStateRestoreCallback(state) { this.#dirty = true; this.#input.value = state; this.refresh(); }
    #label() {
        this.#input.setAttribute("aria-label", this.getAttribute("aria-label") || Array.from(this.labels).map((label) => label.textContent?.trim()).filter(Boolean).join(" ") || "Text field");
    }
    #onInput = (event) => {
        this.#dirty = true;
        if (event instanceof InputEvent && event.isComposing)
            return;
        // The editor's raw text is never rewritten, preserving native undo and selection.
        this.refresh();
    };
}
export class H6Iban extends H6TextField {
    normalizeValue(value) { return normalizeIdentifier(value); }
    validateValue(value) { return validateIban(value); }
}
export class H6Bic extends H6TextField {
    normalizeValue(value) { return normalizeIdentifier(value); }
    validateValue(value) { return validateBic(value); }
}
export class H6Otp extends H6TextField {
    get defaultPattern() { return "[0-9]{6}"; }
    get defaultInputMode() { return "numeric"; }
    get defaultAutocomplete() { return "one-time-code"; }
    normalizeValue(value) { return value.replace(/\s/g, ""); }
    validateValue(_value) { return { message: "", detail: "One text input. Leading zeros stay intact." }; }
}
