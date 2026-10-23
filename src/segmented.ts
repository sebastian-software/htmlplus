const template = document.createElement("template");
template.innerHTML = `<style>
  :host { display: block; font: inherit; }
  [part=control] { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px; border: 1px solid var(--h6-border,#d4d4d4); border-radius: var(--h6-radius,9px); background: var(--h6-track,#f5f5f5); }
  label { flex: 1; position: relative; min-width: 72px; }
  input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  [part~=option] { box-sizing: border-box; display: block; padding: 10px 12px; border-radius: max(0px,calc(var(--h6-radius,9px) - 4px)); text-align: center; font-size: 13px; cursor: pointer; }
  input:checked + span { background: var(--h6-surface,white); color: var(--h6-accent,#171717); box-shadow: 0 1px 4px #00000010; font-weight: 600; }
  input:focus-visible + span { outline: 2px solid var(--h6-focus,#737373); outline-offset: 2px; }
  input:disabled + span { opacity: .5; cursor: default; }
  :host([data-touched]:invalid) [part=control] { border-color: var(--h6-danger,#af3c41); }
</style><div part="control"></div>`;

/** A compact single choice, retaining native radio navigation inside the control. */
export class H6Segmented extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "required", "aria-label"];
  #internals = this.attachInternals();
  #control: HTMLElement;
  #value = "";
  #dirty = false;
  #formDisabled = false;
  #customError = "";
  #observer = new MutationObserver(() => this.#render());
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.append(template.content.cloneNode(true));
    this.#control = root.querySelector("div")!;
    this.#internals.role = "radiogroup";
    this.addEventListener("click", (event) => {
      if (event.composedPath()[0] === this) this.focus();
    });
    root.addEventListener("change", (event) => {
      event.stopPropagation();
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      this.#value = input.value; this.#dirty = true; this.#sync();
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
    // Native input events already bubble across the shadow boundary once.
    root.addEventListener("input", (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement) { this.#value = input.value; this.#dirty = true; this.#sync(); }
    });
    this.addEventListener("invalid", () => { this.setAttribute("data-touched", ""); });
  }
  connectedCallback(): void {
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "disabled", "label"] });
    this.#render(); queueMicrotask(() => this.#sync());
  }
  disconnectedCallback(): void { this.#observer.disconnect(); }
  attributeChangedCallback(name: string): void { if (name === "value" && !this.#dirty) this.#value = this.defaultValue; this.#sync(); }
  get value(): string { return this.#options.some((option) => option.value === this.#value) ? this.#value : ""; }
  set value(value: string) { this.#dirty = true; this.#value = String(value); this.#sync(); }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  set defaultValue(value: string) { this.setAttribute("value", value); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get form(): HTMLFormElement | null { return this.#internals.form; }
  get labels(): NodeList { return this.#internals.labels; }
  get validity(): ValidityState { return this.#internals.validity; }
  get validationMessage(): string { return this.#internals.validationMessage; }
  get willValidate(): boolean { return this.#internals.willValidate; }
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  setCustomValidity(message: string): void { this.#customError = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void {
    (this.#control.querySelector<HTMLInputElement>("input:checked:not(:disabled)") ?? this.#control.querySelector<HTMLInputElement>("input:not(:disabled)"))?.focus(options);
  }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#value = this.defaultValue; this.removeAttribute("data-touched"); this.#sync(); }
  formStateRestoreCallback(state: string): void { this.value = state; }
  get #options(): HTMLOptionElement[] { return Array.from(this.children).filter((item): item is HTMLOptionElement => item instanceof HTMLOptionElement && item.value !== ""); }
  #render(): void {
    const focusedValue = this.shadowRoot?.activeElement instanceof HTMLInputElement ? this.shadowRoot.activeElement.value : null;
    const seen = new Set<string>();
    this.#control.replaceChildren(...this.#options.filter((option) => { if (seen.has(option.value)) return false; seen.add(option.value); return true; }).map((option) => {
      const label = document.createElement("label");
      const input = document.createElement("input"); input.type = "radio"; input.name = "choice"; input.value = option.value;
      const text = document.createElement("span"); text.part.add("option"); text.textContent = option.label;
      label.append(input, text); return label;
    }));
    this.#sync();
    if (focusedValue !== null) Array.from(this.#control.querySelectorAll("input")).find((input) => input.value === focusedValue && !input.disabled)?.focus();
  }
  #sync(): void {
    const option = this.#options.find((item) => item.value === this.#value);
    const enabledValue = option && !option.disabled ? option.value : null;
    for (const input of this.#control.querySelectorAll("input")) {
      input.checked = input.value === this.value;
      input.nextElementSibling!.part.toggle("selected-option", input.checked);
      input.disabled = this.disabled || this.#formDisabled || Boolean(this.#options.find((item) => item.value === input.value)?.disabled);
      input.setAttribute("aria-required", String(this.required));
    }
    this.#internals.ariaLabel = this.getAttribute("aria-label") || Array.from(this.labels).map((item) => item.textContent?.trim()).filter(Boolean).join(" ") || "Choose an option";
    this.#internals.ariaRequired = String(this.required);
    this.#internals.setFormValue(enabledValue, this.#value);
    const anchor = this.#control.querySelector<HTMLInputElement>("input:not(:disabled)");
    const message = this.#customError || (this.required && !enabledValue ? "Choose an option." : "");
    this.#internals.setValidity(message ? this.#customError ? { customError: true } : { valueMissing: true } : {}, message, anchor ?? undefined);
  }
}
