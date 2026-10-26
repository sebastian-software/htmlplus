import { theme, radius } from "./theme.js";
import * as tabs from "@zag-js/tabs";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { hostStyles } from "./styles.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { readSections, sectionsChanged, containsFocus, reconcileChildren, inactiveSectionStyles } from "./sections.js";
import type { Section } from "./sections.js";

const template = document.createElement("template");
template.innerHTML = `<style>
  ${hostStyles}
  :host { min-width: 0; }
  [part=root] { display: grid; gap: 1rem; min-width: 0; }
  [part=list] { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem; width: fit-content; max-width: 100%; min-height: var(--hp-control-height, 2.5rem); padding: .25rem; border-radius: ${radius("lg")}; background: ${theme("muted")}; }
  [part~=tab] { display: inline-flex; align-items: center; justify-content: center; min-height: 2rem; min-width: 0; padding: .25rem .75rem; border: 1px solid transparent; border-radius: ${radius("sm")}; background: transparent; color: ${theme("muted-foreground")}; font: inherit; font-weight: 500; overflow-wrap: anywhere; cursor: pointer; }
  [part~=tab][data-selected] { background: ${theme("background")}; color: ${theme("foreground")}; box-shadow: 0 1px 3px #00000012; }
  [part~=tab]:focus-visible, [part=panel]:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 3px; }
  [part~=tab]:disabled { opacity: .5; cursor: not-allowed; }
  [part=panels], [part=panel] { min-width: 0; }
  [part=root][data-orientation=vertical] { grid-template-columns: minmax(0, 1fr) minmax(0, 3fr); align-items: start; }
  [data-orientation=vertical][part=list] { flex-direction: column; align-items: stretch; width: 100%; }
  ${inactiveSectionStyles}
  ::slotted(section) { margin: 0; min-width: 0; }
  @media (forced-colors: active) { [part~=tab][data-selected] { border-color: Highlight; } }
</style><div part="root"><div part="list"></div><div part="panels"></div></div><slot></slot>`;

interface Entry { section: Section; trigger: HTMLButtonElement; panel: HTMLDivElement; slot: HTMLSlotElement }

export class H6Tabs extends HTMLElement {
  static observedAttributes = ["value", "disabled", "orientation", "activation-mode", "dir", "aria-label"];
  #root = this.attachShadow({ mode: "open" });
  #container: HTMLDivElement;
  #list: HTMLDivElement;
  #panels: HTMLDivElement;
  #id = interactionId("tabs");
  #value = "";
  #initialized = false;
  #revealingInvalid = false;
  #entries: Entry[] = [];
  #machine?: InteractionMachine<tabs.Service, tabs.Props>;
  #bindings = new DomBindings();
  #observer = new MutationObserver((records) => { if (sectionsChanged(records, this)) this.#refresh(); });

