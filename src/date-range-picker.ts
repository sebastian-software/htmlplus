import * as datePicker from "@zag-js/date-picker";
import { CalendarDate } from "@internationalized/date";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { calendarTemplate, CalendarViews } from "./calendar.js";
import { dateTextFormat, parseCalendarDate } from "./date-value.js";
import type { DateTextFormat } from "./date-value.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { fieldLabel, referencedText } from "./field-label.js";
import { createIcon } from "./icons.js";
import { theme } from "./theme.js";

export type DateRangeValue = [string | null, string | null];
const firstDate = parseCalendarDate("0001-01-01")!;
const lastDate = parseCalendarDate("9999-12-31")!;
const sides = ["start", "end"] as const;
function dateRange(value: unknown): DateRangeValue {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(item => item === null || typeof item === "string" && Boolean(parseCalendarDate(item)))) {
    throw new RangeError("Use two YYYY-MM-DD calendar dates, with null for an empty boundary.");
  }
  return [value[0], value[1]];
}

/** Two native editors and two named form values around Zag's range calendar. */
export class H6DateRangePicker extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "start-name", "end-name", "start-label", "end-label", "min", "max", "locale", "disabled", "readonly", "required", "placeholder", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
  #internals = this.attachInternals();
  #id = interactionId("date-range-picker");
  #root: HTMLElement;
  #control: HTMLElement;
  #inputs: [HTMLInputElement, HTMLInputElement];
  #labels: HTMLElement[] = [];
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
  #canonical: DateRangeValue = [null, null];
  #dirty = false;
  #formDisabled = false;
  #customError = "";
  #composing = [false, false];
  #pendingEdit = [false, false];
  #format: DateTextFormat = dateTextFormat("en-US")!;
  #localeValid = true;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true }); shadow.append(calendarTemplate.content.cloneNode(true));
    const style = document.createElement("style");
    style.textContent = `
      [part=control] { min-height: 3.5rem; }
      [part=start-field], [part=end-field] { flex: 1; min-width: 0; }
      [part=start-field] { border-inline-end: 1px solid ${theme("input")}; }
      [part=start-label], [part=end-label] { display: block; padding: .375rem .75rem 0; font-size: .75rem; line-height: 1rem; color: ${theme("muted-foreground")}; }
      [part~=input] { display: block; height: 2rem; padding: .125rem .75rem .375rem; }
      [part~=in-range]:not([data-selected]) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; border-radius: 0; }
      [part~=preview-day]:not([data-selected]) { outline: 1px dashed ${theme("ring")}; outline-offset: -2px; }
      @media (forced-colors: active) { [part~=in-range] { outline: 1px solid Highlight; outline-offset: -2px; } }
    `;
    shadow.append(style);
    this.#root = shadow.querySelector("[part=root]")!; this.#control = shadow.querySelector("[part=control]")!;
    const original = shadow.querySelector("input")!; this.#inputs = [original, original.cloneNode() as HTMLInputElement];
    this.#control.replaceChildren();
    this.#inputs.forEach((input, index) => {
      input.id = `${this.#id}-${sides[index]}`; input.part.add(`${sides[index]}-input`);
      const wrapper = document.createElement("div"), label = document.createElement("label");
      wrapper.part.add(`${sides[index]}-field`); label.part.add(`${sides[index]}-label`); label.htmlFor = input.id;
      wrapper.append(label, input); this.#labels.push(label); this.#control.append(wrapper);
      input.addEventListener("input", event => {
        event.stopPropagation(); if (this.#disabled || this.readOnly) return;
        this.#dirty = true; this.#pendingEdit[index] = true;
        this.#canonical[index] = !this.#composing[index] ? this.#format.parse(input.value)?.toString() ?? null : null;
        this.#sync(!this.#composing[index]); this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      });
      input.addEventListener("change", event => {
        event.stopPropagation(); if (!this.#pendingEdit[index]) return; this.#pendingEdit[index] = false;
        this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      });
      input.addEventListener("compositionstart", () => { this.#composing[index] = true; });
      input.addEventListener("compositionend", () => { this.#composing[index] = false; this.#canonical[index] = this.#format.parse(input.value)?.toString() ?? null; this.#sync(true); });
      input.addEventListener("keydown", event => {
        if (this.#composing[index] || event.isComposing) return;
        if (event.key === "F4" || event.altKey && event.key === "ArrowDown") { event.preventDefault(); this.showPicker(); }
        else if (event.key === "Escape" && this.#api?.open) { event.preventDefault(); this.hidePicker(); }
      });
      // Native editors stay outside Zag's [data-part=input] lookup to preserve raw text and undo.
      input.addEventListener("focus", () => { if (this.#api?.open) this.hidePicker(); });
    });
    this.#positioner = shadow.querySelector("[part=positioner]")!; this.#content = shadow.querySelector("[part=content]")!; this.#navigation = shadow.querySelector("[part=navigation]")!;
    const button = (part: string, icon?: Parameters<typeof createIcon>[0]): HTMLButtonElement => {
      const node = document.createElement("button"); node.type = "button"; node.part.add(part); if (icon) node.append(createIcon(icon)); return node;
    };
    this.#trigger = button("trigger", "calendar"); this.#clear = button("clear-button", "close"); this.#control.append(this.#trigger, this.#clear);
    this.#previous = button("prev-button", "chevron-left"); this.#viewButton = button("view-button"); this.#next = button("next-button", "chevron-right"); this.#navigation.append(this.#previous, this.#viewButton, this.#next);
    this.#views = new CalendarViews(this.#content);
    this.#clear.addEventListener("click", () => {
      if (this.#disabled || this.readOnly) return;
      const changed = this.displayValue.some(Boolean); this.clear(); this.focus(); if (changed) this.#emitCommit();
    });
    this.addEventListener("click", event => { if (event.composedPath()[0] === this) this.focus(); });
    this.addEventListener("invalid", () => { this.setAttribute("data-touched", ""); });
  }
  connectedCallback(): void {
    this.#machine = new VanillaMachine(datePicker.machine, {
      ...this.#props, id: this.#id, getRootNode: () => this.shadowRoot!, selectionMode: "range", fixedWeeks: true, outsideDaySelectable: true,
      defaultFocusedValue: this.#focusDate, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      positioning: { strategy: "fixed", placement: "bottom-start", gutter: 6, overflowPadding: 8 },
      onValueChange: ({ value }) => {
        if (this.#disabled || this.readOnly || this.#config.message) return;
        const before = JSON.stringify(this.displayValue);
        this.#canonical = [parseCalendarDate(value[0]?.toString() ?? "")?.toString() ?? null, parseCalendarDate(value[1]?.toString() ?? "")?.toString() ?? null];
        this.#dirty = true; this.#pendingEdit = [false, false]; this.#write(); this.#sync();
        if (before !== JSON.stringify(this.displayValue)) this.#emitCommit();
      },
    });
    this.#machine.subscribe(() => this.#render()); this.#render(); this.#machine.start(); this.#sync();
    queueMicrotask(() => { if (this.isConnected) this.#render(); });
  }
  disconnectedCallback(): void { this.#hidePopup(); this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); this.#pendingEdit = [false, false]; }
  attributeChangedCallback(name: string): void {
    if (name === "locale") {
      const format = dateTextFormat(this.locale); this.#localeValid = Boolean(format); this.#format = format ?? dateTextFormat("en-US")!;
      this.#canonical.forEach((date, index) => { if (date) this.#inputs[index]!.value = this.#format.format(parseCalendarDate(date)!); });
    }
    if (name === "value" && !this.#dirty) this.#restoreDefault();
    this.#sync(["value", "min", "max", "locale"].includes(name));
  }
  get value(): DateRangeValue { return [...this.#canonical]; }
  set value(value: DateRangeValue) {
    const next = dateRange(value); this.#dirty = true;
    next.forEach((date, index) => { if (date !== this.#canonical[index] || date === null) this.#inputs[index]!.value = date ? this.#format.format(parseCalendarDate(date)!) : ""; });
    this.#canonical = next; this.#sync(true);
  }
  get displayValue(): [string, string] { return [this.#inputs[0].value, this.#inputs[1].value]; }
  set displayValue(value: [string, string]) {
    if (!Array.isArray(value) || value.length !== 2 || !value.every(item => typeof item === "string")) throw new TypeError("Use two date input strings.");
    this.#dirty = true; this.#inputs.forEach((input, index) => { input.value = value[index]!; this.#canonical[index] = this.#format.parse(input.value)?.toString() ?? null; }); this.#sync(true);
  }
  get defaultValue(): DateRangeValue { try { return dateRange(JSON.parse(this.getAttribute("value") ?? "[null,null]")); } catch { return [null, null]; } }
  set defaultValue(value: DateRangeValue) { this.setAttribute("value", JSON.stringify(dateRange(value))); }
  get name(): string { return this.getAttribute("name") ?? ""; }
  set name(value: string) { this.setAttribute("name", value); }
  get startName(): string { return this.getAttribute("start-name") || `${this.name}.start`; }
  set startName(value: string) { this.setAttribute("start-name", value); }
  get endName(): string { return this.getAttribute("end-name") || `${this.name}.end`; }
  set endName(value: string) { this.setAttribute("end-name", value); }
  get min(): string { return this.getAttribute("min") ?? ""; }
  set min(value: string) { this.setAttribute("min", value); }
  get max(): string { return this.getAttribute("max") ?? ""; }
  set max(value: string) { this.setAttribute("max", value); }
  get locale(): string { return this.getAttribute("locale") || "en-US"; }
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
  override focus(options?: FocusOptions): void { this.#inputs[0].focus(options); }
  showPicker(): void { if (!this.#disabled && !this.readOnly && !this.#config.message) this.#api?.setOpen(true); }
  hidePicker(): void { this.#api?.setOpen(false); }
  clear(): void { this.#canonical = [null, null]; this.#write(); this.#dirty = true; this.#pendingEdit = [false, false]; this.hidePicker(); this.#sync(true); }
  formDisabledCallback(disabled: boolean): void { this.#formDisabled = disabled; if (disabled) this.#pendingEdit = [false, false]; this.#sync(); }
  formResetCallback(): void { this.#dirty = false; this.#composing = [false, false]; this.#pendingEdit = [false, false]; this.#restoreDefault(); this.removeAttribute("data-touched"); this.hidePicker(); this.#sync(true); }
  formStateRestoreCallback(state: string | File | FormData): void {
    if (typeof state !== "string") return;
    try {
      const parsed: unknown = JSON.parse(state);
      if (!Array.isArray(parsed) || parsed.length !== 3 || !Array.isArray(parsed[1]) || parsed[1].length !== 2 || !parsed[1].every(item => typeof item === "string") || typeof parsed[2] !== "string") return;
      this.#canonical = dateRange(parsed[0]);
      this.#inputs.forEach((input, index) => { const date = this.#canonical[index]; input.value = date && parsed[2] !== this.locale ? this.#format.format(parseCalendarDate(date)!) : parsed[1][index]; });
      this.#dirty = true; this.#pendingEdit = [false, false]; this.hidePicker(); this.#sync(true);
    } catch { /* Ignore incompatible restoration state. */ }
  }
  get #disabled(): boolean { return this.disabled || this.#formDisabled; }
  get #api(): datePicker.Api | undefined { return this.#machine && datePicker.connect(this.#machine.service, normalizeProps); }
  get #config(): { min: CalendarDate; max: CalendarDate; message: string } {
    const min = this.min ? parseCalendarDate(this.min) : firstDate, max = this.max ? parseCalendarDate(this.max) : lastDate;
    const message = !this.#localeValid ? "Use a supported locale tag." : !min || !max ? "Use YYYY-MM-DD for minimum and maximum dates." : min.compare(max) > 0 ? "The minimum date must not exceed the maximum." : "";
    return { min: min ?? firstDate, max: max ?? lastDate, message };
  }
  get #focusDate(): CalendarDate {
    const today = new Date(), config = this.#config;
    let date = parseCalendarDate(this.#canonical[0] ?? this.#canonical[1] ?? "") ?? new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    if (!config.message) { if (date.compare(config.min) < 0) date = config.min; if (date.compare(config.max) > 0) date = config.max; }
    return date;
  }
  get #props(): Partial<datePicker.Props> {
    const config = this.#config, [start, end] = this.#canonical.map(value => parseCalendarDate(value ?? ""));
    const selectable = !config.message && start && (!end || start.compare(end) <= 0) && [start, end].every(date => !date || date.compare(config.min) >= 0 && date.compare(config.max) <= 0);
    return { value: selectable ? end ? [start, end] : [start] : [], min: config.message ? firstDate : config.min, max: config.message ? lastDate : config.max, locale: this.#format.locale, disabled: this.#disabled || Boolean(config.message), readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid, dir: direction(this) };
  }
  #write(): void { this.#canonical.forEach((date, index) => { this.#inputs[index]!.value = date ? this.#format.format(parseCalendarDate(date)!) : ""; }); }
  #restoreDefault(): void {
    try { this.#canonical = dateRange(JSON.parse(this.getAttribute("value") ?? "[null,null]")); this.#write(); }
    catch { this.#canonical = [null, null]; this.#inputs[0].value = this.getAttribute("value") ?? ""; this.#inputs[1].value = ""; }
  }
  #emitCommit(): void { this.dispatchEvent(new Event("input", { bubbles: true, composed: true })); this.dispatchEvent(new Event("change", { bubbles: true, composed: true })); }
  #sync(resetFocus = false): void {
    const config = this.#config, data = new FormData();
    this.#canonical.forEach((date, index) => { if (this.name && date && !config.message) data.append(index === 0 ? this.startName : this.endName, date); });
    this.#internals.setFormValue(data, JSON.stringify([this.value, this.displayValue, this.locale]));
    let flags: ValidityStateFlags = {}, message = this.#customError || config.message, anchor = this.#inputs[0];
    if (message) flags = { customError: true };
    for (const [index, input] of this.#inputs.entries()) {
      const date = parseCalendarDate(this.#canonical[index] ?? "");
      if (!message) {
        if (input.value.trim() && !date) { flags = { badInput: true }; message = `Enter a complete ${sides[index]} date (${this.#format.placeholder}) or YYYY-MM-DD.`; anchor = input; }
        else if (date && date.compare(config.min) < 0) { flags = { rangeUnderflow: true }; message = `Choose ${config.min.toString()} or a later ${sides[index]} date.`; anchor = input; }
        else if (date && date.compare(config.max) > 0) { flags = { rangeOverflow: true }; message = `Choose ${config.max.toString()} or an earlier ${sides[index]} date.`; anchor = input; }
      }
      input.disabled = this.#disabled; input.readOnly = this.readOnly; input.placeholder = this.placeholder;
    }
    const [start, end] = this.#canonical;
    if (!message && start && end && start > end) { flags = { customError: true }; message = "The start date must not exceed the end date."; anchor = this.#inputs[1]; }
    if (!message && (!start || !end) && (this.required || Boolean(start || end))) { flags = { valueMissing: true }; message = `Choose ${!start ? "a start" : "an end"} date to complete the range.`; anchor = this.#inputs[start ? 1 : 0]; }
    this.#internals.setValidity(flags, message, anchor);
    this.#clear.hidden = !this.displayValue.some(Boolean); this.#clear.disabled = this.#disabled || this.readOnly;
    if (this.#disabled || this.readOnly || config.message) this.hidePicker();
    this.#machine?.updateProps(this.#props);
    if (resetFocus && this.#machine) {
      // Controlled editor/reset changes must also update Zag's unfinished range progress.
      this.#machine.service.send({ type: "INPUT.FOCUS", index: this.#props.value?.length === 1 ? 1 : 0 });
      this.#api?.setFocusedValue(this.#focusDate);
    }
    if (start && end) this.#internals.states.add("selected"); else this.#internals.states.delete("selected");
    this.#render();
  }
  #hidePopup(): void { if (this.#positioner.matches(":popover-open")) this.#positioner.hidePopover(); this.#positioner.hidden = true; }
  #render(): void {
    const api = this.#api; if (!api) return;
    this.#bindings.apply(this.#root, api.getRootProps()); this.#bindings.apply(this.#control, api.getControlProps()); this.#bindings.apply(this.#trigger, api.getTriggerProps());
    this.#bindings.apply(this.#positioner, api.getPositionerProps()); this.#bindings.apply(this.#content, api.getContentProps());
    this.#bindings.apply(this.#navigation, api.getViewControlProps({ view: api.view }));
    this.#bindings.apply(this.#previous, api.getPrevTriggerProps({ view: api.view })); this.#bindings.apply(this.#next, api.getNextTriggerProps({ view: api.view }));
    this.#bindings.apply(this.#viewButton, api.getViewTriggerProps({ view: api.view })); this.#viewButton.textContent = api.visibleRangeText.start === api.visibleRangeText.end ? api.visibleRangeText.start : api.visibleRangeText.formatted;
    const label = fieldLabel(this, this.labels, "Date range");
    this.#control.setAttribute("role", "group"); this.#control.setAttribute("aria-label", label);
    this.#inputs.forEach((input, index) => {
      const sideLabel = this.getAttribute(`${sides[index]}-label`) || `${index === 0 ? "Start" : "End"} date`; this.#labels[index]!.textContent = sideLabel;
      input.setAttribute("aria-label", `${label}: ${sideLabel}`);
      input.setAttribute("aria-description", [referencedText(this, "aria-describedby"), `Format: ${this.#format.placeholder}; ISO YYYY-MM-DD also accepted. Both dates complete a range.`].filter(Boolean).join(" "));
      input.setAttribute("aria-invalid", String(!this.validity.valid)); input.setAttribute("aria-required", String(this.required || this.#canonical.some(Boolean))); input.setAttribute("aria-keyshortcuts", "Alt+ArrowDown F4");
    });
    this.#trigger.setAttribute("aria-label", `Open calendar for ${label}`); this.#trigger.setAttribute("aria-haspopup", "dialog"); this.#clear.setAttribute("aria-label", `Clear ${label}`);
    this.#content.setAttribute("role", "dialog"); this.#content.setAttribute("aria-modal", "false"); this.#content.setAttribute("aria-label", `${label} calendar`);
    this.#bindings.retain([this.#root, this.#control, this.#trigger, this.#positioner, this.#content, this.#navigation, this.#previous, this.#next, this.#viewButton, ...this.#views.render(api, this.#bindings, this.#format.locale)]);
    if (api.open && !this.#disabled && !this.readOnly && !this.#config.message && this.isConnected) {
      this.#positioner.hidden = false; if (!this.#positioner.matches(":popover-open")) this.#positioner.showPopover(); this.#internals.states.add("open");
    } else { this.#hidePopup(); this.#internals.states.delete("open"); }
  }
}
