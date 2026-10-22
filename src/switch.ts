const switchTemplate = document.createElement("template");
switchTemplate.innerHTML = `<style>
  :host { display: inline-flex; vertical-align: middle; cursor: pointer; border-radius: var(--h6-radius, 9px); outline: none; -webkit-tap-highlight-color: transparent; }
  [part=track] { display: block; box-sizing: border-box; width: 46px; height: 28px; padding: 3px; border: 1px solid var(--h6-border, #d2ccdf); border-radius: 99px; background: var(--h6-muted, #e9e5f0); transition: background .15s; }
  [part=thumb] { display: block; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 1px 3px #20142a25; transition: transform .15s; }
  :host(:state(checked)) [part=track] { border-color: var(--h6-accent, #6540cb); background: var(--h6-accent, #6540cb); }
  :host(:state(checked)) [part=thumb] { transform: translateX(18px); }
  :host(:focus-visible) { outline: 3px solid var(--h6-focus, #b5a1ec); outline-offset: 4px; }
  :host(:disabled) { opacity: .5; cursor: not-allowed; }
  :host(:invalid) [part=track] { border-color: var(--h6-danger, #af3c41); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style><span part="track" aria-hidden="true"><span part="thumb"></span></span>`;

export class H6Switch extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["checked", "disabled", "required", "value"];
  #internals = this.attachInternals();
  #checked = false;
  #dirty = false;
  #formDisabled = false;
  #customError = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).append(switchTemplate.content.cloneNode(true));
    this.#internals.role = "switch";
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", (event) => { if (event.key === " ") event.preventDefault(); });
    this.addEventListener("keyup", (event) => { if (event.key === " " && !this.#isDisabled) { event.preventDefault(); this.click(); } });
  }

  connectedCallback(): void { this.#sync(); }
  attributeChangedCallback(name: string): void {
    if (name === "checked" && !this.#dirty) this.#checked = this.hasAttribute("checked");
    this.#sync();
  }
  get checked(): boolean { return this.#checked; }
  set checked(value: boolean) { this.#dirty = true; this.#checked = Boolean(value); this.#sync(); }
  get defaultChecked(): boolean { return this.hasAttribute("checked"); }
  set defaultChecked(value: boolean) { this.toggleAttribute("checked", Boolean(value)); }
  get value(): string { return this.getAttribute("value") ?? "on"; }
  set value(value: string) { this.setAttribute("value", value); }
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
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#checked = this.defaultChecked; this.#sync(); }
  formStateRestoreCallback(state: string): void { this.#dirty = true; this.#checked = state === "checked"; this.#sync(); }

  get #isDisabled(): boolean { return this.disabled || this.#formDisabled; }
  #sync(): void {
    this.#internals.setFormValue(this.#checked ? this.value : null, this.#checked ? "checked" : "unchecked");
    this.#internals.ariaChecked = String(this.#checked);
    this.#internals.ariaDisabled = String(this.#isDisabled);
    this.#internals.ariaRequired = String(this.required);
    this.tabIndex = this.#isDisabled ? -1 : 0;
    if (this.#checked) this.#internals.states.add("checked");
    else this.#internals.states.delete("checked");
    if (this.#customError) this.#internals.setValidity({ customError: true }, this.#customError);
    else if (this.required && !this.#checked) this.#internals.setValidity({ valueMissing: true }, "Turn on this option to continue.");
    else this.#internals.setValidity({});
  }
  #onClick = (event: MouseEvent): void => {
    if (this.#isDisabled) { event.preventDefault(); return; }
    this.checked = !this.checked;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };
}