  constructor() {
    super();
    this.#root.append(template.content.cloneNode(true));
    this.#container = this.#root.querySelector("[part=root]")!;
    this.#list = this.#root.querySelector("[part=list]")!;
    this.#panels = this.#root.querySelector("[part=panels]")!;
    this.addEventListener("invalid", (event) => {
      const entry = this.#entries.find(({ section }) => event.target instanceof Node && section.element.contains(event.target));
      if (!entry) return;
      if (this.#revealingInvalid) {
        if (entry.section.value !== this.#value) event.preventDefault();
        return;
      }
      this.#revealingInvalid = true;
      // Preserve the first invalid panel through the browser's whole validation task.
      setTimeout(() => { this.#revealingInvalid = false; }, 0);
      this.value = entry.section.value;
      // Flush the newly revealed inert subtree before native validation moves focus.
      entry.panel.getBoundingClientRect();
    }, true);
  }
  connectedCallback(): void {
    this.#refresh();
    this.#machine = new VanillaMachine(tabs.machine, {
      id: this.#id, getRootNode: () => this.#root,
      ids: { trigger: (value) => `${this.#id}-tab-${encodeURIComponent(value)}`, content: (value) => `${this.#id}-panel-${encodeURIComponent(value)}` },
      ...this.#props(),
      onValueChange: ({ value }) => this.#setValue(value, true),
    });
    this.#machine.subscribe(() => this.#render());
    this.#render(); this.#machine.start();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-value", "data-label", "data-disabled"] });
  }
  disconnectedCallback(): void { this.#observer.disconnect(); this.#machine?.stop(); this.#machine = undefined; this.#bindings.clear(); }
  attributeChangedCallback(name: string): void {
    if (name === "value") { this.#value = this.getAttribute("value") ?? ""; this.#initialized = true; }
    if (this.isConnected) this.#refresh();
  }
  get value(): string { return this.#value; }
  set value(value: string) { this.#setValue(String(value), false); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", Boolean(value)); }
  get orientation(): "horizontal" | "vertical" { return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal"; }
  set orientation(value: "horizontal" | "vertical") { this.setAttribute("orientation", value); }
  get activationMode(): "automatic" | "manual" { return this.getAttribute("activation-mode") === "manual" ? "manual" : "automatic"; }
  set activationMode(value: "automatic" | "manual") { this.setAttribute("activation-mode", value); }

  #normalize(value: string): string {
    return this.#entries.find(({ section }) => section.value === value)?.section.value
      ?? this.#entries.find(({ section }) => !section.disabled)?.section.value ?? this.#entries[0]?.section.value ?? "";
  }
  #props(): Partial<tabs.Props> { return { value: this.#value || null, orientation: this.orientation, activationMode: this.activationMode, dir: direction(this), translations: { listLabel: this.getAttribute("aria-label") || "Sections" } }; }
  #setValue(value: string, user: boolean): void {
    const next = this.isConnected ? this.#normalize(value) : value;
    const changed = next !== this.#value;
    const returnFocus = this.#entries.some(({ section }) => section.value !== next && containsFocus(section));
    this.#value = next; this.#initialized = true;
    this.#machine?.updateProps(this.#props()); this.#render();
    if (returnFocus) this.#entries.find(({ section }) => section.value === next)?.trigger.focus();
    if (user && changed) this.dispatchEvent(new CustomEvent("valuechange", { detail: { value: this.value }, bubbles: true, composed: true }));
  }
  #refresh(): void {
    const previous = new Map(this.#entries.map((entry) => [entry.section.element, entry]));
    this.#entries = readSections(this, this.#id).map((section) => {
      let entry = previous.get(section.element);
      if (!entry) {
        const trigger = document.createElement("button"); trigger.type = "button";
        const panel = document.createElement("div"); panel.setAttribute("part", "panel");
        const slot = document.createElement("slot"); panel.append(slot);
        entry = { section, trigger, panel, slot };
      }
      entry.section = section; entry.trigger.textContent = section.label; entry.slot.name = section.slot;
      return entry;
    });
    this.#bindings.retain([this.#container, this.#list, ...this.#entries.flatMap(({ trigger, panel }) => [trigger, panel])]);
    reconcileChildren(this.#list, this.#entries.map(({ trigger }) => trigger));
    reconcileChildren(this.#panels, this.#entries.map(({ panel }) => panel));
    if (!this.#initialized) this.#value = this.getAttribute("value") ?? "";
    this.#value = this.#normalize(this.#value); this.#initialized = true;
    this.#machine?.updateProps(this.#props()); this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = tabs.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#container, api.getRootProps());
    this.#bindings.apply(this.#list, api.getListProps());
    for (const { section, trigger, panel } of this.#entries) {
      this.#bindings.apply(trigger, api.getTriggerProps({ value: section.value, disabled: this.disabled || section.disabled }));
      trigger.setAttribute("part", section.value === this.#value ? "tab selected-tab" : "tab");
      panel.inert = section.value !== this.#value;
      this.#bindings.apply(panel, api.getContentProps({ value: section.value }));
    }
  }
}
