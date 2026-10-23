import * as rating from "@zag-js/rating-group";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles, numericAccent } from "./styles.js";
import { theme, radius } from "./theme.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { fieldLabel, referencedText } from "./field-label.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [part=root] { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem .75rem; }
  [part=control] { display: flex; flex-wrap: wrap; gap: .125rem; }
  [part~=item] { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 2.25rem; height: 2.25rem; padding: .375rem; border: 1px solid transparent; font: inherit; border-radius: ${radius("sm")}; background: transparent; color: ${theme("muted-foreground")}; cursor: pointer; }
  [part~=item][data-highlighted] { color: ${numericAccent}; }
  [part~=icon] { display: block; width: 100%; height: 100%; fill: transparent; stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round; pointer-events: none; }
  [data-highlighted] [part~=icon] { fill: currentColor; }
  [part~=item]:focus-visible, [part=clear-button]:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  [part=clear-button] { border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; color: ${theme("foreground")}; font: inherit; font-size: .75rem; line-height: 1rem; min-height: 2rem; padding: .375rem .5rem; cursor: pointer; }
  [part=clear-button]:hover:not(:disabled) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  [part=clear-button]:disabled { opacity: .5; cursor: default; }
  [part=value-text] { color: ${theme("muted-foreground")}; font-size: .75rem; font-variant-numeric: tabular-nums; }
  [data-disabled] [part=control] { opacity: .5; }
  [data-readonly] [part~=item], [data-disabled] [part~=item] { cursor: default; }
  :host(:invalid) [part=control] { outline: 1px solid ${theme("destructive")}; outline-offset: 3px; border-radius: ${radius("md")}; }
  [part=label] { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (forced-colors: active) { [part~=item][data-checked] { outline: 2px solid Highlight; } [part~=item][data-highlighted] { color: Highlight; } }
</style><div part="root"><span part="label"></span><div part="control"></div><button part="clear-button" type="button">Clear</button><span part="value-text" aria-hidden="true"></span></div>`;
const starPath = "m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91z";

export class H6Rating extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "count", "disabled", "readonly", "required", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #root = this.attachShadow({ mode: "open", delegatesFocus: true });
  #container: HTMLElement;
  #control: HTMLElement;
  #label: HTMLElement;
  #clear: HTMLButtonElement;
  #output: HTMLElement;
  #items: HTMLButtonElement[] = [];
  #id = interactionId("rating");
  #machine?: InteractionMachine<rating.Service, rating.Props>;
  #bindings = new DomBindings();
  #value: number | null = null;
  #dirty = false;
  #formDisabled = false;
  #customError = "";

  constructor() {
    super(); this.#root.append(template.content.cloneNode(true));
    this.addEventListener("click", event => { if (event.composedPath()[0] === this && !event.defaultPrevented) this.focus(); });
    this.#container = this.#root.querySelector("[part=root]")!; this.#control = this.#root.querySelector("[part=control]")!;
    this.#label = this.#root.querySelector("[part=label]")!; this.#clear = this.#root.querySelector("[part=clear-button]")!; this.#output = this.#root.querySelector("[part=value-text]")!;
    // End pointer preview before keyboard input so Zag enters its focused key state.
    this.#control.addEventListener("keydown", () => this.#machine?.service.send({ type: "GROUP_POINTER_LEAVE" }), true);
    this.#clear.addEventListener("click", () => { if (!this.#disabled && !this.readOnly && this.#machine) { rating.connect(this.#machine.service, normalizeProps).clearValue(); queueMicrotask(() => { if (this.isConnected) this.focus(); }); } });
  }
  connectedCallback(): void {
    if (!this.#dirty) this.#value = this.defaultValue;
    this.#reconcile();
    this.#machine = new VanillaMachine(rating.machine, {
      id: this.#id, getRootNode: () => this.#root, ...this.#props(),
      onValueChange: ({ value }) => {
        const next = value <= 0 ? null : Math.min(this.count, Math.round(value));
        if (this.#disabled || this.readOnly || next === this.#value) return;
        this.#dirty = true; this.#value = next; this.#sync();
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render()); this.#render(); this.#machine.start(); this.#sync();
    queueMicrotask(() => { if (this.isConnected) this.#sync(); });
  }
  disconnectedCallback(): void { this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(): void {
    if (!this.#dirty) this.#value = this.defaultValue;
    if (this.#value !== null) this.#value = Math.min(this.count, this.#value);
    this.#reconcile(); this.#sync();
  }
  get value(): number | null { return this.#value; }
  set value(value: number | null) {
    if (value !== null && (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > this.count)) throw new RangeError("h6-rating.value must be null or a whole score between 1 and count.");
    this.#dirty = true; this.#value = value; this.#sync();
  }
  get defaultValue(): number | null { const value = Number(this.getAttribute("value")); return Number.isInteger(value) && value >= 1 && value <= this.count ? value : null; }
  set defaultValue(value: number | null) {
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > this.count)) throw new RangeError("Default score must be null or a whole score between 1 and count.");
    if (value === null) this.removeAttribute("value"); else this.setAttribute("value", String(value));
  }
  get count(): number { const value = Number(this.getAttribute("count")); return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 5; }
  set count(value: number) { if (!Number.isInteger(value) || value < 1 || value > 10) throw new RangeError("Rating count must be between 1 and 10."); this.setAttribute("count", String(value)); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
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
  override focus(options?: FocusOptions): void { if (!this.#disabled) this.#items[(this.#value ?? 1) - 1]?.focus(options); }
  clear(): void { this.value = null; }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#value = this.defaultValue; this.#sync(); }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    if (state === "") this.value = null;
    else { const value = Number(state); if (Number.isInteger(value) && value >= 1 && value <= this.count) this.value = value; }
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  #props(): Partial<rating.Props> { return { value: this.#value ?? -1, count: this.count, dir: direction(this), disabled: this.#disabled, readOnly: this.readOnly, required: this.required, allowHalf: false, translations: { ratingValueText: index => `${index} of ${this.count}` } }; }
  #reconcile(): void {
    const removedFocus = this.#items.slice(this.count).some(item => this.#root.activeElement === item);
    while (this.#items.length < this.count) {
      const item = document.createElement("button"); item.type = "button"; item.part.add("item");
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg"); icon.setAttribute("part", "icon"); icon.setAttribute("viewBox", "0 0 24 24"); icon.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(icon.namespaceURI, "path"); path.setAttribute("d", starPath); icon.append(path); item.append(icon);
      this.#items.push(item); this.#control.append(item);
    }
    this.#bindings.retain([this.#container, this.#control, ...this.#items.slice(0, this.count)]);
    for (const item of this.#items.splice(this.count)) item.remove();
    if (removedFocus) queueMicrotask(() => this.focus());
  }
  #sync(): void {
    this.#internals.setFormValue(this.#value === null ? null : String(this.#value), this.#value === null ? "" : String(this.#value));
    if (this.#value === null) this.#internals.states.delete("rated"); else this.#internals.states.add("rated");
    if (this.#customError) this.#internals.setValidity({ customError: true }, this.#customError, this.#items[0]);
    else if (this.required && this.#value === null) this.#internals.setValidity({ valueMissing: true }, "Choose a rating to continue.", this.#items[0]);
    else this.#internals.setValidity({});
    this.#machine?.updateProps(this.#props()); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = rating.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#container, api.getRootProps()); this.#bindings.apply(this.#control, api.getControlProps());
    this.#label.id = String(api.getLabelProps().id); this.#label.textContent = fieldLabel(this, this.labels, "Rating");
    this.#control.setAttribute("aria-invalid", String(!this.validity.valid)); this.#control.setAttribute("aria-required", String(this.required));
    const description = referencedText(this, "aria-describedby");
    if (description) this.#control.setAttribute("aria-description", description); else this.#control.removeAttribute("aria-description");
    this.#container.toggleAttribute("data-disabled", this.#disabled); this.#container.toggleAttribute("data-readonly", this.readOnly);
    this.#clear.disabled = this.#disabled || this.readOnly || this.#value === null;
    this.#clear.setAttribute("aria-label", `Clear ${this.#label.textContent}`);
    this.#output.textContent = this.#value === null ? "Not rated" : `${this.#value} of ${this.count}`;
    this.#items.forEach((item, index) => {
      this.#bindings.apply(item, api.getItemProps({ index: index + 1 }));
      // Zag uses hover/first-item state for checked; only a committed score is checked here.
      const checked = this.#value === index + 1;
      item.setAttribute("aria-checked", String(checked)); item.toggleAttribute("data-checked", checked);
      item.tabIndex = this.#disabled ? -1 : index === (this.#value ?? 1) - 1 ? 0 : -1;
      item.disabled = this.#disabled;
      item.part.toggle("selected-item", checked);
    });
  }
}
