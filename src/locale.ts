import { CalendarDate, startOfWeek } from "@internationalized/date";

/** Explicit locale overrides inherited HTML language, including across shadow roots. */
function ancestors(element: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  let current: HTMLElement | null = element;
  while (current) {
    result.push(current);
    const root = current.getRootNode();
    current = current.assignedSlot ?? current.parentElement ?? (root instanceof ShadowRoot ? root.host as HTMLElement : null);
  }
  return result;
}

export function resolvedLocale(element: HTMLElement): string {
  const explicit = element.getAttribute("locale")?.trim();
  if (explicit) return explicit;
  for (const node of ancestors(element)) {
    const language = node.getAttribute("lang")?.trim();
    if (language) return language;
  }
  return element.ownerDocument.documentElement.lang || element.ownerDocument.defaultView?.navigator.language || "en-US";
}

/** Observe only the language context, rather than every mutation in the document. */
export class LocaleContext {
  #observer = new MutationObserver(records => records.some(record => record.attributeName === "slot") ? this.connect() : this.update());
  #value?: string;
  #slots: EventTarget[] = [];
  #slotChanged = (): void => this.connect();
  constructor(private readonly element: HTMLElement, private readonly changed: (locale: string) => void) {}
  connect(): void {
    this.disconnect();
    for (const node of ancestors(this.element)) {
      this.#observer.observe(node, { attributes: true, attributeFilter: node === this.element ? ["lang", "locale", "slot"] : ["lang", "slot"] });
      if (node instanceof HTMLSlotElement) { this.#slots.push(node); node.addEventListener("slotchange", this.#slotChanged); }
      if (node.shadowRoot) { this.#slots.push(node.shadowRoot); node.shadowRoot.addEventListener("slotchange", this.#slotChanged); }
    }
    this.update();
  }
  disconnect(): void {
    this.#observer.disconnect();
    for (const slot of this.#slots) slot.removeEventListener("slotchange", this.#slotChanged);
    this.#slots = [];
  }
  update(): void {
    const value = resolvedLocale(this.element);
    if (value === this.#value) return;
    this.#value = value; this.changed(value);
  }
}

/** Intl uses 1–7 for Monday–Sunday; Zag uses 0–6 for Sunday–Saturday. */
export function localeWeekStart(locale: string): number {
  const value = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
  const firstDay = value.getWeekInfo?.().firstDay ?? value.weekInfo?.firstDay;
  // Zag's date model supplies locale week data when Intl.Locale lacks this API.
  return firstDay === undefined ? startOfWeek(new CalendarDate(2028, 1, 1), locale).toDate("UTC").getUTCDay() : firstDay % 7;
}
