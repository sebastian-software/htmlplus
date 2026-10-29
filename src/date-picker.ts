import * as datePicker from "@zag-js/date-picker";
import { CalendarDate } from "@internationalized/date";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { dateTextFormat, parseCalendarDate } from "./date-value.js";
import type { DateTextFormat } from "./date-value.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { fieldLabel, referencedText } from "./field-label.js";
import { createIcon } from "./icons.js";
import { calendarTemplate, CalendarViews } from "./calendar.js";
import { LocaleContext, resolvedLocale, localeWeekStart } from "./locale.js";

const firstDate = parseCalendarDate("0001-01-01")!;
const lastDate = parseCalendarDate("9999-12-31")!;

/** Native editor and form owner around Zag's calendar navigation and popup behavior. */
export class H6DatePicker extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "min", "max", "locale", "lang", "disabled", "readonly", "required", "placeholder", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #id = interactionId("date-picker");
  #root: HTMLElement;
  #control: HTMLElement;
  #input: HTMLInputElement;
  #trigger: HTMLButtonElement;
  #clear: HTMLButtonElement;
  #positioner: HTMLElement;
  #content: HTMLElement;
  #navigation: HTMLElement;
  #previous: HTMLButtonElement;
  #viewButton: HTMLButtonElement;
  #next: HTMLButtonElement;
  #views: CalendarViews;
  #machine?: InteractionMachine<datePicker.Service, datePicker.Props>;
  #bindings = new DomBindings();
  #canonical = "";
  #dirty = false;
  #formDisabled = false;
  #customError = "";
  #composing = false;
  #pendingEdit = false;
  #format: DateTextFormat = dateTextFormat("en-US")!;
  #localeValid = true;
  #localeContext = new LocaleContext(this, locale => {
    const format = dateTextFormat(locale); this.#localeValid = Boolean(format); this.#format = format ?? dateTextFormat("en-US")!;
    if (this.#canonical) this.#input.value = this.#format.format(parseCalendarDate(this.#canonical)!);
    this.hidePicker(); this.#sync(true);
  });

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true }); shadow.append(calendarTemplate.content.cloneNode(true));
    this.#root = shadow.querySelector("[part=root]")!; this.#control = shadow.querySelector("[part=control]")!;
    this.#input = shadow.querySelector("input")!; this.#input.id = `${this.#id}-editor`;
    this.#positioner = shadow.querySelector("[part=positioner]")!; this.#content = shadow.querySelector("[part=content]")!;
    this.#navigation = shadow.querySelector("[part=navigation]")!;
    const button = (part: string, icon?: Parameters<typeof createIcon>[0]): HTMLButtonElement => {
      const node = document.createElement("button"); node.type = "button"; node.part.add(part); if (icon) node.append(createIcon(icon)); return node;
    };
    this.#trigger = button("trigger", "calendar"); this.#clear = button("clear-button", "close"); this.#control.append(this.#trigger, this.#clear);
    this.#previous = button("prev-button", "chevron-left"); this.#viewButton = button("view-button"); this.#next = button("next-button", "chevron-right"); this.#navigation.append(this.#previous, this.#viewButton, this.#next);
    this.#views = new CalendarViews(this.#content);
    this.#input.addEventListener("input", event => {
      event.stopPropagation(); if (this.#disabled || this.readOnly) return;
      this.#dirty = true; this.#pendingEdit = true;
      this.#canonical = !this.#composing ? this.#format.parse(this.displayValue)?.toString() ?? "" : "";
      this.#sync(!this.#composing); this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    this.#input.addEventListener("change", event => {
      event.stopPropagation(); if (!this.#pendingEdit) return; this.#pendingEdit = false;
      this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    });
    this.#input.addEventListener("compositionstart", () => { this.#composing = true; });
    this.#input.addEventListener("compositionend", () => { this.#composing = false; this.#canonical = this.#format.parse(this.displayValue)?.toString() ?? ""; this.#sync(true); });
    this.#input.addEventListener("keydown", event => {
      if (this.#composing || event.isComposing) return;
      if (event.key === "F4" || event.altKey && event.key === "ArrowDown") { event.preventDefault(); this.showPicker(); }
      else if (event.key === "Escape" && this.#api?.open) { event.preventDefault(); this.hidePicker(); }
    });
    // The editor is intentionally outside Zag's [data-part=input] lookup: it owns raw text and undo.
    this.#input.addEventListener("focus", () => { if (this.#api?.open) this.hidePicker(); });
    this.#clear.addEventListener("click", () => {
      if (this.#disabled || this.readOnly) return;
      const changed = Boolean(this.value || this.displayValue); this.clear(); this.focus(); if (changed) this.#emitCommit();
    });
    this.addEventListener("click", event => { if (event.composedPath()[0] === this) this.focus(); });
    this.addEventListener("invalid", () => { this.setAttribute("data-touched", ""); });
  }
  connectedCallback(): void {
    this.#localeContext.connect();
    const config = this.#config;
    this.#machine = new VanillaMachine(datePicker.machine, {
      ...this.#props, id: this.#id, getRootNode: () => this.shadowRoot!, selectionMode: "single", fixedWeeks: true,
      defaultFocusedValue: this.#focusDate, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      positioning: { strategy: "fixed", placement: "bottom-start", gutter: 6, overflowPadding: 8 },
      onValueChange: ({ value }) => {
        if (this.#disabled || this.readOnly || this.#config.message) return;
        const before = this.value, raw = value[0]?.toString() ?? "";
        this.#canonical = parseCalendarDate(raw)?.toString() ?? ""; this.#dirty = true; this.#pendingEdit = false;
        this.#input.value = this.#canonical ? this.#format.format(parseCalendarDate(this.#canonical)!) : "";
        this.#sync(); if (before !== this.value) this.#emitCommit();
      },
    });
    this.#machine.subscribe(() => this.#render()); this.#render(); this.#machine.start(); this.#sync();
    if (config.message) this.hidePicker();
    queueMicrotask(() => { if (this.isConnected) this.#render(); });
  }
  disconnectedCallback(): void { this.#localeContext.disconnect(); this.#hidePopup(); this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); this.#pendingEdit = false; }
  attributeChangedCallback(name: string): void {
    if (name === "locale" || name === "lang") this.#localeContext.update();
    if (name === "value" && !this.#dirty) this.#restoreDefault();
    this.#sync(["value", "min", "max", "locale"].includes(name));
  }
  get value(): string { return this.#canonical; }
  set value(value: string) {
    const text = String(value), date = text ? parseCalendarDate(text) : null;
    if (text && !date) throw new RangeError("Use a calendar date in YYYY-MM-DD format or an empty string.");
    this.#dirty = true;
    // Reassigning a complete canonical date must not rewrite a native edit in progress.
    if (text !== this.#canonical || !text) { this.#canonical = text; this.#input.value = date ? this.#format.format(date) : ""; }
    this.#sync(true);
  }
  get displayValue(): string { return this.#input.value; }
  set displayValue(value: string) { this.#dirty = true; this.#input.value = String(value); this.#canonical = this.#format.parse(this.displayValue)?.toString() ?? ""; this.#sync(true); }
  get defaultValue(): string { return this.getAttribute("value") ?? ""; }
  set defaultValue(value: string) { this.setAttribute("value", String(value)); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get min(): string { return this.getAttribute("min") ?? ""; }
  set min(value: string) { this.setAttribute("min", value); }
  get max(): string { return this.getAttribute("max") ?? ""; }
  set max(value: string) { this.setAttribute("max", value); }
  get locale(): string { return resolvedLocale(this); }
  set locale(value: string) { this.setAttribute("locale", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get readOnly(): boolean { return this.hasAttribute("readonly"); }
  set readOnly(value: boolean) { this.toggleAttribute("readonly", Boolean(value)); }
  get required(): boolean { return this.hasAttribute("required"); }
  set required(value: boolean) { this.toggleAttribute("required", Boolean(value)); }
  get placeholder(): string { return this.getAttribute("placeholder") ?? this.#format.placeholder; }
  set placeholder(value: string) { this.setAttribute("placeholder", value); }
  get form(): HTMLFormElement | null { return this.#internals.form; }
  get labels(): NodeList { return this.#internals.labels; }
  get validity(): ValidityState { return this.#internals.validity; }
  get validationMessage(): string { return this.#internals.validationMessage; }
  get willValidate(): boolean { return this.#internals.willValidate; }
  checkValidity(): boolean { return this.#internals.checkValidity(); }
  reportValidity(): boolean { return this.#internals.reportValidity(); }
  setCustomValidity(message: string): void { this.#customError = String(message); this.#sync(); }
  override focus(options?: FocusOptions): void { this.#input.focus(options); }
  showPicker(): void { if (!this.#disabled && !this.readOnly && !this.#config.message) this.#api?.setOpen(true); }
  hidePicker(): void { this.#api?.setOpen(false); }
  clear(): void { this.#canonical = ""; this.#input.value = ""; this.#dirty = true; this.#pendingEdit = false; this.hidePicker(); this.#sync(); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; if (disabled) this.#pendingEdit = false; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#composing = false; this.#pendingEdit = false; this.#restoreDefault(); this.removeAttribute("data-touched"); this.hidePicker(); this.#sync(true); }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    try {
      const parsed: unknown = JSON.parse(state);
      if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(value => typeof value === "string")) {
        this.#canonical = parseCalendarDate(parsed[0]!)?.toString() ?? ""; this.#input.value = this.#canonical && parsed[2] !== this.locale ? this.#format.format(parseCalendarDate(this.#canonical)!) : parsed[1]!;
        this.#dirty = true; this.#pendingEdit = false; this.hidePicker(); this.#sync(true); return;
      }
    } catch { /* A plain ISO value is also accepted as restoration state. */ }
    this.value = state;
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  get #api(): datePicker.Api | undefined { return this.#machine && datePicker.connect(this.#machine.service, normalizeProps); }
  get #config(): { min: datePicker.CalendarDate; max: datePicker.CalendarDate; message: string } {
    const min = this.min ? parseCalendarDate(this.min) : firstDate, max = this.max ? parseCalendarDate(this.max) : lastDate;
    const message = !this.#localeValid ? "Use a supported locale tag." : !min || !max ? "Use YYYY-MM-DD for minimum and maximum dates." : min.compare(max) > 0 ? "The minimum date must not exceed the maximum." : "";
    return { min: min ?? firstDate, max: max ?? lastDate, message };
  }
  get #focusDate(): datePicker.CalendarDate {
    const today = new Date(), config = this.#config;
    let date = parseCalendarDate(this.#canonical) ?? new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    if (!config.message) { if (date.compare(config.min) < 0) date = config.min; if (date.compare(config.max) > 0) date = config.max; }
    return date;
  }
  get #props(): Partial<datePicker.Props> {
    const config = this.#config, date = parseCalendarDate(this.#canonical);
    const selectable = date && !config.message && date.compare(config.min) >= 0 && date.compare(config.max) <= 0;
    return { value: selectable ? [date] : [], min: config.message ? firstDate : config.min, max: config.message ? lastDate : config.max, locale: this.#format.locale, startOfWeek: localeWeekStart(this.#format.locale), disabled: this.#disabled || Boolean(config.message), readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid, dir: direction(this) };
  }
  #restoreDefault(): void { const date = parseCalendarDate(this.defaultValue); this.#canonical = date?.toString() ?? ""; this.#input.value = date ? this.#format.format(date) : this.defaultValue; }
  #emitCommit(): void { this.dispatchEvent(new Event("input", { bubbles: true, composed: true })); this.dispatchEvent(new Event("change", { bubbles: true, composed: true })); }
  #sync(resetFocus = false): void {
    const config = this.#config, date = parseCalendarDate(this.#canonical);
    this.#internals.setFormValue(config.message ? null : this.#canonical || null, JSON.stringify([this.#canonical, this.displayValue, this.locale]));
    let flags: ValidityStateFlags = {}, message = this.#customError || config.message;
    if (message) flags = { customError: true };
    else if (this.displayValue.trim() && !date) { flags = { badInput: true }; message = `Enter a complete date (${this.#format.placeholder}) or YYYY-MM-DD.`; }
    else if (date && date.compare(config.min) < 0) { flags = { rangeUnderflow: true }; message = `Choose ${config.min.toString()} or a later date.`; }
    else if (date && date.compare(config.max) > 0) { flags = { rangeOverflow: true }; message = `Choose ${config.max.toString()} or an earlier date.`; }
    else if (this.required && !date) { flags = { valueMissing: true }; message = "Choose a date."; }
    this.#internals.setValidity(flags, message, this.#input);
    this.#input.disabled = this.#disabled; this.#input.readOnly = this.readOnly; this.#input.placeholder = this.placeholder;
    this.#input.lang = this.#format.locale;
    this.#clear.hidden = !this.displayValue; this.#clear.disabled = this.#disabled || this.readOnly;
    if (this.#disabled || this.readOnly || config.message) this.hidePicker();
    this.#machine?.updateProps(this.#props);
    if (resetFocus && this.#machine) this.#api?.setFocusedValue(this.#focusDate);
    if (date) this.#internals.states.add("selected"); else this.#internals.states.delete("selected");
    this.#render();
  }
  #hidePopup(): void { if (this.#positioner.matches(":popover-open")) this.#positioner.hidePopover(); this.#positioner.hidden = true; }
  #render(): void {
    const api = this.#api; if (!api) return;
    this.#bindings.apply(this.#root, api.getRootProps()); this.#bindings.apply(this.#control, api.getControlProps()); this.#bindings.apply(this.#trigger, api.getTriggerProps());
    this.#bindings.apply(this.#positioner, api.getPositionerProps()); this.#bindings.apply(this.#content, api.getContentProps());
    this.#bindings.apply(this.#navigation, api.getViewControlProps({ view: api.view }));
    this.#bindings.apply(this.#previous, api.getPrevTriggerProps({ view: api.view })); this.#bindings.apply(this.#next, api.getNextTriggerProps({ view: api.view }));
    this.#bindings.apply(this.#viewButton, api.getViewTriggerProps({ view: api.view })); this.#viewButton.lang = this.#format.locale; this.#viewButton.textContent = api.visibleRangeText.start === api.visibleRangeText.end ? api.visibleRangeText.start : api.visibleRangeText.formatted;
    const label = fieldLabel(this, this.labels, "Date");
    this.#input.setAttribute("aria-label", label); this.#input.setAttribute("aria-description", [referencedText(this, "aria-describedby"), `Format: ${this.#format.placeholder}; ISO YYYY-MM-DD also accepted.`].filter(Boolean).join(" "));
    this.#input.setAttribute("aria-invalid", String(!this.validity.valid)); this.#input.setAttribute("aria-required", String(this.required));
    this.#input.setAttribute("aria-keyshortcuts", "Alt+ArrowDown F4");
    this.#trigger.setAttribute("aria-label", `Open calendar for ${label}`); this.#trigger.setAttribute("aria-haspopup", "dialog"); this.#clear.setAttribute("aria-label", `Clear ${label}`);
    this.#content.setAttribute("role", "dialog"); this.#content.setAttribute("aria-modal", "false"); this.#content.setAttribute("aria-label", `${label} calendar`);
    const retained: Element[] = [this.#root, this.#control, this.#trigger, this.#positioner, this.#content, this.#navigation, this.#previous, this.#next, this.#viewButton];
    retained.push(...this.#views.render(api, this.#bindings, this.#format.locale));
    this.#bindings.retain(retained);
    if (api.open && !this.#disabled && !this.readOnly && !this.#config.message && this.isConnected) {
      this.#positioner.hidden = false; if (!this.#positioner.matches(":popover-open")) this.#positioner.showPopover(); this.#internals.states.add("open");
    } else { this.#hidePopup(); this.#internals.states.delete("open"); }
  }
}
