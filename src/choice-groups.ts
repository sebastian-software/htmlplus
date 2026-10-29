import { fieldLabel, referencedText } from "./field-label.js";
import * as radio from "@zag-js/radio-group";
import * as toggle from "@zag-js/toggle-group";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles } from "./styles.js";
import { theme, radius, surfaceShadow } from "./theme.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";

type Choice = { value: string; label: string; description: string; disabled: boolean };
type Item = { node: HTMLElement; input?: HTMLInputElement; control?: HTMLElement; text: HTMLElement; description: HTMLElement };
const styles = `${hostStyles}
  [part=root] { display: flex; flex-direction: column; gap: .5rem; }
  [part=root][data-orientation=horizontal] { flex-direction: row; flex-wrap: wrap; }
  [part~=option] { position: relative; display: flex; align-items: flex-start; gap: .625rem; padding: .375rem 0; cursor: pointer; }
  [part=control] { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 1rem; height: 1rem; margin-top: .125rem; border: 1px solid ${theme("input")}; border-radius: 50%; background: ${theme("background")}; box-shadow: ${surfaceShadow("inset")}; }
  [part=control][data-state=checked] { border-color: ${theme("primary")}; }
  [part=control][data-state=checked]::after { content: ""; width: .5rem; height: .5rem; border-radius: 50%; background: ${theme("primary")}; }
  [part=control][data-focus-visible], button:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 3px; }
  [part=label] { display: block; font-weight: 500; }
  [part=description] { display: block; color: ${theme("muted-foreground")}; font-size: .75rem; line-height: 1.125rem; }
  [part=description]:empty { display: none; }
  [part~=option][data-disabled] { opacity: .5; cursor: default; }
  button[part~=option] { align-items: center; justify-content: center; min-height: var(--hp-control-height, 2.5rem); padding: .5rem .75rem; border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; color: inherit; font: inherit; box-shadow: ${surfaceShadow("raised")}; }
  button:hover:not(:disabled) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  button[data-state=on] { background: ${theme("primary")}; border-color: ${theme("primary")}; color: ${theme("primary-foreground")}; }
  button:active:not(:disabled) { box-shadow: ${surfaceShadow("pressed")}; }
  button [part=description] { color: inherit; }
  :host([data-touched]:invalid) [part=control], :host([data-touched]:invalid) button { border-color: ${theme("destructive")}; }
  @media (forced-colors: active) { [part=control][data-state=checked]::after { background: Highlight; } button[data-state=on] { outline: 2px solid Highlight; } }
`;

