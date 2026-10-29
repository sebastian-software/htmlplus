import { fieldLabel, referencedText } from "./field-label.js";
import * as numberInput from "@zag-js/number-input";
import * as passwordInput from "@zag-js/password-input";
import { NumberParser } from "@internationalized/number";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { H6TextField } from "./text-fields.js";
import { theme, radius, surfaceShadow } from "./theme.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";

const compoundStyles = `
  [part=control] { display: flex; align-items: center; min-height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: ${surfaceShadow("inset")}; }
  [part=control]:focus-within { border-color: ${theme("ring")}; }
  input { flex: 1; width: 0; border: 0; box-shadow: none; background: transparent; height: calc(var(--hp-control-height, 2.5rem) - 2px); }
  input:focus-visible { outline-offset: -2px; }
  button { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 2rem; height: 2rem; margin: .1875rem; padding: .375rem; border: 1px solid transparent; border-radius: ${radius("sm")}; background: transparent; color: ${theme("muted-foreground")}; font: inherit; cursor: pointer; }
  button:hover:not(:disabled) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  button:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: -2px; }
  button:disabled { opacity: .5; cursor: default; }
  svg { width: 1rem; height: 1rem; flex: none; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
`;
function wrap(host: H6TextField, buttons: string): HTMLElement {
  const root = host.shadowRoot!; const style = document.createElement("style"); style.textContent = compoundStyles;
  const control = document.createElement("div"); control.part.add("control"); control.innerHTML = buttons;
  control.prepend(host.input); root.append(style, control); return control;
}
function label(host: H6TextField): void {
  host.input.setAttribute("aria-label", fieldLabel(host, host.labels, "Text field"));
  host.input.setAttribute("aria-description", referencedText(host, "aria-describedby"));
}

