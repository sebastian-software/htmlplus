import type * as datePicker from "@zag-js/date-picker";
import { parseCalendarDate } from "./date-value.js";
import { DomBindings } from "./zag-dom.js";
import { hostStyles } from "./styles.js";
import { theme, radius } from "./theme.js";

type CalendarView = datePicker.DateView;
interface ViewNodes { root: HTMLElement; table: HTMLTableElement; head: HTMLTableSectionElement; body: HTMLTableSectionElement; key: string; }
export const calendarTemplate = document.createElement("template");
calendarTemplate.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [hidden] { display: none !important; }
  button, input { font: inherit; color: inherit; }
  button { border: 1px solid transparent; background: transparent; cursor: pointer; }
  [part=control] { display: flex; align-items: center; min-height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: 0 1px 2px #00000005; }
  [part~=input] { flex: 1; min-width: 0; width: 100%; height: calc(var(--hp-control-height, 2.5rem) - 2px); padding: .5rem .75rem; border: 0; border-radius: inherit; outline: none; background: transparent; font-variant-numeric: tabular-nums; }
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

/** Shared calendar views; editors and form state remain owned by each field. */
export class CalendarViews {
  #nodes = new Map<CalendarView, ViewNodes>();
  constructor(content: HTMLElement) {
    for (const view of ["day", "month", "year"] as const) {
      const root = document.createElement("div"); root.part.add("view", `${view}-view`);
      const table = document.createElement("table"); table.part.add("grid");
      const head = document.createElement("thead"), body = document.createElement("tbody"); table.append(head, body); root.append(table); content.append(root);
      this.#nodes.set(view, { root, table, head, body, key: "" });
    }
  }
  render(api: datePicker.Api, bindings: DomBindings, locale: string): Element[] {
    const retained: Element[] = [];
    for (const [view, nodes] of this.#nodes) {
      bindings.apply(nodes.root, api.getViewProps({ view })); bindings.apply(nodes.table, api.getTableProps({ view, columns: view === "day" ? 7 : 4 }));
      bindings.apply(nodes.head, api.getTableHeaderProps({ view })); bindings.apply(nodes.body, api.getTableBodyProps({ view }));
      retained.push(nodes.root, nodes.table, nodes.head, nodes.body);
      const weeks = api.weeks, values = view === "month" ? api.getMonthsGrid({ columns: 4, format: "short" }) : view === "year" ? api.getYearsGrid({ columns: 4 }) : undefined;
      const key = view === "day" ? weeks.map(week => week.map(date => date.toString()).join(",")).join(";") + locale : values!.map(row => row.map(item => `${item.value}:${item.label}`).join(",")).join(";");
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
        bindings.apply(row, api.getTableRowProps({ view })); retained.push(row);
        for (const cell of row.cells) {
          const button = cell.firstElementChild as HTMLButtonElement;
          if (view === "day") {
            const date = parseCalendarDate(button.dataset.calendarValue!);
            if (!date) { button.disabled = true; button.tabIndex = -1; continue; }
            const state = api.getDayTableCellState({ value: date }), props = api.getDayTableCellTriggerProps({ value: date });
            if (api.selectionMode === "range") {
              const click = props.onclick;
              // A pointer restart must move the keyboard origin before selecting the new start.
              props.onclick = (event: MouseEvent) => { if (event.defaultPrevented || !state.selectable) return; api.setFocusedValue(date); click?.(event); };
            }
            bindings.apply(cell, api.getDayTableCellProps({ value: date })); bindings.apply(button, props);
            button.part.toggle("selected-day", state.selected); button.part.toggle("today", state.today);
            if (api.selectionMode === "range") {
              const [start, end] = api.value;
              const committed = start && end && date.compare(start) >= 0 && date.compare(end) <= 0;
              cell.setAttribute("aria-selected", String(state.selected || Boolean(committed)));
            }
            button.part.toggle("range-start", Boolean(state.firstInRange)); button.part.toggle("range-end", Boolean(state.lastInRange));
            button.part.toggle("in-range", Boolean(state.inRange)); button.part.toggle("preview-day", Boolean(state.inHoveredRange));
          } else {
            const value = Number(button.dataset.calendarValue);
            bindings.apply(cell, view === "month" ? api.getMonthTableCellProps({ value }) : api.getYearTableCellProps({ value }));
            bindings.apply(button, view === "month" ? api.getMonthTableCellTriggerProps({ value }) : api.getYearTableCellTriggerProps({ value }));
          }
          retained.push(cell, button);
        }
      }
    }
    return retained;
  }
}