/** Shared option reconciliation and form ownership for two selection patterns. */
abstract class ChoiceGroup extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "required", "multiple", "orientation", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  protected current: string[] = [];
  #internals = this.attachInternals();
  #root = this.attachShadow({ mode: "open", delegatesFocus: true });
  #control: HTMLElement;
  #id = interactionId("choices");
  #items = new Map<string, Item>();
  #bindings = new DomBindings();
  #radio?: InteractionMachine<radio.Service, radio.Props>;
  #toggle?: InteractionMachine<toggle.Service, toggle.Props>;
  #observer = new MutationObserver(() => this.#sync());
  #dirty = false;
  #formDisabled = false;
  #error = "";
  protected constructor(private readonly radioMode: boolean) {
    super(); this.#root.innerHTML = `<style>${styles}</style><div part="root"></div>`; this.#control = this.#root.querySelector("div")!;
    this.#root.addEventListener("input", event => {
      event.stopPropagation(); const input = event.target;
      if (this.radioMode && input instanceof HTMLInputElement && input.checked) this.#commit([input.value]);
    });
    this.#root.addEventListener("change", event => event.stopPropagation());
    this.#root.addEventListener("keydown", event => {
      if (!(event instanceof KeyboardEvent) || !this.radioMode || this.#disabled || event.defaultPrevented || !(event.target instanceof HTMLInputElement)) return;
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!keys.includes(event.key)) return;
      // Explicit wrapping skips disabled options consistently in each browser.
      const choices = this.#choices.filter(choice => !choice.disabled);
      if (!choices.length) return;
      let forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      if (direction(this) === "rtl" && ["ArrowLeft", "ArrowRight"].includes(event.key)) forward = !forward;
      const index = choices.findIndex(choice => choice.value === (event.target as HTMLInputElement).value);
      const next = choices[(index + (forward ? 1 : -1) + choices.length) % choices.length]!;
      event.preventDefault(); this.#commit([next.value]); this.#items.get(next.value)?.input?.focus();
    });
    this.addEventListener("invalid", () => this.setAttribute("data-touched", ""));
    this.addEventListener("click", event => { if (event.composedPath()[0] === this) this.focus(); });
  }
  connectedCallback(): void {
    const onChange = (value: string[]): void => this.#commit(value);
    const shared = { id: this.#id, getRootNode: () => this.#root, disabled: this.#disabled, dir: direction(this) };
    if (this.radioMode) this.#radio = new VanillaMachine(radio.machine, { ...shared, value: this.selected[0] ?? null, onValueChange: ({ value }) => onChange(value ? [value] : []) });
    else this.#toggle = new VanillaMachine(toggle.machine, { ...shared, value: this.selected, multiple: this.multiple, onValueChange: ({ value }) => onChange(value) });
    const machine = this.#radio ?? this.#toggle!;
    machine.subscribe(() => this.#render()); this.#sync(); machine.start();
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled", "data-description"] });
  }
  disconnectedCallback(): void { this.#observer.disconnect(); this.#radio?.stop(); this.#toggle?.stop(); this.#radio = undefined; this.#toggle = undefined; this.#bindings.clear(); }
  attributeChangedCallback(name: string): void { if (name === "value" && !this.#dirty) this.current = this.defaults; this.#sync(); }
  get #choices(): Choice[] {
    const seen = new Set<string>();
    return Array.from(this.children).filter((node): node is HTMLOptionElement => node instanceof HTMLOptionElement).flatMap(option => {
      const value = option.getAttribute("value") ?? "";
      if (!value || seen.has(value)) return []; seen.add(value);
      return [{ value, label: option.label || value, description: option.dataset.description ?? "", disabled: option.disabled }];
    });
  }
  protected get selected(): string[] {
    const enabled = new Set(this.#choices.filter(choice => !choice.disabled).map(choice => choice.value));
    const values = [...new Set(this.current)].filter(value => enabled.has(value));
    return this.multiple ? values : values.slice(0, 1);
  }
  protected get defaults(): string[] {
    const value = this.getAttribute("value") ?? "";
    if (this.radioMode) return value ? [value] : [];
    try { const values: unknown = JSON.parse(value); return Array.isArray(values) ? values.filter((value): value is string => typeof value === "string") : []; } catch { return []; }
  }
  protected assign(value: string[]): void { this.#dirty = true; this.current = [...value]; this.#sync(); }
  get multiple(): boolean { return !this.radioMode && this.hasAttribute("multiple"); }
  set multiple(value: boolean) { this.toggleAttribute("multiple", !this.radioMode && Boolean(value)); }
  get orientation(): "horizontal" | "vertical" { return this.getAttribute("orientation") === "vertical" || (this.radioMode && !this.hasAttribute("orientation")) ? "vertical" : "horizontal"; }
  set orientation(value: "horizontal" | "vertical") { this.setAttribute("orientation", value); }
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
  setCustomValidity(message: string): void { this.#error = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void {
    const selected = this.selected[0];
    const item = (selected && this.#items.get(selected)) || Array.from(this.#items.values()).find(item => !(item.input ?? item.node as HTMLButtonElement).disabled);
    (item?.input ?? item?.node)?.focus(options);
  }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.current = this.defaults; this.removeAttribute("data-touched"); this.#sync(); }
  formStateRestoreCallback(state: string | File | FormData): void { if (typeof state !== "string") return; try { const values: unknown = JSON.parse(state); if (Array.isArray(values)) this.assign(values.filter((value): value is string => typeof value === "string")); } catch { /* Ignore an unsupported restoration payload. */ } }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  #commit(value: string[]): void {
    if (this.#disabled || JSON.stringify(value) === JSON.stringify(this.selected)) return;
    this.#dirty = true; this.current = value; this.#sync();
    for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
  }
  #sync(): void {
    const value = this.selected;
    const data = new FormData(); if (this.name) for (const item of value) data.append(this.name, item);
    this.#internals.setFormValue(this.radioMode ? value[0] ?? null : data, JSON.stringify(this.current));
    const anchor = Array.from(this.#items.values()).find(item => !(item.input ?? item.node as HTMLButtonElement).disabled);
    const missing = this.required && value.length === 0;
    this.#internals.setValidity(this.#error ? { customError: true } : missing ? { valueMissing: true } : {}, this.#error || (missing ? "Choose an option." : ""), anchor?.input ?? anchor?.node);
    const shared = { disabled: this.#disabled, orientation: this.orientation, dir: direction(this) };
    this.#radio?.updateProps({ ...shared, value: value[0] ?? null, required: this.required, invalid: !this.validity.valid });
    this.#toggle?.updateProps({ ...shared, value, multiple: this.multiple }); this.#render();
    for (const [choice, item] of this.#items) if (item.input) item.input.checked = value.includes(choice);
  }
  #render(): void {
    const radioApi = this.#radio && radio.connect(this.#radio.service, normalizeProps);
    const toggleApi = this.#toggle && toggle.connect(this.#toggle.service, normalizeProps);
    if (!radioApi && !toggleApi) return;
    this.#bindings.apply(this.#control, (radioApi ?? toggleApi)!.getRootProps());
    this.#control.removeAttribute("aria-labelledby");
    this.#control.setAttribute("aria-label", fieldLabel(this, this.labels, this.radioMode ? "Options" : "Toggles"));
    this.#control.setAttribute("aria-description", referencedText(this, "aria-describedby"));
    this.#control.setAttribute("aria-invalid", String(!this.validity.valid));
    const keep: Element[] = [this.#control]; const values = new Set<string>();
    for (const choice of this.#choices) {
      values.add(choice.value); let item = this.#items.get(choice.value);
      if (!item) {
        const node = document.createElement(this.radioMode ? "label" : "button"); node.part.add("option");
        const text = document.createElement("span"); text.part.add("label");
        const description = document.createElement("span"); description.part.add("description");
        const content = document.createElement("span"); content.append(text, description);
        item = { node, text, description };
        if (this.radioMode) {
          item.input = document.createElement("input"); item.input.part.add("input"); item.control = document.createElement("span"); item.control.part.add("control"); node.append(item.input, item.control);
        } else (node as HTMLButtonElement).type = "button";
        node.append(content); this.#items.set(choice.value, item);
      }
      // Move only when necessary: machine focus updates must keep native nodes in place.
      if (item.node.parentNode !== this.#control) this.#control.append(item.node);
      if (item.text.textContent !== choice.label) item.text.textContent = choice.label;
      if (item.description.textContent !== choice.description) item.description.textContent = choice.description;
      item.description.id = `${this.#id}-description-${encodeURIComponent(choice.value)}`;
      const props = { value: choice.value, disabled: choice.disabled };
      if (radioApi) {
        this.#bindings.apply(item.node, radioApi.getItemProps(props)); this.#bindings.apply(item.text, radioApi.getItemTextProps(props));
        this.#bindings.apply(item.control!, radioApi.getItemControlProps(props));
        const inputProps = radioApi.getItemHiddenInputProps(props); delete inputProps.checked;
        this.#bindings.apply(item.input!, inputProps);
        if (choice.description) item.input!.setAttribute("aria-describedby", item.description.id); else item.input!.removeAttribute("aria-describedby");
        keep.push(item.input!, item.control!, item.text);
      } else {
        this.#bindings.apply(item.node, toggleApi!.getItemProps(props));
        if (choice.description) item.node.setAttribute("aria-describedby", item.description.id); else item.node.removeAttribute("aria-describedby");
      }
      item.node.part.toggle("selected-option", this.selected.includes(choice.value)); keep.push(item.node);
    }
    for (const [value, item] of this.#items) if (!values.has(value)) { item.node.remove(); this.#items.delete(value); }
    const nodes = this.#choices.map(choice => this.#items.get(choice.value)!.node);
    nodes.forEach((node, index) => { if (this.#control.children[index] !== node) this.#control.insertBefore(node, this.#control.children[index] ?? null); });
    this.#bindings.retain(keep);
  }
}

export class H6RadioGroup extends ChoiceGroup {
  constructor() { super(true); }
  get value(): string { return this.selected[0] ?? ""; }
  set value(value: string) { this.assign(value ? [String(value)] : []); }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  set defaultValue(value: string) { this.setAttribute("value", value); }
}
export class H6ToggleGroup extends ChoiceGroup {
  constructor() { super(false); }
  get value(): string[] { return this.selected; }
  set value(value: string[]) { this.assign(Array.isArray(value) ? value.map(String) : []); }
  get defaultValue(): string[] { return this.defaults; }
  set defaultValue(value: string[]) { this.setAttribute("value", JSON.stringify(value)); }
}
