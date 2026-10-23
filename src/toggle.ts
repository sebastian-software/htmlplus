import * as toggle from "@zag-js/toggle";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles } from "./styles.js";
import { DomBindings } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { display: inline-flex; vertical-align: middle; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: var(--h6-control-height, 2.5rem); padding: .5rem .75rem; border: 1px solid var(--h6-border, #d4d4d4); border-radius: var(--h6-radius, .5rem); background: var(--h6-surface, #fff); color: inherit; font: inherit; font-weight: 500; cursor: pointer; }
  button:hover { background: var(--h6-track, #f5f5f5); }
  button[data-pressed] { background: var(--h6-accent, #171717); border-color: var(--h6-accent, #171717); color: var(--h6-accent-foreground, #fff); }
  button:focus-visible { outline: 2px solid var(--h6-focus, #737373); outline-offset: 3px; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  :host(:invalid) button { border-color: var(--h6-danger, #b91c1c); }
  ::slotted(svg) { width: 1rem; height: 1rem; flex: none; }
  @media (forced-colors: active) { button[data-pressed] { outline: 2px solid Highlight; } }
</style><button part="button" type="button"><slot></slot></button>`;

export class H6Toggle extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["pressed", "disabled", "required", "value", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #root = this.attachShadow({ mode: "open", delegatesFocus: true });
  #button: HTMLButtonElement;
  #machine?: InteractionMachine<toggle.Service, toggle.Props>;
  #bindings = new DomBindings();
  #pressed = false;
  #dirty = false;
  #formDisabled = false;
  #customError = "";

  constructor() {
    super();
    this.#root.append(template.content.cloneNode(true));
    this.#button = this.#root.querySelector("button")!;
    this.#root.querySelector("slot")!.addEventListener("slotchange", () => this.#render());
    this.addEventListener("click", (event) => {
      // External label activation and host.click() arrive on the host, not its button.
      if (event.composedPath()[0] !== this || event.defaultPrevented || this.#disabled || !this.#machine) return;
      this.#button.focus();
      toggle.connect(this.#machine.service, normalizeProps).setPressed(!this.#pressed);
    });
  }
  connectedCallback(): void {
    this.#machine = new VanillaMachine(toggle.machine, {
      pressed: this.#pressed, disabled: this.#disabled,
      onPressedChange: (pressed) => {
        if (this.#disabled || pressed === this.#pressed) return;
        this.#dirty = true; this.#pressed = pressed; this.#sync();
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render());
    this.#render(); this.#machine.start(); this.#sync();
  }
  disconnectedCallback(): void { this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(name: string): void {
    if (name === "pressed" && !this.#dirty) this.#pressed = this.defaultPressed;
    this.#sync();
  }
  get pressed(): boolean { return this.#pressed; }
  set pressed(value: boolean) { this.#dirty = true; this.#pressed = Boolean(value); this.#sync(); }
  get defaultPressed(): boolean { return this.hasAttribute("pressed"); }
  set defaultPressed(value: boolean) { this.toggleAttribute("pressed", Boolean(value)); }
  get value(): string { return this.getAttribute("value") ?? "on"; }
  set value(value: string) { this.setAttribute("value", String(value)); }
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
  override focus(options?: FocusOptions): void { this.#button.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#pressed = this.defaultPressed; this.#sync(); }
  formStateRestoreCallback(state: string | File | FormData): void { this.#dirty = true; this.#pressed = state === "pressed"; this.#sync(); }

  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  #sync(): void {
    this.#internals.setFormValue(this.#pressed ? this.value : null, this.#pressed ? "pressed" : "unpressed");
    if (this.#pressed) this.#internals.states.add("pressed"); else this.#internals.states.delete("pressed");
    if (this.#customError) this.#internals.setValidity({ customError: true }, this.#customError, this.#button);
    else if (this.required && !this.#pressed) this.#internals.setValidity({ valueMissing: true }, "Select this option to continue.", this.#button);
    else this.#internals.setValidity({});
    this.#machine?.updateProps({ pressed: this.#pressed, disabled: this.#disabled });
    this.#render();
  }
  #render(): void {
    if (this.#machine) this.#bindings.apply(this.#button, toggle.connect(this.#machine.service, normalizeProps).getRootProps());
    const root = this.getRootNode() as Document | ShadowRoot;
    const references = (this.getAttribute("aria-labelledby") ?? "").split(/\s+/).map((id) => root.getElementById?.(id)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
    const name = references || this.getAttribute("aria-label") || Array.from(this.labels, (label) => label.textContent?.trim() ?? "").join(" ");
    if (name) this.#button.setAttribute("aria-label", name); else this.#button.removeAttribute("aria-label");
    const description = (this.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => root.getElementById?.(id)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
    if (description) this.#button.setAttribute("aria-description", description); else this.#button.removeAttribute("aria-description");
    this.#button.setAttribute("aria-invalid", String(!this.validity.valid));
  }
}
