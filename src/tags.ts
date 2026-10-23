import { uniqueTags } from "./validation.js";
import { hostStyles } from "./styles.js";
import { createIcon } from "./icons.js";

const tagsTemplate = document.createElement("template");
tagsTemplate.innerHTML = `<style>
  ${hostStyles}
  [part=control] { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem; min-height: var(--h6-control-height, 2.5rem); padding: .375rem; border: 1px solid var(--h6-border, #d4d4d4); border-radius: var(--h6-radius, .5rem); background: var(--h6-surface, #fff); box-shadow: 0 1px 2px #00000005; }
  :host(:focus-within) [part=control] { border-color: var(--h6-focus, #737373); outline: 2px solid var(--h6-focus, #737373); outline-offset: 2px; }
  [part=tokens] { display: contents; }
  [part=tag] { display: inline-flex; align-items: center; gap: .25rem; min-height: 1.625rem; max-width: 100%; padding: 0 0 0 .5rem; border: 1px solid transparent; border-radius: var(--h6-tag-radius, .375rem); background: var(--h6-tag-background, #f5f5f5); color: var(--h6-tag-color, #262626); font-size: .75rem; font-weight: 500; line-height: 1rem; }
  [part=tag-label] { display: block; min-width: 0; padding-block: .25rem; overflow-wrap: anywhere; }
  [part=remove-button] { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 1.5rem; height: 1.5rem; margin: 0; padding: 0; border: none; border-radius: .25rem; background: transparent; color: inherit; font: inherit; cursor: pointer; }
  [part=remove-icon] { display: block; flex: none; width: .75rem; height: .75rem; pointer-events: none; }
  [part=remove-button]:hover { background: var(--h6-tag-hover, #e5e5e5); }
  [part=remove-button]:focus-visible { outline: 2px solid var(--h6-accent, #171717); outline-offset: 1px; }
  [part=input] { display: block; flex: 1; min-width: 6rem; width: 6rem; height: 1.625rem; margin: 0; padding: .1875rem .25rem; border: 0; outline: none; background: transparent; color: inherit; font: inherit; }
  [part=input]::placeholder { color: var(--h6-placeholder, #737373); }
  :host(:disabled) { opacity: .55; }
  :host([data-visited]:invalid) [part=control] { border-color: var(--h6-danger, #af3c41); }
</style><div part="control"><div part="tokens"></div><input part="input" type="text" autocomplete="off" placeholder="Add a tag…"></div>`;

