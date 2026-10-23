import * as select from "@zag-js/select";
import * as combobox from "@zag-js/combobox";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { fieldLabel, referencedText } from "./field-label.js";
import { createIcon } from "./icons.js";
import { hostStyles } from "./styles.js";
import { radius, theme } from "./theme.js";

interface Choice { value: string; label: string; disabled: boolean; }

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [hidden] { display: none !important; }
  button, input { font: inherit; color: inherit; }
  button { cursor: pointer; }
  [part=control] { display: flex; align-items: center; min-height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: 0 1px 2px #00000005; }
  [part=control]:focus-within { border-color: ${theme("ring")}; }
  [part=trigger], [part=input] { min-width: 0; border: 0; border-radius: inherit; background: transparent; outline: none; }
  [part=trigger] { display: flex; align-items: center; gap: .5rem; justify-content: space-between; flex: 1; min-height: calc(var(--hp-control-height, 2.5rem) - 2px); padding: .5rem .75rem; text-align: start; }
  [part=value-text] { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  [part=trigger][data-placeholder-shown] [part=value-text], input::placeholder { color: ${theme("muted-foreground")}; opacity: 1; }
  [part=input] { flex: 1; width: 100%; height: calc(var(--hp-control-height, 2.5rem) - 2px); padding: .5rem .75rem; }
  [part=trigger].input-trigger, [part=clear-button] { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 2rem; height: 2rem; min-height: 0; padding: .375rem; margin-inline-end: .1875rem; border: 1px solid transparent; border-radius: ${radius("sm")}; background: transparent; color: ${theme("muted-foreground")}; }
  [part=trigger].input-trigger:hover, [part=clear-button]:hover { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  button:focus-visible, input:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  [part=control]:has([part=input]:focus-visible, [part=trigger]:focus-visible) { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  [part=input]:focus-visible, [part=trigger]:focus-visible { outline: none; }
  svg { display: block; flex: 0 0 auto; width: 1rem; height: 1rem; }
  [part=indicator] { color: ${theme("muted-foreground")}; }
  [part=control][data-disabled] { opacity: .5; cursor: not-allowed; }
  button:disabled { cursor: not-allowed; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
  [part=positioner] { inset: auto; margin: 0; padding: 0; border: 0; overflow: visible; background: transparent; color: inherit; max-width: calc(100vw - 1rem); }
  [part=content] { width: 100%; min-width: 0; max-height: min(18rem, var(--available-height, 18rem)); margin: 0; padding: .25rem; overflow: auto; overscroll-behavior: contain; list-style: none; outline: none; border: 1px solid ${theme("border")}; border-radius: ${radius("md")}; background: ${theme("popover")}; color: ${theme("popover-foreground")}; box-shadow: 0 4px 6px -1px #00000018, 0 2px 4px -2px #00000018; }
  [part~=option] { display: flex; align-items: center; gap: .5rem; min-height: 2.25rem; padding: .5rem .625rem; border-radius: ${radius("sm")}; cursor: default; overflow-wrap: anywhere; }
  [part~=option][data-highlighted] { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  [part~=option][data-disabled] { opacity: .5; }
  [part=option-label] { flex: 1; min-width: 0; }
  [part=option-indicator] { visibility: hidden; }
  [part~=selected-option] [part=option-indicator] { visibility: visible; }
  [part=empty] { padding: .75rem; color: ${theme("muted-foreground")}; }
  @media (forced-colors: active) { [part~=selected-option] { outline: 1px solid Highlight; outline-offset: -1px; } [part~=option][data-highlighted] { background: Highlight; color: HighlightText; } }
</style><div part="root"><div part="control"></div></div>
<div part="positioner" popover="manual" hidden><div part="content"><div part="empty" role="status">No options found.</div></div></div>`;

/** Shared single-selection form boundary; each subclass uses its own Zag machine. */
class H6Choice extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "disabled", "readonly", "required", "placeholder", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #editable: boolean;
  #root: HTMLElement;
  #control: HTMLElement;
  #trigger: HTMLButtonElement;
  #input?: HTMLInputElement;
  #valueText?: HTMLElement;
  #clear: HTMLButtonElement;
  #positioner: HTMLElement;
  #content: HTMLElement;
  #empty: HTMLElement;
  #select?: InteractionMachine<select.Service, select.Props>;
  #combo?: InteractionMachine<combobox.Service, combobox.Props>;
  #bindings = new DomBindings();
  #options: Choice[] = [];
  #items = new Map<string, HTMLElement>();
  #selected = "";
  #query = "";
  #filtering = false;
  #dirty = false;
  #formDisabled = false;
  #customError = "";
  #composing = false;
  #observer = new MutationObserver(() => this.#readOptions());

  constructor(editable: boolean) {
    super(); this.#editable = editable;
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.append(template.content.cloneNode(true));
    this.#root = shadow.querySelector("[part=root]")!;
    this.#control = shadow.querySelector("[part=control]")!;
    this.#positioner = shadow.querySelector("[part=positioner]")!;
    this.#content = shadow.querySelector("[part=content]")!;
    this.#empty = shadow.querySelector("[part=empty]")!;
    this.#trigger = document.createElement("button"); this.#trigger.type = "button"; this.#trigger.part.add("trigger");
    const indicator = createIcon("chevron-down"); indicator.part.add("indicator");
    if (editable) {
      this.#input = document.createElement("input"); this.#input.part.add("input"); this.#control.append(this.#input);
      this.#trigger.className = "input-trigger";
      this.#input.addEventListener("keydown", event => {
        if (this.#composing) event.stopImmediatePropagation();
        else if (event.key === "Tab") this.#close();
      });
      this.#input.addEventListener("compositionstart", () => { this.#composing = true; });
      this.#input.addEventListener("compositionend", () => {
        this.#composing = false; this.#query = this.#input!.value; this.#sync();
        this.#combo?.service.send({ type: "INPUT.CHANGE", value: this.#query, src: "input-change" });
      });
      // Native blur/change is query editing, not a second selection commit.
      this.#input.addEventListener("change", event => event.stopPropagation());
    } else {
      this.#valueText = document.createElement("span"); this.#valueText.part.add("value-text"); this.#trigger.append(this.#valueText);
    }
    this.#trigger.append(indicator); this.#control.append(this.#trigger);
    this.#clear = document.createElement("button"); this.#clear.type = "button"; this.#clear.part.add("clear-button"); this.#clear.append(createIcon("close")); this.#control.append(this.#clear);
    this.#clear.addEventListener("click", () => {
      if (this.#disabled || this.readOnly) return;
      const changed = Boolean(this.value), edited = Boolean(this.#query);
      this.clear(); this.focus();
      if (changed) this.#emitCommit(); else if (edited) this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    this.addEventListener("click", event => { if (event.composedPath()[0] === this) this.focus(); });
    this.addEventListener("invalid", () => { this.setAttribute("data-touched", ""); });
  }
  connectedCallback(): void {
    this.#readOptions();
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled"] });
    const props = {
      id: interactionId(this.#editable ? "combobox" : "select"), getRootNode: () => this.shadowRoot!,
      collection: select.collection({ items: this.#options }), value: this.value ? [this.value] : [],
      disabled: this.#disabled, readOnly: this.readOnly, dir: direction(this),
      positioning: { strategy: "fixed" as const, placement: "bottom-start" as const, sameWidth: true, gutter: 6, overflowPadding: 8 },
      onValueChange: ({ value }: { value: string[] }) => this.#choose(value[0] ?? ""),
    };
    if (this.#editable) {
      this.#combo = new VanillaMachine(combobox.machine, {
        ...props, inputValue: this.#query, selectionBehavior: "preserve", inputBehavior: "none", allowCustomValue: false,
        onOpenChange: ({ open, reason }) => {
          if (open && reason !== "input-change") { this.#filtering = false; this.#updateMachine(); }
        },
      });
      this.#combo.subscribe(() => this.#render()); this.#render(); this.#combo.start();
    } else {
      this.#select = new VanillaMachine(select.machine, props);
      this.#select.subscribe(() => this.#render()); this.#render(); this.#select.start();
    }
    this.#sync(); queueMicrotask(() => { if (this.isConnected) this.#render(); });
  }
  disconnectedCallback(): void {
    this.#observer.disconnect(); this.#hidePopup(); this.#select?.stop(); this.#combo?.stop();
    this.#select = undefined; this.#combo = undefined; this.#bindings.clear();
  }
  attributeChangedCallback(name: string): void {
    if (name === "value" && !this.#dirty) { this.#selected = this.defaultValue; this.#query = this.#selectedOption?.label ?? ""; this.#filtering = false; }
    this.#sync();
  }
  get value(): string { return this.#selectedOption?.value ?? ""; }
  set value(value: string) { this.#dirty = true; this.#selected = String(value); this.#query = this.#selectedOption?.label ?? ""; this.#filtering = false; this.#close(); this.#sync(); }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  set defaultValue(value: string) { this.setAttribute("value", String(value)); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get placeholder(): string { return this.getAttribute("placeholder") ?? (this.#editable ? "Search options…" : "Choose an option…"); }
  set placeholder(value: string) { this.setAttribute("placeholder", value); }
  get form(): HTMLFormElement | null { return this.#internals.form; }
  get labels(): NodeList { return this.#internals.labels; }
  get validity(): ValidityState { return this.#internals.validity; }
  get validationMessage(): string { return this.#internals.validationMessage; }
  get willValidate(): boolean { return this.#internals.willValidate; }
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  setCustomValidity(message: string): void { this.#customError = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void { (this.#input ?? this.#trigger).focus(options); }
  clear(): void { this.value = ""; }
  protected get queryText(): string { return this.#query; }
  protected set queryText(value: string) {
    this.#dirty = true; this.#query = String(value); this.#filtering = true;
    if (this.#query !== this.#selectedOption?.label) this.#selected = "";
    this.#sync();
  }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; this.#sync(); }
  formResetCallback(): void {
    this.#dirty = false; this.#selected = this.defaultValue; this.#query = this.#selectedOption?.label ?? "";
    this.#filtering = false; this.#composing = false; this.removeAttribute("data-touched"); this.#close(); this.#sync();
  }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    try {
      const parsed: unknown = JSON.parse(state);
      if (Array.isArray(parsed) && parsed.length === 2 && parsed.every(value => typeof value === "string")) {
        this.value = parsed[0]!; if (this.#editable && !this.value) this.queryText = parsed[1]!; return;
      }
    } catch { /* Older state can contain only the selected identifier. */ }
    this.value = state;
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  get #selectedOption(): Choice | undefined { return this.#options.find(option => option.value === this.#selected && !option.disabled); }
  get #visibleOptions(): Choice[] {
    const query = this.#query.trim().toLocaleLowerCase();
    return this.#editable && this.#filtering && query ? this.#options.filter(option => option.label.toLocaleLowerCase().includes(query)) : this.#options;
  }
  #readOptions(): void {
    const previous = this.#selectedOption;
    const seen = new Set<string>();
    this.#options = Array.from(this.children).filter((child): child is HTMLOptionElement => child instanceof HTMLOptionElement)
      .filter(option => { if (!option.value || seen.has(option.value)) return false; seen.add(option.value); return true; })
      .map(option => ({ value: option.value, label: option.label, disabled: option.disabled }));
    if (previous && !this.#selectedOption) { this.#selected = ""; if (!this.#editable) this.#query = ""; }
    if (this.#selectedOption && (!previous || this.#query === previous.label)) this.#query = this.#selectedOption.label;
    for (const [value, node] of this.#items) if (!seen.has(value)) { node.remove(); this.#items.delete(value); }
    this.#sync();
  }
  #choose(value: string): void {
    if (this.#disabled || this.readOnly) return;
    const before = this.value;
    this.#selected = value; this.#query = this.#selectedOption?.label ?? ""; this.#dirty = true; this.#filtering = false;
    this.#sync(); if (this.value !== before) this.#emitCommit();
  }
  #edit(event: InputEvent): void {
    event.stopPropagation(); if (this.#disabled || this.readOnly) return;
    const before = this.value;
    this.#query = this.#input!.value; this.#selected = ""; this.#filtering = true; this.#dirty = true;
    this.#sync(); this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    if (before) this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
  #emitCommit(): void {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
  #close(): void { this.#select && select.connect(this.#select.service, normalizeProps).setOpen(false); this.#combo && combobox.connect(this.#combo.service, normalizeProps).setOpen(false); }
  #updateMachine(): void {
    const props = { value: this.value ? [this.value] : [], collection: select.collection({ items: this.#visibleOptions }), disabled: this.#disabled, readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid, dir: direction(this) };
    this.#select?.updateProps(props);
    this.#combo?.updateProps({ ...props, ...(!this.#composing ? { inputValue: this.#query } : {}), placeholder: this.placeholder });
  }
  #sync(): void {
    const value = this.value;
    this.#internals.setFormValue(value || null, JSON.stringify([value, this.#query]));
    const message = this.#customError || (this.required && !value ? "Choose an option." : "");
    this.#internals.setValidity(message ? this.#customError ? { customError: true } : { valueMissing: true } : {}, message, this.#input ?? this.#trigger);
    if (value) this.#internals.states.add("selected"); else this.#internals.states.delete("selected");
    if (this.#disabled || this.readOnly) this.#close();
    this.#updateMachine(); this.#render();
  }
  #hidePopup(): void { if (this.#positioner.matches(":popover-open")) this.#positioner.hidePopover(); this.#positioner.hidden = true; }
  #render(): void {
    const api = this.#select ? select.connect(this.#select.service, normalizeProps) : this.#combo ? combobox.connect(this.#combo.service, normalizeProps) : undefined;
    if (!api) return;
    this.#bindings.apply(this.#root, api.getRootProps()); this.#bindings.apply(this.#control, api.getControlProps());
    this.#bindings.apply(this.#trigger, api.getTriggerProps());
    this.#bindings.apply(this.#positioner, api.getPositionerProps()); this.#bindings.apply(this.#content, api.getContentProps());
    const label = fieldLabel(this, this.labels, "Choose an option");
    const target = this.#input ?? this.#trigger;
    if (this.#input && this.#combo) {
      const props = combobox.connect(this.#combo.service, normalizeProps).getInputProps();
      // The native editor owns live text and undo; normalized defaultValue must not rewrite it during renders.
      delete props.value; delete props.name; delete props.form;
      const oninput = props.oninput as ((event: InputEvent) => void) | undefined;
      props.oninput = (event: InputEvent) => { this.#edit(event); if (!this.#composing) oninput?.(event); };
      this.#bindings.apply(this.#input, props);
      if (!this.#composing && this.#input.value !== this.#query) this.#input.value = this.#query;
      this.#trigger.setAttribute("aria-label", `Show options for ${label}`);
    }
    target.removeAttribute("aria-labelledby"); target.setAttribute("aria-label", label);
    target.setAttribute("aria-description", referencedText(this, "aria-describedby"));
    target.setAttribute("aria-invalid", String(!this.validity.valid)); target.setAttribute("aria-required", String(this.required));
    target.setAttribute("aria-readonly", String(this.readOnly));
    this.#content.removeAttribute("aria-labelledby"); this.#content.setAttribute("aria-label", `${label} options`);
    if (this.#valueText) this.#valueText.textContent = this.#selectedOption?.label ?? this.placeholder;
    this.#clear.hidden = !this.value && !this.#query; this.#clear.disabled = this.#disabled || this.readOnly; this.#clear.setAttribute("aria-label", `Clear ${label}`);
    const visible = this.#visibleOptions;
    for (const option of this.#options) {
      let node = this.#items.get(option.value);
      if (!node) {
        node = document.createElement("div"); node.part.add("option");
        const text = document.createElement("span"); text.part.add("option-label");
        const check = createIcon("check"); check.part.add("option-indicator"); node.append(text, check);
        this.#items.set(option.value, node);
      }
      node.firstElementChild!.textContent = option.label;
      this.#bindings.apply(node, api.getItemProps({ item: option }));
      node.part.toggle("selected-option", this.value === option.value); node.hidden = !visible.includes(option);
      this.#content.insertBefore(node, this.#empty);
    }
    this.#empty.hidden = visible.length > 0;
    this.#bindings.retain([this.#root, this.#control, this.#trigger, this.#positioner, this.#content, ...(this.#input ? [this.#input] : []), ...this.#items.values()]);
    if (api.open && !this.#disabled && !this.readOnly && this.isConnected) {
      this.#positioner.hidden = false;
      if (!this.#positioner.matches(":popover-open")) this.#positioner.showPopover();
      this.#internals.states.add("open");
    } else { this.#hidePopup(); this.#internals.states.delete("open"); }
  }
}

export class H6Select extends H6Choice { constructor() { super(false); } }
export class H6Combobox extends H6Choice {
  constructor() { super(true); }
  get query(): string { return this.queryText; }
  set query(value: string) { this.queryText = value; }
}
