import * as accordion from "@zag-js/accordion";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles } from "./styles.js";
import { createIcon } from "./icons.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { readSections, sectionsChanged, containsFocus, reconcileChildren } from "./sections.js";
import type { Section } from "./sections.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [part=item] { border-bottom: 1px solid var(--h6-border, #d4d4d4); }
  [part=heading] { margin: 0; font: inherit; }
  [part=trigger] { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; min-height: 3rem; padding: .875rem 0; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 500; text-align: start; cursor: pointer; }
  [part=trigger]:hover [part=label] { text-decoration: underline; text-underline-offset: .25rem; }
  [part=trigger]:focus-visible { outline: 2px solid var(--h6-focus, #737373); outline-offset: 3px; border-radius: .125rem; }
  [part=trigger]:disabled { opacity: .5; cursor: not-allowed; }
  [part=label] { min-width: 0; overflow-wrap: anywhere; }
  [part=indicator] { width: 1rem; height: 1rem; flex: none; transition: transform .15s; }
  [part=indicator][data-state=open] { transform: rotate(180deg); }
  [part=content] { padding-bottom: 1rem; }
  [hidden] { display: none !important; }
  ::slotted(section) { margin: 0; min-width: 0; }
  @media (prefers-reduced-motion: reduce) { [part=indicator] { transition: none; } }
</style><div part="root"></div><slot></slot>`;

interface Entry { section: Section; item: HTMLDivElement; heading: HTMLHeadingElement; trigger: HTMLButtonElement; label: HTMLSpanElement; indicator: SVGSVGElement; content: HTMLDivElement; slot: HTMLSlotElement }

export class H6Accordion extends HTMLElement {
  static observedAttributes = ["value", "multiple", "disabled", "dir", "heading-level"];
  #root = this.attachShadow({ mode: "open" });
  #container: HTMLDivElement;
  #id = interactionId("accordion");
  #value: string[] = [];
  #initialized = false;
  #revealingInvalid = false;
  #entries: Entry[] = [];
  #machine?: InteractionMachine<accordion.Service, accordion.Props>;
  #bindings = new DomBindings();
  #observer = new MutationObserver((records) => { if (sectionsChanged(records, this)) this.#refresh(); });

  constructor() {
    super();
    this.#root.append(template.content.cloneNode(true));
    this.#container = this.#root.querySelector("[part=root]")!;
    this.addEventListener("invalid", (event) => {
      const entry = this.#entries.find(({ section }) => event.target instanceof Node && section.element.contains(event.target));
      if (!entry) return;
      if (this.#revealingInvalid) {
        if (!this.#value.includes(entry.section.value)) event.preventDefault();
        return;
      }
      this.#revealingInvalid = true;
      // Native validation may run microtask checkpoints between invalid events.
      setTimeout(() => { this.#revealingInvalid = false; }, 0);
      if (!this.#value.includes(entry.section.value)) this.value = this.multiple ? [...this.#value, entry.section.value] : [entry.section.value];
    }, true);
  }
  connectedCallback(): void {
    this.#refresh();
    this.#machine = new VanillaMachine(accordion.machine, {
      id: this.#id, getRootNode: () => this.#root,
      ids: { item: (value) => `${this.#id}-item-${encodeURIComponent(value)}`, itemTrigger: (value) => `${this.#id}-trigger-${encodeURIComponent(value)}`, itemContent: (value) => `${this.#id}-content-${encodeURIComponent(value)}` },
      ...this.#props(),
      onValueChange: ({ value }) => this.#setValue(value, true),
    });
    this.#machine.subscribe(() => this.#render());
    this.#render(); this.#machine.start();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-value", "data-label", "data-disabled"] });
  }
  disconnectedCallback(): void { this.#observer.disconnect(); this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(name: string): void {
    if (name === "value") { this.#value = this.#declaredValue(); this.#initialized = true; }
    if (this.isConnected) this.#refresh();
  }
  get value(): string[] { return [...this.#value]; }
  set value(value: string[]) {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) throw new TypeError("h6-accordion.value must be an array of strings.");
    this.#setValue(value, false);
  }
  get multiple(): boolean { return this.hasAttribute("multiple"); }
  set multiple(value: boolean) { this.toggleAttribute("multiple", Boolean(value)); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }

  #declaredValue(): string[] {
    try { const value: unknown = JSON.parse(this.getAttribute("value") ?? "[]"); return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : []; }
    catch { return []; }
  }
  #normalize(value: string[]): string[] {
    const known = new Set(this.#entries.map(({ section }) => section.value));
    const next = [...new Set(value)].filter((item) => known.has(item));
    return this.multiple ? next : next.slice(0, 1);
  }
  #props(): Partial<accordion.Props> { return { value: this.#value, multiple: this.multiple, collapsible: true, disabled: this.disabled, dir: direction(this) }; }
  #setValue(value: string[], user: boolean): void {
    const next = this.isConnected ? this.#normalize(value) : [...value];
    const changed = JSON.stringify(next) !== JSON.stringify(this.#value);
    const returnFocus = this.#entries.find(({ section }) => !next.includes(section.value) && containsFocus(section));
    this.#value = next; this.#initialized = true;
    this.#machine?.updateProps(this.#props()); this.#render();
    if (returnFocus && !returnFocus.trigger.disabled) returnFocus.trigger.focus();
    if (user && changed) this.dispatchEvent(new CustomEvent("valuechange", { detail: { value: this.value }, bubbles: true, composed: true }));
  }
  #refresh(): void {
    const previous = new Map(this.#entries.map((entry) => [entry.section.element, entry]));
    const sections = readSections(this, this.#id);
    this.#entries = sections.map((section) => {
      let entry = previous.get(section.element);
      if (!entry) {
        const item = document.createElement("div"); item.setAttribute("part", "item");
        const heading = document.createElement("h3"); heading.setAttribute("part", "heading");
        const trigger = document.createElement("button"); trigger.type = "button"; trigger.setAttribute("part", "trigger");
        const label = document.createElement("span"); label.setAttribute("part", "label");
        const indicator = createIcon("chevron-down"); indicator.setAttribute("part", "indicator");
        const content = document.createElement("div"); content.setAttribute("part", "content");
        const slot = document.createElement("slot"); content.append(slot); trigger.append(label, indicator); heading.append(trigger); item.append(heading, content);
        entry = { section, item, heading, trigger, label, indicator, content, slot };
      }
      entry.section = section; entry.label.textContent = section.label; entry.slot.name = section.slot;
      const level = Number(this.getAttribute("heading-level") ?? 3);
      entry.heading.setAttribute("aria-level", String(Number.isInteger(level) && level >= 1 && level <= 6 ? level : 3));
      return entry;
    });
    this.#bindings.retain([this.#container, ...this.#entries.flatMap(({ item, trigger, indicator, content }) => [item, trigger, indicator, content])]);
    reconcileChildren(this.#container, this.#entries.map(({ item }) => item));
    if (!this.#initialized) this.#value = this.#declaredValue();
    this.#value = this.#normalize(this.#value); this.#initialized = true;
    this.#machine?.updateProps(this.#props()); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = accordion.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#container, api.getRootProps());
    for (const entry of this.#entries) {
      const props = { value: entry.section.value, disabled: this.disabled || entry.section.disabled };
      this.#bindings.apply(entry.item, api.getItemProps(props));
      this.#bindings.apply(entry.trigger, api.getItemTriggerProps(props));
      this.#bindings.apply(entry.indicator, api.getItemIndicatorProps(props));
      this.#bindings.apply(entry.content, api.getItemContentProps(props));
    }
  }
}
