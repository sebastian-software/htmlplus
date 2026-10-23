export type IntervalValue = readonly [number | null, number | null];

function pair(value: unknown): value is IntervalValue {
  return Array.isArray(value) && value.length === 2 && value.every((item) => item === null || typeof item === "number" && Number.isFinite(item));
}

const template = document.createElement("template");
template.innerHTML = `<style>
  :host { display: block; font: inherit; }
  [part=control] { display: grid; grid-template-columns: minmax(0,1fr) auto minmax(0,1fr); gap: 10px; align-items: center; }
  label { min-width: 0; display: grid; gap: 5px; font-size: 11px; color: var(--h6-placeholder, #666666); }
  input { width: 100%; min-width: 0; box-sizing: border-box; height: 47px; border: 1px solid var(--h6-border,#d4d4d4); border-radius: var(--h6-radius,9px); background: var(--h6-surface,white); padding: 11px 13px; color: var(--h6-text, #171717); font: inherit; font-size: 14px; outline: none; }
  input:focus { border-color: var(--h6-accent,#171717); box-shadow: 0 0 0 3px var(--h6-focus-soft,#f5f5f5); }
  input:disabled { opacity: .5; }
  [part=separator] { padding-top: 16px; color: var(--h6-placeholder,#666666); }
  :host([data-touched]:invalid) input { border-color: var(--h6-danger,#af3c41); }
</style><div part="control"><label><span part="lower-label">From</span><input part="input lower-input" type="number"></label><span part="separator" aria-hidden="true">–</span><label><span part="upper-label">To</span><input part="input upper-input" type="number"></label></div>`;

/** Two numeric boundaries, serialized under explicit, independent field names. */
export class H6Interval extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "lower-name", "upper-name", "lower-label", "upper-label", "disabled", "readonly", "required", "min", "max", "step", "aria-label"];
  #internals = this.attachInternals();
  #inputs: [HTMLInputElement, HTMLInputElement];
  #dirty = false;
  #formDisabled = false;
  #customError = "";

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.append(template.content.cloneNode(true));
    this.#inputs = [root.querySelectorAll("input")[0]!, root.querySelectorAll("input")[1]!];
    this.#internals.role = "group";
    for (const input of this.#inputs) {
      input.addEventListener("input", () => { this.#dirty = true; this.#sync(); });
      input.addEventListener("change", (event) => { event.stopPropagation(); this.dispatchEvent(new Event("change", { bubbles: true })); });
      input.addEventListener("blur", () => { this.setAttribute("data-touched", ""); this.#sync(); });
    }
    this.addEventListener("invalid", () => { this.setAttribute("data-touched", ""); this.#sync(); });
  }
  connectedCallback(): void { this.#sync(); queueMicrotask(() => this.#sync()); }
  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.#dirty) this.#write(this.defaultValue);
    this.#sync();
  }
  get value(): IntervalValue { return this.#inputs.map((input) => input.value === "" ? null : input.valueAsNumber) as unknown as IntervalValue; }
  set value(value: IntervalValue) {
    if (!pair(value)) throw new TypeError("h6-interval.value must be [number | null, number | null].");
    this.#dirty = true; this.#write(value); this.#sync();
  }
  get defaultValue(): IntervalValue {
    try { const value: unknown = JSON.parse(this.getAttribute("value") ?? "[null,null]"); return pair(value) ? value : [null, null]; }
    catch { return [null, null]; }
  }
  set defaultValue(value: IntervalValue) {
    if (!pair(value)) throw new TypeError("h6-interval.defaultValue must contain two finite numbers or nulls.");
    this.setAttribute("value", JSON.stringify(value));
  }
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
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  setCustomValidity(message: string): void { this.#customError = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void { this.#inputs[0].focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#write(this.defaultValue); this.removeAttribute("data-touched"); this.#sync(); }
  formStateRestoreCallback(state: string): void {
    try {
      const values: unknown = JSON.parse(state);
      if (Array.isArray(values) && values.length === 2 && values.every((item) => typeof item === "string")) {
        this.#dirty = true; this.#inputs.forEach((input, index) => { input.value = values[index]!; }); this.#sync();
      }
    } catch { /* Ignore incompatible restored state. */ }
  }
  #write(value: IntervalValue): void { this.#inputs.forEach((input, index) => { input.value = value[index] === null ? "" : String(value[index]); }); }
  #sync(): void {
    const data = new FormData();
    const label = this.getAttribute("aria-label") || Array.from(this.labels).map((item) => item.textContent?.trim()).filter(Boolean).join(" ") || "Interval";
    this.#internals.ariaLabel = label;
    let flags: ValidityStateFlags = {};
    let message = "";
    let anchor = this.#inputs[0];
    this.#inputs.forEach((input, index) => {
      const side = index === 0 ? "lower" : "upper";
      const sideLabel = this.getAttribute(`${side}-label`) ?? (index === 0 ? "From" : "To");
      this.shadowRoot!.querySelector(`[part=${side}-label]`)!.textContent = sideLabel;
      input.setAttribute("aria-label", `${label}: ${sideLabel}`);
      input.disabled = this.disabled || this.#formDisabled;
      input.readOnly = this.readOnly;
      input.required = this.required;
      for (const attribute of ["min", "max", "step"]) {
        if (this.hasAttribute(attribute)) input.setAttribute(attribute, this.getAttribute(attribute)!);
        else input.removeAttribute(attribute);
      }
      if (this.name && input.value !== "") data.append(this.getAttribute(`${side}-name`) || `${this.name}.${index === 0 ? "min" : "max"}`, input.value);
      if (!message && !input.validity.valid) {
        for (const flag of ["valueMissing", "badInput", "rangeUnderflow", "rangeOverflow", "stepMismatch"] as const) if (input.validity[flag]) flags[flag] = true;
        message = input.validationMessage; anchor = input;
      }
    });
    const [lower, upper] = this.value;
    if (!message && lower !== null && upper !== null && lower > upper) { flags = { customError: true }; message = "The lower boundary must not exceed the upper boundary."; anchor = this.#inputs[1]; }
    if (this.#customError) { flags = { customError: true }; message = this.#customError; }
    if (this.readOnly) { flags = {}; message = ""; }
    this.#internals.setFormValue(data, JSON.stringify(this.#inputs.map((input) => input.value)));
    this.#internals.setValidity(flags, message, anchor);
    for (const input of this.#inputs) input.setAttribute("aria-invalid", String(this.hasAttribute("data-touched") && !this.validity.valid));
  }
}
