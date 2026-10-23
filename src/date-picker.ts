import * as datePicker from "@zag-js/date-picker";
import { CalendarDate } from "@internationalized/date";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { dateTextFormat, parseCalendarDate } from "./date-value.js";
import type { DateTextFormat } from "./date-value.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { fieldLabel, referencedText } from "./field-label.js";
import { createIcon } from "./icons.js";
import { hostStyles } from "./styles.js";
import { theme, radius } from "./theme.js";

type CalendarView = datePicker.DateView;
interface ViewNodes { root: HTMLElement; table: HTMLTableElement; head: HTMLTableSectionElement; body: HTMLTableSectionElement; key: string; }
const firstDate = parseCalendarDate("0001-01-01")!;
const lastDate = parseCalendarDate("9999-12-31")!;
const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [hidden] { display: none !important; }
  button, input { font: inherit; color: inherit; }
  button { border: 1px solid transparent; background: transparent; cursor: pointer; }
  [part=control] { display: flex; align-items: center; min-height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: 0 1px 2px #00000005; }
  [part=input] { flex: 1; min-width: 0; width: 100%; height: calc(var(--hp-control-height, 2.5rem) - 2px); padding: .5rem .75rem; border: 0; border-radius: inherit; outline: none; background: transparent; font-variant-numeric: tabular-nums; }
  input::placeholder { color: ${theme("muted-foreground")}; opacity: 1; }
  [part=trigger], [part=clear-button], [part=prev-button], [part=next-button] { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 2rem; height: 2rem; padding: .375rem; border-radius: ${radius("sm")}; }
  [part=trigger], [part=clear-button] { margin-inline-end: .1875rem; color: ${theme("muted-foreground")}; }
  svg { display: block; width: 1rem; height: 1rem; flex: 0 0 auto; }
  button:hover:not(:disabled):not([data-disabled]) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; }
  button:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  [part=control]:focus-within { border-color: ${theme("ring")}; }
  [part=control]:has(input:focus-visible, [part=trigger]:focus-visible) { outline: 2px solid ${theme("ring")}; outline-offset: 2px; }
  [part=trigger]:focus-visible { outline: none; }
  [part=control][data-disabled] { opacity: .5; }
  button:disabled { cursor: not-allowed; }
  :host([data-touched]:invalid) [part=control] { border-color: ${theme("destructive")}; }
  [part=positioner] { inset: auto; margin: 0; padding: 0; border: 0; max-width: calc(100vw - 1rem); overflow: visible; background: transparent; color: inherit; }
  [part=content] { width: min(20rem, calc(100vw - 1rem)); padding: .75rem; max-height: var(--available-height, calc(100vh - 1rem)); overflow: auto; overscroll-behavior: contain; border: 1px solid ${theme("border")}; border-radius: ${radius("lg")}; background: ${theme("popover")}; color: ${theme("popover-foreground")}; box-shadow: 0 4px 6px -1px #00000018, 0 2px 4px -2px #00000018; outline: none; }
  [part=navigation] { display: grid; grid-template-columns: 2rem minmax(0, 1fr) 2rem; align-items: center; gap: .25rem; margin-bottom: .5rem; }
  [part=view-button] { min-width: 0; min-height: 2rem; padding: .25rem; border-radius: ${radius("sm")}; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  [part=grid] { width: 100%; border-collapse: separate; border-spacing: .125rem; table-layout: fixed; }
  [part=weekday] { height: 2rem; padding: 0; color: ${theme("muted-foreground")}; font-weight: 400; font-size: .8125rem; text-align: center; }
  td { padding: 0; text-align: center; }
  [part~=day], [part~=month], [part~=year] { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 2.25rem; padding: .25rem; border-radius: ${radius("sm")}; font-variant-numeric: tabular-nums; }
  [data-outside-range] { color: ${theme("muted-foreground")}; }
  [part=content] [data-disabled] { opacity: .4; cursor: default; }
  [part~=today]:not([data-selected]) { border-color: ${theme("input")}; background: ${theme("muted")}; }
  [part~=selected-day], [part~=month][data-selected], [part~=year][data-selected] { background: ${theme("primary")}; color: ${theme("primary-foreground")}; }
  [part~=selected-day]:hover:not([data-disabled]) { background: ${theme("primary")}; color: ${theme("primary-foreground")}; }
  @media (forced-colors: active) { [data-selected] { outline: 1px solid Highlight; outline-offset: -1px; } }
</style><div part="root"><div part="control"><input part="input" type="text" autocomplete="off" spellcheck="false"></div></div>
<div part="positioner" popover="manual" hidden><div part="content"><div part="navigation"></div></div></div>`;

/** Native editor and form owner around Zag's calendar navigation and popup behavior. */
export class H6DatePicker extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "name", "min", "max", "locale", "disabled", "readonly", "required", "placeholder", "dir", "aria-label", "aria-labelledby", "aria-describedby"];
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
  #views = new Map<CalendarView, ViewNodes>();
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

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true }); shadow.append(template.content.cloneNode(true));
    this.#root = shadow.querySelector("[part=root]")!; this.#control = shadow.querySelector("[part=control]")!;
    this.#input = shadow.querySelector("input")!; this.#input.id = `${this.#id}-editor`;
    this.#positioner = shadow.querySelector("[part=positioner]")!; this.#content = shadow.querySelector("[part=content]")!;
    this.#navigation = shadow.querySelector("[part=navigation]")!;
    const button = (part: string, icon?: Parameters<typeof createIcon>[0]): HTMLButtonElement => {
      const node = document.createElement("button"); node.type = "button"; node.part.add(part); if (icon) node.append(createIcon(icon)); return node;
    };
    this.#trigger = button("trigger", "calendar"); this.#clear = button("clear-button", "close"); this.#control.append(this.#trigger, this.#clear);
    this.#previous = button("prev-button", "chevron-left"); this.#viewButton = button("view-button"); this.#next = button("next-button", "chevron-right"); this.#navigation.append(this.#previous, this.#viewButton, this.#next);
    for (const view of ["day", "month", "year"] as const) {
      const root = document.createElement("div"); root.part.add("view", `${view}-view`);
      const table = document.createElement("table"); table.part.add("grid");
      const head = document.createElement("thead"), body = document.createElement("tbody"); table.append(head, body); root.append(table); this.#content.append(root);
      this.#views.set(view, { root, table, head, body, key: "" });
    }
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
  disconnectedCallback(): void { this.#hidePopup(); this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); this.#pendingEdit = false; }
  attributeChangedCallback(name: string): void {
    if (name === "locale") {
      const format = dateTextFormat(this.locale); this.#localeValid = Boolean(format); this.#format = format ?? dateTextFormat("en-US")!;
      if (this.#canonical) this.#input.value = this.#format.format(parseCalendarDate(this.#canonical)!);
    }
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
    return { value: selectable ? [date] : [], min: config.message ? firstDate : config.min, max: config.message ? lastDate : config.max, locale: this.#format.locale, disabled: this.#disabled || Boolean(config.message), readOnly: this.readOnly, required: this.required, invalid: !this.validity.valid, dir: direction(this) };
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
    this.#bindings.apply(this.#viewButton, api.getViewTriggerProps({ view: api.view })); this.#viewButton.textContent = api.visibleRangeText.formatted;
    const label = fieldLabel(this, this.labels, "Date");
    this.#input.setAttribute("aria-label", label); this.#input.setAttribute("aria-description", [referencedText(this, "aria-describedby"), `Format: ${this.#format.placeholder}; ISO YYYY-MM-DD also accepted.`].filter(Boolean).join(" "));
    this.#input.setAttribute("aria-invalid", String(!this.validity.valid)); this.#input.setAttribute("aria-required", String(this.required));
    this.#input.setAttribute("aria-keyshortcuts", "Alt+ArrowDown F4");
    this.#trigger.setAttribute("aria-label", `Open calendar for ${label}`); this.#trigger.setAttribute("aria-haspopup", "dialog"); this.#clear.setAttribute("aria-label", `Clear ${label}`);
    this.#content.setAttribute("role", "dialog"); this.#content.setAttribute("aria-modal", "false"); this.#content.setAttribute("aria-label", `${label} calendar`);
    const retained: Element[] = [this.#root, this.#control, this.#trigger, this.#positioner, this.#content, this.#navigation, this.#previous, this.#next, this.#viewButton];
    for (const [view, nodes] of this.#views) {
      this.#bindings.apply(nodes.root, api.getViewProps({ view })); this.#bindings.apply(nodes.table, api.getTableProps({ view, columns: view === "day" ? 7 : 4 }));
      this.#bindings.apply(nodes.head, api.getTableHeaderProps({ view })); this.#bindings.apply(nodes.body, api.getTableBodyProps({ view }));
      retained.push(nodes.root, nodes.table, nodes.head, nodes.body);
      const weeks = api.weeks, values = view === "month" ? api.getMonthsGrid({ columns: 4, format: "short" }) : view === "year" ? api.getYearsGrid({ columns: 4 }) : undefined;
      const key = view === "day" ? weeks.map(week => week.map(date => date.toString()).join(",")).join(";") + this.#format.locale : values!.map(row => row.map(item => `${item.value}:${item.label}`).join(",")).join(";");
      if (key !== nodes.key) {
        nodes.key = key; nodes.head.replaceChildren(); nodes.body.replaceChildren();
        if (view === "day") {
          const row = document.createElement("tr");
          for (const day of api.weekDays) { const cell = document.createElement("th"); cell.part.add("weekday"); cell.scope = "col"; cell.textContent = day.short; cell.setAttribute("aria-label", day.long); row.append(cell); }
          nodes.head.append(row);
        }
        const rows = view === "day" ? weeks.map(week => week.map(date => ({ label: String(date.day), value: date.toString() }))) : values!;
        for (const rowValues of rows) {
          const row = document.createElement("tr");
          for (const item of rowValues) { const cell = document.createElement("td"), button = document.createElement("button"); button.type = "button"; button.part.add(view); button.dataset.calendarValue = String(item.value); button.textContent = item.label; cell.append(button); row.append(cell); }
          nodes.body.append(row);
        }
      }
      for (const row of nodes.body.rows) {
        this.#bindings.apply(row, api.getTableRowProps({ view })); retained.push(row);
        for (const cell of row.cells) {
          const button = cell.firstElementChild as HTMLButtonElement;
          if (view === "day") {
            const date = parseCalendarDate(button.dataset.calendarValue!);
            if (!date) { button.disabled = true; button.tabIndex = -1; continue; }
            this.#bindings.apply(cell, api.getDayTableCellProps({ value: date })); this.#bindings.apply(button, api.getDayTableCellTriggerProps({ value: date }));
            const state = api.getDayTableCellState({ value: date }); button.part.toggle("selected-day", state.selected); button.part.toggle("today", state.today);
          } else {
            const value = Number(button.dataset.calendarValue);
            this.#bindings.apply(cell, view === "month" ? api.getMonthTableCellProps({ value }) : api.getYearTableCellProps({ value }));
            this.#bindings.apply(button, view === "month" ? api.getMonthTableCellTriggerProps({ value }) : api.getYearTableCellTriggerProps({ value }));
          }
          retained.push(cell, button);
        }
      }
    }
    this.#bindings.retain(retained);
    if (api.open && !this.#disabled && !this.readOnly && !this.#config.message && this.isConnected) {
      this.#positioner.hidden = false; if (!this.#positioner.matches(":popover-open")) this.#positioner.showPopover(); this.#internals.states.add("open");
    } else { this.#hidePopup(); this.#internals.states.delete("open"); }
  }
}
