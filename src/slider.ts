import * as slider from "@zag-js/slider";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles, numericAccent } from "./styles.js";
import { theme, radius } from "./theme.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { numericBounds, snap } from "./numeric-value.js";
import { fieldLabel, referencedText } from "./field-label.js";

export type RangeSliderValue = readonly [number, number];
const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [part=root] { display: grid; gap: .25rem; min-width: 0; }
  [part=value-text] { justify-self: end; color: ${theme("muted-foreground")}; font-size: .75rem; font-variant-numeric: tabular-nums; }
  [part=control] { height: var(--hp-control-height, 2.5rem); min-width: 0; }
  [part=track] { width: 100%; height: .375rem; top: calc(50% - .1875rem); border-radius: ${radius("sm")}; background: ${theme("muted")}; }
  [part=range] { height: 100%; border-radius: inherit; background: ${numericAccent}; }
  [part~=thumb] { top: calc(50% - .75rem); width: 1.5rem; height: 1.5rem; border: 2px solid ${numericAccent}; border-radius: 50%; background: ${theme("background")}; box-shadow: 0 1px 3px #00000015; cursor: grab; touch-action: none; }
  [part~=thumb][data-dragging] { cursor: grabbing; }
  [part~=thumb]:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 3px; }
  [data-disabled][part=root] { opacity: .5; }
  [data-disabled] [part~=thumb], [data-readonly] [part~=thumb] { cursor: default; }
  :host(:invalid) [part=track] { outline: 1px solid ${theme("destructive")}; outline-offset: 2px; }
  [data-orientation=vertical][part=root] { width: fit-content; }
  [data-orientation=vertical][part=control] { height: 12rem; width: 2.5rem; }
  [data-orientation=vertical][part=track] { top: 0; left: calc(50% - .1875rem); width: .375rem; height: 100%; }
  [data-orientation=vertical][part=range] { width: 100%; height: auto; }
  [data-orientation=vertical][part~=thumb] { top: auto; left: calc(50% - .75rem); }
  @media (forced-colors: active) { [part=track] { background: GrayText; } [part=range] { background: Highlight; } [part~=thumb] { border-color: Highlight; background: Canvas; } }
