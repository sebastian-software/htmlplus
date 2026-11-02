import { theme, radius, surfaceShadow } from "./theme.js";
import { hostStyles } from "./styles.js";
import { LabelContext, fieldLabel } from "./field-label.js";
import { readOptionChoices, enabledChoice } from "./option-choices.js";
import { textValue, upgradeProperties } from "./upgrade.js";
import { trackTouched, visiblyInvalid } from "./touched.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  [part=control] { display: flex; flex-wrap: wrap; gap: .1875rem; padding: .1875rem; border: 1px solid ${theme("input")}; border-radius: ${radius("lg")}; background: ${theme("muted")}; box-shadow: ${surfaceShadow("inset")}; }
  label { flex: 1; position: relative; min-width: 72px; }
  input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  [part~=option] { display: flex; align-items: center; justify-content: center; min-height: 2rem; padding: .375rem .75rem; border-radius: ${radius("sm")}; text-align: center; font-weight: 500; cursor: pointer; }
  input:checked + span { background: ${theme("background")}; color: ${theme("foreground")}; box-shadow: ${surfaceShadow("raised")}; }
  input:focus-visible + span { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  input:disabled + span { opacity: .5; cursor: default; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
</style><div part="control"></div>`;

/** A compact single choice, retaining native radio navigation inside the control. */
export class H6Segmented extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "required", "aria-label", "aria-labelledby"];
  #internals = this.attachInternals();
  #control: HTMLElement;
  #value = "";
  #dirty = false;
  #formDisabled = false;
  #customError = "";
  #observer = new MutationObserver(() => this.#render());
  #labelContext = new LabelContext(this, () => this.#sync());
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
      this.#value = input.value;
      this.#dirty = true;
      this.#sync();
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    });
    // Native input events already bubble across the shadow boundary once.
    root.addEventListener("input", (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement) {
        this.#value = input.value;
        this.#dirty = true;
        this.#sync();
      }
    });
    trackTouched(this, () => this.#sync());
  }
  connectedCallback(): void {
    upgradeProperties(this, ["value"]);
    this.#labelContext.connect();
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["value", "disabled", "label"],
    });
    this.#render();
    queueMicrotask(() => this.#sync());
  }
  disconnectedCallback(): void {
    this.#labelContext.disconnect();
    this.#observer.disconnect();
  }
  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.#dirty) this.#value = this.defaultValue;
    this.#sync();
  }
  get value(): string {
    return enabledChoice(this.#options, this.#value)?.value ?? "";
  }
  set value(value: string) {
    this.#dirty = true;
    this.#value = textValue(value);
    this.#sync();
  }
  get defaultValue(): string {
    return this.getAttribute("value") ?? "";
  }
  set defaultValue(value: string) {
    this.setAttribute("value", value);
  }
  get name(): string {
    return this.getAttribute("name") ?? "";
  }
  set name(value: string) {
    this.setAttribute("name", value);
  }
  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }
  set disabled(value: boolean) {
    this.toggleAttribute("disabled", Boolean(value));
  }
  get required(): boolean {
    return this.hasAttribute("required");
  }
  set required(value: boolean) {
    this.toggleAttribute("required", Boolean(value));
  }
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }
  get labels(): NodeList {
    return this.#internals.labels;
  }
  get validity(): ValidityState {
    return this.#internals.validity;
  }
  get validationMessage(): string {
    return this.#internals.validationMessage;
  }
  get willValidate(): boolean {
    return this.#internals.willValidate;
  }
  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }
  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }
  setCustomValidity(message: string): void {
    this.#customError = String(message);
    this.#sync();
  }
  override focus(options?: FocusOptions): void {
    (
      this.#control.querySelector<HTMLInputElement>("input:checked:not(:disabled)") ??
      this.#control.querySelector<HTMLInputElement>("input:not(:disabled)")
    )?.focus(options);
  }
  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.#sync();
  }
  formResetCallback(): void {
    this.#dirty = false;
    this.#value = this.defaultValue;
    this.removeAttribute("data-touched");
    this.#sync();
  }
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }
  get #options(): ReturnType<typeof readOptionChoices> {
    return readOptionChoices(this);
  }
  #render(): void {
    const focusedValue =
      this.shadowRoot?.activeElement instanceof HTMLInputElement ? this.shadowRoot.activeElement.value : null;
    this.#control.replaceChildren(
      ...this.#options.map((option) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "choice";
        input.value = option.value;
        const text = document.createElement("span");
        text.part.add("option");
        text.textContent = option.label;
        label.append(input, text);
        return label;
      }),
    );
    this.#sync();
    if (focusedValue !== null)
      Array.from(this.#control.querySelectorAll("input"))
        .find((input) => input.value === focusedValue && !input.disabled)
        ?.focus();
  }
  #sync(): void {
    const options = this.#options,
      enabledValue = enabledChoice(options, this.#value)?.value ?? null;
    for (const input of this.#control.querySelectorAll("input")) {
      input.checked = input.value === enabledValue;
      input.nextElementSibling!.part.toggle("selected-option", input.checked);
      input.disabled =
        this.disabled || this.#formDisabled || Boolean(options.find((item) => item.value === input.value)?.disabled);
      input.setAttribute("aria-required", String(this.required));
    }
    this.#internals.ariaLabel = fieldLabel(this, this.labels, "Choose an option");
    this.#internals.ariaRequired = String(this.required);
    this.#internals.setFormValue(enabledValue, this.#value);
    const anchor = this.#control.querySelector<HTMLInputElement>("input:not(:disabled)");
    const message = this.#customError || (this.required && !enabledValue ? "Choose an option." : "");
    this.#internals.setValidity(
      message ? (this.#customError ? { customError: true } : { valueMissing: true }) : {},
      message,
      anchor ?? undefined,
    );
    this.#internals.ariaInvalid = String(visiblyInvalid(this));
  }
}
