import { spreadProps } from "@zag-js/vanilla";

let sequence = 0;
export function interactionId(kind: string): string { return `h6-${kind}-${++sequence}`; }

export interface InteractionMachine<Service, Props> {
  readonly service: Service;
  start(): void;
  stop(): void;
  updateProps(props: Partial<Props>): void;
  subscribe(callback: (service: Service) => void): () => void;
}

/** Own DOM bindings, not the machine interpreter. Each update replaces its event listeners. */
export class DomBindings {
  #cleanups = new Map<Element, () => void>();
  apply(node: Element, props: Parameters<typeof spreadProps>[1]): void {
    this.#cleanups.set(node, spreadProps(node, props));
  }
  retain(nodes: Element[]): void {
    const keep = new Set(nodes);
    for (const [node, cleanup] of this.#cleanups) if (!keep.has(node)) {
      spreadProps(node, {})(); cleanup(); this.#cleanups.delete(node);
    }
  }
  clear(): void {
    for (const [node, cleanup] of this.#cleanups) { spreadProps(node, {})(); cleanup(); }
    this.#cleanups.clear();
  }
}

export function direction(element: HTMLElement): "ltr" | "rtl" {
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
}