export class H6Tags extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "required", "readonly", "placeholder", "aria-label"];
  #internals = this.attachInternals();
  #input: HTMLInputElement;
  #tokens: HTMLElement;
  #values: string[] = [];
  #dirty = false;
  #formDisabled = false;
  #customError = "";

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.append(tagsTemplate.content.cloneNode(true));
    this.#input = root.querySelector("input")!;
    this.#tokens = root.querySelector('[part="tokens"]')!;
    this.#internals.role = "group";
    this.#input.addEventListener("keydown", this.#onKeyDown);
    this.#input.addEventListener("blur", () => { this.setAttribute("data-visited", ""); this.#commit(); });
    this.#input.addEventListener("input", (event) => { event.stopPropagation(); });
    this.#input.addEventListener("change", (event) => { event.stopPropagation(); });
    root.addEventListener("click", (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>("button[data-index]");
      if (!button || this.#isDisabled || this.readOnly) return;
      const index = Number(button.dataset.index);
      const next = this.#values.filter((_, item) => item !== index);
      this.#change(next);
      this.#input.focus();
    });
  }

  connectedCallback(): void { this.#sync(); queueMicrotask(() => this.#label()); }
  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.#dirty) this.#values = this.defaultValue;
    this.#sync();
  }
  get value(): string[] { return [...this.#values]; }
  set value(values: readonly string[]) {
    if (!Array.isArray(values) || !values.every((value) => typeof value === "string")) throw new TypeError("h6-tags.value must be an array of strings.");
    this.#dirty = true;
    this.#values = uniqueTags(values);
    this.#input.value = "";
    this.#render();
    this.#sync();
  }
  get defaultValue(): string[] {
    try {
      const value: unknown = JSON.parse(this.getAttribute("value") ?? "[]");
      return Array.isArray(value) && value.every((item) => typeof item === "string") ? uniqueTags(value) : [];
    } catch { return []; }
  }
  set defaultValue(values: readonly string[]) { this.setAttribute("value", JSON.stringify(uniqueTags(values))); }
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
  override focus(options?: FocusOptions): void { this.#input.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void {
    this.#dirty = false;
    this.#values = this.defaultValue;
    this.#input.value = "";
    this.removeAttribute("data-visited");
    this.#render();
    this.#sync();
  }
  formStateRestoreCallback(state: string): void {
    try {
      const value: unknown = JSON.parse(state);
      if (Array.isArray(value) && value.every((item) => typeof item === "string")) this.value = value;
    } catch { /* Ignore an incompatible state from an earlier component version. */ }
  }

  get #isDisabled(): boolean { return this.disabled || this.#formDisabled; }
  #label(): void {
    const text = this.getAttribute("aria-label") || Array.from(this.labels).map((label) => label.textContent?.trim()).filter(Boolean).join(" ") || "Tags";
    this.#input.setAttribute("aria-label", text);
    this.#input.setAttribute("aria-required", String(this.required));
  }
  #sync(): void {
    const data = new FormData();
    if (this.name) for (const value of this.#values) data.append(this.name, value);
    this.#internals.setFormValue(this.name ? data : null, JSON.stringify(this.#values));
    this.#input.disabled = this.#isDisabled;
    this.#input.readOnly = this.readOnly;
    this.#input.placeholder = this.getAttribute("placeholder") ?? "Add a tag…";
    this.#internals.ariaDisabled = String(this.#isDisabled);
    this.#internals.ariaRequired = String(this.required);
    if (this.#customError) this.#internals.setValidity({ customError: true }, this.#customError, this.#input);
    else if (this.required && !this.#values.length) this.#internals.setValidity({ valueMissing: true }, "Add at least one tag.", this.#input);
    else this.#internals.setValidity({});
    this.#input.setAttribute("aria-invalid", String(!this.validity.valid));
    this.#label();
    this.#render();
  }
  #render(): void {
    const focusedIndex = this.shadowRoot?.activeElement instanceof HTMLButtonElement ? Number((this.shadowRoot.activeElement as HTMLButtonElement).dataset.index) : -1;
    const tags = this.#values.map((value, index) => {
      const tag = document.createElement("span");
      tag.part.add("tag");
      const label = document.createElement("span");
      label.part.add("tag-label");
      label.textContent = value;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.part.add("remove-button");
      remove.dataset.index = String(index);
      remove.setAttribute("aria-label", `Remove ${value}`);
      remove.disabled = this.#isDisabled || this.readOnly;
      const icon = createIcon("close");
      icon.part.add("remove-icon");
      remove.append(icon);
      tag.append(label, remove);
      return tag;
    });
    this.#tokens.replaceChildren(...tags);
    if (focusedIndex >= 0) this.#tokens.querySelector<HTMLButtonElement>(`button[data-index="${focusedIndex}"]`)?.focus();
  }
  #change(values: string[]): void {
    this.value = values;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }
  #commit(): void {
    if (this.#isDisabled || this.readOnly) return;
    const pending = this.#input.value.trim();
    if (!pending) return;
    this.#input.value = "";
    if (this.#values.includes(pending)) return;
    this.#change([...this.#values, pending]);
  }
  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.isComposing || this.#isDisabled || this.readOnly) return;
    if (event.key === "Enter" || event.key === ",") { event.preventDefault(); this.#commit(); }
    else if (event.key === "Backspace" && !this.#input.value) {
      this.#tokens.querySelector<HTMLButtonElement>("[part=tag]:last-child button")?.focus();
      event.preventDefault();
    }
  };
}
