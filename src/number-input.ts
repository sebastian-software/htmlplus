import { NumberParser } from "@internationalized/number";
import * as numberInput from "@zag-js/number-input";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { label, wrap } from "./compound-input.js";
import { H6TextField } from "./text-fields.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { visiblyInvalid } from "./touched.js";
import { isEditing } from "./editing.js";
import { LocaleContext } from "./locale.js";
import { textValue } from "./upgrade.js";

// The editor never displays grouping, so a separator is more likely a mistaken decimal mark than a group.
function parseNumber(text: string, locale: string): number {
  return new NumberParser(locale, { useGrouping: false }).parse(text);
}

export class H6NumberInput extends H6TextField {
  static override observedAttributes = [
    ...H6TextField.observedAttributes,
    "min",
    "max",
    "step",
    "locale",
    "lang",
    "dir",
    "increment-label",
    "decrement-label",
  ];
  #id = interactionId("number");
  #machine?: InteractionMachine<numberInput.Service, numberInput.Props>;
  #bindings = new DomBindings();
  #control: HTMLElement;
  #silent = false;
  #activeLocale = "en-US";
  #localeDraft = false;
  #localeContext = new LocaleContext(this, (requested) => {
    const raw = this.input.value,
      value = this.#localeDraft ? NaN : parseNumber(raw, this.#activeLocale);
    try {
      this.#activeLocale = new Intl.NumberFormat(requested).resolvedOptions().locale;
    } catch {
      this.#activeLocale = "en-US";
    }
    if (!this.dirty) this.input.value = this.defaultDisplayValue;
    else if (raw.trim() && Number.isFinite(value))
      this.input.value = new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 20 }).format(
        value,
      );
    else this.#localeDraft = Boolean(raw.trim());
    this.input.lang = this.locale;
    this.refresh();
  });
  constructor() {
    super();
    this.#control = wrap(
      this,
      '<button part="decrement-trigger" type="button" aria-label="Decrease value"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><button part="increment-trigger" type="button" aria-label="Increase value"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></button>',
    );
    this.input.id = `${this.#id}-editor`;
    this.input.addEventListener(
      "input",
      () => {
        this.#localeDraft = false;
      },
      true,
    );
  }
  get locale(): string {
    return this.#activeLocale;
  }
  override get defaultInputMode(): string {
    return "decimal";
  }
  protected override get upgradedProperties(): readonly string[] {
    return ["value", "valueAsNumber"];
  }
  protected override get defaultDisplayValue(): string {
    const value = Number(this.defaultValue);
    return this.defaultValue.trim() && Number.isFinite(value)
      ? new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 20 }).format(value)
      : "";
  }
  override attributeChangedCallback(name: string): void {
    if (name === "locale" || name === "lang") this.#localeContext.update();
    if (name === "value" && !this.dirty) this.#localeDraft = false;
    super.attributeChangedCallback(name);
  }
  set locale(value: string) {
    this.setAttribute("locale", value);
  }
  get valueAsNumber(): number {
    return this.#localeDraft ? NaN : parseNumber(this.input.value, this.locale);
  }
  set valueAsNumber(value: number) {
    this.value = Number.isFinite(value) ? String(value) : "";
  }
  get min(): number {
    return this.hasAttribute("min") ? Number(this.getAttribute("min")) : Number.MIN_SAFE_INTEGER;
  }
  set min(value: number) {
    this.setAttribute("min", String(value));
  }
  get max(): number {
    return this.hasAttribute("max") ? Number(this.getAttribute("max")) : Number.MAX_SAFE_INTEGER;
  }
  set max(value: number) {
    this.setAttribute("max", String(value));
  }
  get #anyStep(): boolean {
    return this.getAttribute("step")?.trim().toLowerCase() === "any";
  }
  // As with native step="any", no step constraint applies; stepping controls still move by one.
  get step(): number {
    return this.hasAttribute("step") && !this.#anyStep ? Number(this.getAttribute("step")) : 1;
  }
  set step(value: number | "any") {
    this.setAttribute("step", String(value));
  }
  override normalizeValue(value: string): string {
    const number = this.#localeDraft ? NaN : parseNumber(value, this.locale);
    return value.trim() && Number.isFinite(number) ? String(number) : "";
  }
  override get value(): string {
    return this.normalizeValue(this.input.value);
  }
  override set value(value: string) {
    const text = textValue(value),
      number = Number(text);
    if (isEditing(this.input) && this.value === (text.trim() && Number.isFinite(number) ? String(number) : "")) {
      this.markDirty();
      this.refresh();
      return;
    }
    this.#localeDraft = false;
    const formatted =
      text.trim() && Number.isFinite(number)
        ? new Intl.NumberFormat(this.locale, { useGrouping: false, maximumFractionDigits: 20 }).format(number)
        : "";
    // The base setter owns dirty/default behavior; restore the localized editor afterward.
    super.value = text;
    this.input.value = formatted;
    this.refresh();
  }
  override connectedCallback(): void {
    this.#localeContext.connect();
    if (!this.dirty) this.input.value = this.defaultDisplayValue;
    super.connectedCallback();
    this.#machine = new VanillaMachine(numberInput.machine, {
      id: this.#id,
      getRootNode: () => this.shadowRoot!,
      value: this.input.value,
      onValueChange: ({ value, valueAsNumber }) => {
        if (this.#silent || this.input.disabled || this.readOnly) return;
        // Blur/Enter formatting must not rewrite an equivalent native draft.
        if (Object.is(valueAsNumber, this.valueAsNumber)) {
          this.refresh();
          return;
        }
        this.markDirty();
        this.#localeDraft = false;
        this.input.value = value;
        this.refresh();
        for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
      },
    });
    this.#machine.subscribe(() => this.#render());
    this.refresh();
    this.#silent = true;
    this.#machine.start();
    this.#silent = false;
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#localeContext.disconnect();
    this.#machine?.stop();
    this.#machine = undefined;
    this.#bindings.clear();
  }
  override formResetCallback(): void {
    this.#localeDraft = false;
    super.formResetCallback();
  }
  override formStateRestoreCallback(state: string): void {
    this.#localeDraft = false;
    super.formStateRestoreCallback(state);
  }
  override refresh(): void {
    super.refresh();
    const raw = this.input.value.trim(),
      value = this.valueAsNumber;
    let flags: ValidityStateFlags = {},
      message = "";
    if (!this.readOnly && !this.validity.customError) {
      if (![this.min, this.max, this.step].every(Number.isFinite) || this.min > this.max || this.step <= 0) {
        flags = { customError: true };
        message = "Set finite bounds and a positive step.";
      } else if (raw && !Number.isFinite(value)) {
        flags = { badInput: true };
        message = "Enter a number.";
      } else if (this.required && !raw) {
        flags = { valueMissing: true };
        message = "Enter a number.";
      } else if (raw && value < this.min) {
        flags = { rangeUnderflow: true };
        message = `Use a value of at least ${this.min}.`;
      } else if (raw && value > this.max) {
        flags = { rangeOverflow: true };
        message = `Use a value no greater than ${this.max}.`;
      } else if (raw && !this.#anyStep) {
        const base = this.hasAttribute("min") ? this.min : 0,
          ticks = (value - base) / this.step;
        if (Math.abs(ticks - Math.round(ticks)) > 1e-7) {
          flags = { stepMismatch: true };
          message = `Use increments of ${this.step}.`;
        }
      }
      this.internals.setValidity(flags, message, this.input);
      this.input.setAttribute("aria-invalid", String(visiblyInvalid(this)));
    }
    this.#silent = true;
    const validBounds = [this.min, this.max, this.step].every(Number.isFinite) && this.min <= this.max && this.step > 0;
    this.#machine?.updateProps({
      value: this.input.value,
      min: validBounds ? this.min : 0,
      max: validBounds ? this.max : 100,
      step: validBounds ? this.step : 1,
      locale: this.locale,
      dir: direction(this),
      disabled: this.input.disabled || !validBounds,
      readOnly: this.readOnly,
      required: this.required,
      invalid: visiblyInvalid(this),
      clampValueOnBlur: false,
      allowOverflow: false,
      formatOptions: { useGrouping: false, maximumFractionDigits: 20 },
      translations: {
        incrementLabel: this.getAttribute("increment-label") || "Increase value",
        decrementLabel: this.getAttribute("decrement-label") || "Decrease value",
      },
    });
    this.#silent = false;
    this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = numberInput.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#control, api.getControlProps());
    const props = api.getInputProps();
    // Leave composition and native edit history to the editor; Zag handles stepping.
    delete props.onbeforeinput;
    delete props.oninput;
    delete props.value;
    delete props.id;
    delete props.pattern;
    this.#bindings.apply(this.input, props);
    label(this);
    const increment = this.#control.querySelector("[part=increment-trigger]")!,
      decrement = this.#control.querySelector("[part=decrement-trigger]")!;
    this.#bindings.apply(increment, api.getIncrementTriggerProps());
    this.#bindings.apply(decrement, api.getDecrementTriggerProps());
    // Zag names an input it deliberately does not own; point at the actual editor.
    for (const trigger of [increment, decrement]) trigger.setAttribute("aria-controls", this.input.id);
  }
}