</style><div part="root"><span part="value-text" aria-hidden="true"></span><div part="control"><div part="track"><div part="range"></div></div></div></div>`;

/** One Zag slider adapter shared only by its one-thumb and two-thumb variants. */
class SliderControl extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "min", "max", "step", "disabled", "readonly", "required", "name", "lower-name", "upper-name", "lower-label", "upper-label", "orientation", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #root = this.attachShadow({ mode: "open" });
  #container: HTMLElement;
  #control: HTMLElement;
  #track: HTMLElement;
  #range: HTMLElement;
  #output: HTMLElement;
  #thumbs: HTMLElement[];
  #id = interactionId("slider");
  #machine?: InteractionMachine<slider.Service, slider.Props>;
  #bindings = new DomBindings();
  #values: number[] = [0];
  #dirty = false;
  #rangeMode: boolean;
  #formDisabled = false;
  #customError = "";
  #pendingChange = false;

  protected constructor(rangeMode: boolean) {
    super(); this.#rangeMode = rangeMode; this.#values = rangeMode ? [0, 100] : [0];
    this.#root.append(template.content.cloneNode(true));
    this.addEventListener("click", event => { if (event.composedPath()[0] === this && !event.defaultPrevented) this.focus(); });
    this.#container = this.#root.querySelector("[part=root]")!;
    this.#control = this.#root.querySelector("[part=control]")!;
    this.#track = this.#root.querySelector("[part=track]")!;
    this.#range = this.#root.querySelector("[part=range]")!;
    this.#output = this.#root.querySelector("[part=value-text]")!;
    this.#thumbs = Array.from({ length: rangeMode ? 2 : 1 }, (_, index) => {
      const thumb = document.createElement("div"); thumb.part.add("thumb");
      if (rangeMode) thumb.part.add(index ? "upper-thumb" : "lower-thumb");
      this.#control.append(thumb); return thumb;
    });
  }
  connectedCallback(): void {
    if (!this.#dirty) this.#values = this.defaults;
    this.#normalize();
    this.#machine = new VanillaMachine(slider.machine, {
      id: this.#id, getRootNode: () => this.#root, ...this.#props(),
      onValueChange: ({ value }) => {
        const next = value.map(item => snap(item, numericBounds(this)));
        if (this.#disabled || this.readOnly || next.every((item, index) => item === this.#values[index])) return;
        this.#dirty = true; this.#values = next; this.#pendingChange = true; this.#sync();
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      },
      onValueChangeEnd: () => {
        if (!this.#pendingChange) return;
        this.#pendingChange = false;
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render());
    this.#render(); this.#machine.start(); this.#sync();
    queueMicrotask(() => { if (this.isConnected) this.#sync(); });
  }
  disconnectedCallback(): void { this.#pendingChange = false; this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(): void {
    if (!this.#dirty) this.#values = this.defaults;
    this.#normalize(); this.#sync();
  }
  protected get values(): number[] { return [...this.#values]; }
  protected set values(values: number[]) { this.#dirty = true; this.#values = [...values]; this.#normalize(); this.#sync(); }
  protected get defaults(): number[] {
    const bounds = numericBounds(this);
    let parsed: unknown;
    try { parsed = this.#rangeMode ? JSON.parse(this.getAttribute("value") ?? "null") : this.hasAttribute("value") ? Number(this.getAttribute("value")) : bounds.min; } catch { parsed = null; }
    const values = this.#rangeMode ? Array.isArray(parsed) && parsed.length === 2 && parsed.every(item => typeof item === "number" && Number.isFinite(item)) && parsed[0] <= parsed[1] ? parsed as number[] : [bounds.min, bounds.max] : [typeof parsed === "number" && Number.isFinite(parsed) ? parsed : bounds.min];
    return values.map(value => snap(value, bounds));
  }
  get min(): number { return numericBounds(this).min; }
  set min(value: number) { this.setAttribute("min", String(value)); }
  get max(): number { return numericBounds(this).max; }
  set max(value: number) { this.setAttribute("max", String(value)); }
  get step(): number { return numericBounds(this).step; }
  set step(value: number) { this.setAttribute("step", String(value)); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get orientation(): "horizontal" | "vertical" { return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal"; }
  set orientation(value: "horizontal" | "vertical") { this.setAttribute("orientation", value); }
  get form(): HTMLFormElement | null { return this.#internals.form; }
  get labels(): NodeList { return this.#internals.labels; }
  get validity(): ValidityState { return this.#internals.validity; }
  get validationMessage(): string { return this.#internals.validationMessage; }
  get willValidate(): boolean { return this.#internals.willValidate; }
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  setCustomValidity(message: string): void { this.#customError = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void { if (!this.#disabled) this.#thumbs[0]!.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; if (disabled) this.#pendingChange = false; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#pendingChange = false; this.#values = this.defaults; this.#sync(); }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    try {
      const values: unknown = JSON.parse(state);
      if (Array.isArray(values) && values.length === this.#thumbs.length && values.every(value => typeof value === "number" && Number.isFinite(value)) && (values.length === 1 || values[0] <= values[1])) this.values = values;
    } catch { /* Ignore malformed restoration state. */ }
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled || Boolean(numericBounds(this).error); }
  #normalize(): void { const bounds = numericBounds(this); this.#values = this.#values.map(value => snap(value, bounds)); }
  #props(): Partial<slider.Props> {
    const { min, max, step } = numericBounds(this);
    return { min, max, step, value: this.#values, dir: direction(this), orientation: this.orientation, disabled: this.#disabled, readOnly: this.readOnly, invalid: !this.validity.valid, thumbCollisionBehavior: "none", minStepsBetweenThumbs: 0 };
  }
  #sync(): void {
    const error = this.#customError || numericBounds(this).error;
    this.#internals.setValidity(error ? { customError: true } : {}, error, this.#thumbs[0]);
    if (this.#rangeMode) {
      const data = new FormData();
      if (this.name && !numericBounds(this).error) {
        data.append(this.getAttribute("lower-name") ?? `${this.name}.min`, String(this.#values[0]));
        data.append(this.getAttribute("upper-name") ?? `${this.name}.max`, String(this.#values[1]));
      }
      this.#internals.setFormValue(this.name ? data : null, JSON.stringify(this.#values));
    } else this.#internals.setFormValue(numericBounds(this).error ? null : String(this.#values[0]), JSON.stringify(this.#values));
    this.#machine?.updateProps(this.#props()); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = slider.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#container, api.getRootProps()); this.#bindings.apply(this.#control, api.getControlProps());
    this.#container.toggleAttribute("data-readonly", this.readOnly);
    this.#bindings.apply(this.#track, api.getTrackProps()); this.#bindings.apply(this.#range, api.getRangeProps());
    this.#output.textContent = this.#values.join(" – ");
    const label = fieldLabel(this, this.labels, this.#rangeMode ? "Range" : "Value");
    this.#thumbs.forEach((thumb, index) => {
      this.#bindings.apply(thumb, api.getThumbProps({ index }));
      thumb.tabIndex = this.disabled || this.#formDisabled ? -1 : 0;
      thumb.removeAttribute("aria-labelledby");
      thumb.setAttribute("aria-label", this.#rangeMode ? `${label}: ${this.getAttribute(index ? "upper-label" : "lower-label") || (index ? "Maximum" : "Minimum")}` : label);
      thumb.setAttribute("aria-invalid", String(!this.validity.valid)); thumb.setAttribute("aria-readonly", String(this.readOnly));
      const description = referencedText(this, "aria-describedby");
      if (description) thumb.setAttribute("aria-description", description); else thumb.removeAttribute("aria-description");
    });
  }
}

export class H6Slider extends SliderControl {
  constructor() { super(false); }
  get value(): number { return this.values[0]!; }
  set value(value: number) { if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("h6-slider.value must be finite."); this.values = [value]; }
  get defaultValue(): number { return this.defaults[0]!; }
  set defaultValue(value: number) { if (!Number.isFinite(value)) throw new TypeError("Default value must be finite."); this.setAttribute("value", String(value)); }
}
export class H6RangeSlider extends SliderControl {
  constructor() { super(true); }
  get value(): RangeSliderValue { return this.values as [number, number]; }
  set value(value: RangeSliderValue) {
    if (!Array.isArray(value) || value.length !== 2 || !value.every(item => typeof item === "number" && Number.isFinite(item))) throw new TypeError("h6-range-slider.value must be two finite numbers.");
    if (value[0] > value[1]) throw new RangeError("The lower boundary must not exceed the upper boundary.");
    this.values = [...value];
  }
  get defaultValue(): RangeSliderValue { return this.defaults as [number, number]; }
  set defaultValue(value: RangeSliderValue) {
    if (!Array.isArray(value) || value.length !== 2 || !value.every(item => typeof item === "number" && Number.isFinite(item))) throw new TypeError("Default value must be two finite numbers.");
    if (value[0] > value[1]) throw new RangeError("The lower boundary must not exceed the upper boundary.");
    this.setAttribute("value", JSON.stringify(value));
  }
}
