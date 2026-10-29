import { fieldLabel, referencedText } from "./field-label.js";
import * as checkbox from "@zag-js/checkbox";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles } from "./styles.js";
import { theme, radius, surfaceShadow } from "./theme.js";
import { DomBindings, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";

const template = document.createElement("template");
template.innerHTML = `<style>${hostStyles}
  :host { display: inline-flex; vertical-align: middle; }
  [part=root] { position: relative; display: inline-flex; align-items: center; gap: .5rem; min-height: 1.5rem; cursor: pointer; }
  [part=control] { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 1rem; height: 1rem; border: 1px solid ${theme("input")}; border-radius: calc(${radius("sm")} / 2); background: ${theme("background")}; box-shadow: ${surfaceShadow("inset")}; }
  [part=control]:not([data-state=unchecked]) { background: ${theme("primary")}; border-color: ${theme("primary")}; color: ${theme("primary-foreground")}; box-shadow: none; }
  [part=indicator] { width: .75rem; height: .75rem; fill: none; stroke: currentColor; stroke-width: 2; }
  [part=control][data-focus-visible] { outline: 2px solid ${theme("ring")}; outline-offset: 3px; }
  [part=root][data-disabled] { opacity: .5; cursor: default; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
  [part=label] { cursor: inherit; }
  @media (forced-colors: active) { [part=control]:not([data-state=unchecked]) { background: Highlight; color: HighlightText; border-color: Highlight; } }
</style><label part="root"><input part="input"><span part="control" aria-hidden="true"><svg part="indicator" viewBox="0 0 16 16"><path></path></svg></span><span part="label"><slot></slot></span></label>`;

/** Native checked and indeterminate remain independent, including submission. */
export class H6Checkbox extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["checked", "indeterminate", "disabled", "readonly", "required", "value", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #root = this.attachShadow({ mode: "open", delegatesFocus: true });
  #id = interactionId("checkbox");
  #input: HTMLInputElement;
  #bindings = new DomBindings();
  #machine?: InteractionMachine<checkbox.Service, checkbox.Props>;
  #checked = false;
  #indeterminate = false;
  #dirty = false;
  #formDisabled = false;
  #error = "";
  constructor() {
    super(); this.#root.append(template.content.cloneNode(true)); this.#input = this.#root.querySelector("input")!;
    this.#root.addEventListener("input", event => event.stopPropagation());
    this.#root.addEventListener("change", event => event.stopPropagation());
    this.#root.querySelector("slot")!.addEventListener("slotchange", () => this.#render());
    this.addEventListener("invalid", () => this.setAttribute("data-touched", ""));
    this.addEventListener("click", event => {
      if (event.composedPath()[0] === this && !event.defaultPrevented && !this.#disabled && !this.readOnly) { this.#input.focus(); this.#input.click(); }
    });
  }
  connectedCallback(): void {
    this.#machine = new VanillaMachine(checkbox.machine, { id: this.#id, getRootNode: () => this.#root,
      checked: this.#state, disabled: this.#disabled, readOnly: this.readOnly,
      onCheckedChange: ({ checked }) => {
        if (this.#disabled || this.readOnly) return;
        this.#dirty = true; this.#indeterminate = checked === "indeterminate"; this.#checked = checked === true; this.#sync();
        for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render()); this.#render(); this.#machine.start(); this.#sync();
  }
  disconnectedCallback(): void { this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(name: string): void {
    if (!this.#dirty) { if (name === "checked") this.#checked = this.defaultChecked; if (name === "indeterminate") this.#indeterminate = this.defaultIndeterminate; }
    this.#sync();
  }
  get checked(): boolean { return this.#checked; }
  set checked(value: boolean) { this.#dirty = true; this.#checked = Boolean(value); this.#sync(); }
  get indeterminate(): boolean { return this.#indeterminate; }
  set indeterminate(value: boolean) { this.#dirty = true; this.#indeterminate = Boolean(value); this.#sync(); }
  get defaultChecked(): boolean { return this.hasAttribute("checked"); }
  set defaultChecked(value: boolean) { this.toggleAttribute("checked", Boolean(value)); }
  get defaultIndeterminate(): boolean { return this.hasAttribute("indeterminate"); }
  set defaultIndeterminate(value: boolean) { this.toggleAttribute("indeterminate", Boolean(value)); }
  get value(): string { return this.getAttribute("value") ?? "on"; }
  set value(value: string) { this.setAttribute("value", value); }
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
  setCustomValidity(message: string): void { this.#error = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void { this.#input.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#checked = this.defaultChecked; this.#indeterminate = this.defaultIndeterminate; this.removeAttribute("data-touched"); this.#sync(); }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    try { const value = JSON.parse(state); this.#checked = value.checked === true; this.#indeterminate = value.indeterminate === true; this.#dirty = true; this.#sync(); } catch { /* Ignore an unsupported restoration payload. */ }
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  get #state(): checkbox.CheckedState { return this.#indeterminate ? "indeterminate" : this.#checked; }
  #sync(): void {
    this.#internals.setFormValue(this.#checked ? this.value : null, JSON.stringify({ checked: this.#checked, indeterminate: this.#indeterminate }));
    this.#internals.setValidity(this.#error ? { customError: true } : this.required && !this.#checked ? { valueMissing: true } : {}, this.#error || (this.required && !this.#checked ? "Select this option to continue." : ""), this.#input);
    for (const [state, active] of [["checked", this.#checked], ["indeterminate", this.#indeterminate]] as const) active ? this.#internals.states.add(state) : this.#internals.states.delete(state);
    this.#machine?.updateProps({ checked: this.#state, disabled: this.#disabled, readOnly: this.readOnly, invalid: !this.validity.valid }); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = checkbox.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#root.querySelector("label")!, api.getRootProps());
    this.#bindings.apply(this.#root.querySelector("[part=control]")!, api.getControlProps());
    this.#bindings.apply(this.#root.querySelector("[part=label]")!, api.getLabelProps());
    this.#bindings.apply(this.#input, api.getHiddenInputProps());
    this.#input.style.cssText = "position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:inherit;z-index:1";
    this.#input.checked = this.#checked; this.#input.indeterminate = this.#indeterminate;
    this.#input.removeAttribute("aria-labelledby");
    this.#input.setAttribute("aria-label", fieldLabel(this, this.labels, this.textContent?.trim() || "Checkbox"));
    this.#input.setAttribute("aria-description", referencedText(this, "aria-describedby"));
    this.#input.setAttribute("aria-checked", this.#indeterminate ? "mixed" : String(this.#checked));
    this.#input.setAttribute("aria-required", String(this.required));
    const indicator = this.#root.querySelector<SVGElement>("svg")!;
    indicator.style.visibility = this.#indeterminate || this.#checked ? "visible" : "hidden";
    indicator.querySelector("path")!.setAttribute("d", this.#indeterminate ? "M3 8h10" : "m3 8 3 3 7-7");
  }
}