export class H6PasswordInput extends H6TextField {
  static override observedAttributes = [...H6TextField.observedAttributes, "aria-labelledby", "aria-describedby", "show-label", "hide-label"];
  #id = interactionId("password");
  #machine?: InteractionMachine<passwordInput.Service, passwordInput.Props>;
  #bindings = new DomBindings();
  #control: HTMLElement;
  #trigger: HTMLButtonElement;
  #visible = false;
  #form?: HTMLFormElement | null;
  constructor() {
    super();
    this.#control = wrap(this, '<button part="visibility-trigger" type="button"><svg part="indicator" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path data-slash d="m3 3 18 18"/></svg></button>');
    this.#trigger = this.#control.querySelector("button")!;
    this.#trigger.addEventListener("click", () => {
      if (this.input.disabled) return;
      const start = this.input.selectionStart, end = this.input.selectionEnd;
      passwordInput.connect(this.#machine!.service, normalizeProps).toggleVisible();
      this.input.focus({ preventScroll: true }); if (start !== null && end !== null) this.input.setSelectionRange(start, end);
    });
  }
  override get defaultAutocomplete(): AutoFill { return "current-password"; }
  override formStateRestoreCallback(state: string): void { this.#visible = false; super.formStateRestoreCallback(state); }
  get visible(): boolean { return this.#visible; }
  set visible(value: boolean) { this.#visible = Boolean(value); this.refresh(); }
  override connectedCallback(): void {
    super.connectedCallback();
    this.#machine = new VanillaMachine(passwordInput.machine, { id: this.#id, getRootNode: () => this.shadowRoot!, visible: this.#visible,
      onVisibilityChange: ({ visible }) => { this.#visible = visible; this.refresh(); this.dispatchEvent(new CustomEvent("visibilitychange", { detail: { visible }, bubbles: true, composed: true })); },
    });
    this.#machine.subscribe(() => this.#render()); this.refresh(); this.#machine.start(); this.formAssociatedCallback(this.form);
  }
  disconnectedCallback(): void { this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); this.#form?.removeEventListener("submit", this.#hide); this.#form = null; }
  formAssociatedCallback(form: HTMLFormElement | null): void { this.#form?.removeEventListener("submit", this.#hide); this.#form = form; form?.addEventListener("submit", this.#hide); }
  #hide = (): void => { this.visible = false; };
  override formResetCallback(): void { this.#visible = false; super.formResetCallback(); }
  override refresh(): void {
    super.refresh();
    this.#machine?.updateProps({ visible: this.#visible, disabled: this.input.disabled, readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid,
      autoComplete: this.getAttribute("autocomplete") === "new-password" ? "new-password" : "current-password", dir: direction(this),
      translations: { visibilityTrigger: visible => this.getAttribute(visible ? "hide-label" : "show-label") || (visible ? "Hide password" : "Show password") },
    }); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = passwordInput.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#control, api.getControlProps()); this.#bindings.apply(this.input, api.getInputProps());
    // Native click handles keyboard, touch, and pointer exactly once.
    const props = api.getVisibilityTriggerProps(); delete props.onpointerdown;
    this.#bindings.apply(this.#trigger, props); this.#trigger.tabIndex = this.input.disabled ? -1 : 0;
    this.#trigger.removeAttribute("aria-expanded");
    this.#trigger.querySelector<SVGElement>("[data-slash]")!.style.display = this.#visible ? "none" : ""; label(this);
  }
}

export class H6NumberInput extends H6TextField {
  static override observedAttributes = [...H6TextField.observedAttributes, "min", "max", "step", "locale", "dir", "aria-labelledby", "aria-describedby", "increment-label", "decrement-label"];
  #id = interactionId("number");
  #machine?: InteractionMachine<numberInput.Service, numberInput.Props>;
  #bindings = new DomBindings();
  #control: HTMLElement;
  #silent = false;
  constructor() {
    super(); this.#control = wrap(this, '<button part="decrement-trigger" type="button" aria-label="Decrease value"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><button part="increment-trigger" type="button" aria-label="Increase value"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></button>');
    this.input.id = `${this.#id}-editor`;
  }
  get locale(): string { const value = this.getAttribute("locale") || this.closest("[lang]")?.getAttribute("lang") || "en-US"; try { return new Intl.NumberFormat(value).resolvedOptions().locale; } catch { return "en-US"; } }
  override get defaultInputMode(): string { return "decimal"; }
  protected override get defaultDisplayValue(): string {
    const value = Number(this.defaultValue);
    return this.defaultValue.trim() && Number.isFinite(value) ? new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 20 }).format(value) : "";
  }
  override attributeChangedCallback(name: string): void {
    super.attributeChangedCallback(name);
    if (name === "locale" && !this.dirty) { this.input.value = this.defaultDisplayValue; this.refresh(); }
  }
  set locale(value: string) { this.setAttribute("locale", value); }
  get valueAsNumber(): number { return new NumberParser(this.locale).parse(this.input.value); }
  set valueAsNumber(value: number) { this.value = Number.isFinite(value) ? String(value) : ""; }
  get min(): number { return this.hasAttribute("min") ? Number(this.getAttribute("min")) : Number.MIN_SAFE_INTEGER; }
  set min(value: number) { this.setAttribute("min", String(value)); }
  get max(): number { return this.hasAttribute("max") ? Number(this.getAttribute("max")) : Number.MAX_SAFE_INTEGER; }
  set max(value: number) { this.setAttribute("max", String(value)); }
  get step(): number { return this.hasAttribute("step") ? Number(this.getAttribute("step")) : 1; }
  set step(value: number) { this.setAttribute("step", String(value)); }
  override normalizeValue(value: string): string { const number = new NumberParser(this.locale).parse(value); return value.trim() && Number.isFinite(number) ? String(number) : ""; }
  override get value(): string { return this.normalizeValue(this.input.value); }
  override set value(value: string) {
    const number = Number(value); const formatted = value.trim() && Number.isFinite(number) ? new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 20 }).format(number) : "";
    // The base setter owns dirty/default behavior; restore the localized editor afterward.
    super.value = value; this.input.value = formatted; this.refresh();
  }
  override connectedCallback(): void {
    if (!this.dirty) this.input.value = this.defaultDisplayValue;
    super.connectedCallback(); this.#machine = new VanillaMachine(numberInput.machine, { id: this.#id, getRootNode: () => this.shadowRoot!, value: this.input.value,
      onValueChange: ({ value, valueAsNumber }) => {
        if (this.#silent || this.input.disabled || this.readOnly) return;
        // Blur/Enter formatting must not rewrite an equivalent native draft.
        if (Object.is(valueAsNumber, this.valueAsNumber)) { this.refresh(); return; }
        this.markDirty(); this.input.value = value;
        this.refresh();
        for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render()); this.refresh(); this.#silent = true; this.#machine.start(); this.#silent = false;
  }
  disconnectedCallback(): void { this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  override refresh(): void {
    super.refresh();
    const raw = this.input.value.trim(), value = this.valueAsNumber;
    let flags: ValidityStateFlags = {}, message = "";
    if (!this.readOnly && !this.validity.customError) {
      if (![this.min, this.max, this.step].every(Number.isFinite) || this.min > this.max || this.step <= 0) { flags = { customError: true }; message = "Set finite bounds and a positive step."; }
      else if (raw && !Number.isFinite(value)) { flags = { badInput: true }; message = "Enter a number."; }
      else if (this.required && !raw) { flags = { valueMissing: true }; message = "Enter a number."; }
      else if (raw && value < this.min) { flags = { rangeUnderflow: true }; message = `Use a value of at least ${this.min}.`; }
      else if (raw && value > this.max) { flags = { rangeOverflow: true }; message = `Use a value no greater than ${this.max}.`; }
      else if (raw) {
        const base = this.hasAttribute("min") ? this.min : 0, ticks = (value - base) / this.step;
        if (Math.abs(ticks - Math.round(ticks)) > 1e-7) { flags = { stepMismatch: true }; message = `Use increments of ${this.step}.`; }
      }
      this.internals.setValidity(flags, message, this.input);
    }
    this.#silent = true;
    const validBounds = [this.min, this.max, this.step].every(Number.isFinite) && this.min <= this.max && this.step > 0;
    this.#machine?.updateProps({ value: this.input.value, min: validBounds ? this.min : 0, max: validBounds ? this.max : 100, step: validBounds ? this.step : 1, locale: this.locale, dir: direction(this),
      disabled: this.input.disabled || !validBounds, readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid, clampValueOnBlur: false, allowOverflow: false, formatOptions: { useGrouping: false, maximumFractionDigits: 20 },
      translations: { incrementLabel: this.getAttribute("increment-label") || "Increase value", decrementLabel: this.getAttribute("decrement-label") || "Decrease value" },
    }); this.#silent = false; this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = numberInput.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#control, api.getControlProps());
    const props = api.getInputProps();
    // Leave composition and native edit history to the editor; Zag handles stepping.
    delete props.onbeforeinput; delete props.oninput; delete props.value; delete props.id; delete props.pattern;
    this.#bindings.apply(this.input, props); label(this);
    this.#bindings.apply(this.#control.querySelector("[part=increment-trigger]")!, api.getIncrementTriggerProps());
    this.#bindings.apply(this.#control.querySelector("[part=decrement-trigger]")!, api.getDecrementTriggerProps());
  }
}
