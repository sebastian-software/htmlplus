import { spreadProps } from "@zag-js/vanilla";

let sequence = 0;
export function interactionId(kind: string): string {
  return `hplus-${kind}-${++sequence}`;
}

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
    for (const [node, cleanup] of this.#cleanups)
      if (!keep.has(node)) {
        spreadProps(node, {})();
        cleanup();
        this.#cleanups.delete(node);
      }
  }
  clear(): void {
    for (const [node, cleanup] of this.#cleanups) {
      spreadProps(node, {})();
      cleanup();
    }
    this.#cleanups.clear();
  }
}

/** CSS anchor positioning places popups, so Zag's Floating UI positioning never computes. */
export const anchoredPositioning = { placement: "bottom-start" as const, updatePosition: async () => {} };

/** Places a popover below its control, flips it where it fits, and shrinks it only when no side fits. */
export const anchoredPopupStyles = `
  @position-try --hplus-shrink { max-height: calc(100% - 14px); }
  [part=control] { anchor-name: --hplus-control; }
  [part=positioner] { position-anchor: --hplus-control; position-area: self-block-end span-self-inline-end; position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline, --hplus-shrink; inset: auto; margin: 6px 0 8px; }
  [part=positioner]:popover-open { display: flex; flex-direction: column; }
  [part=positioner] > [part=content] { min-height: 0; }`;

/** Positioner props without Zag's placement styles, which anchor positioning replaces. */
export function positionerProps<Props extends { style?: unknown }>(props: Props): Props {
  delete props.style;
  return props;
}

export function direction(element: HTMLElement): "ltr" | "rtl" {
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
}
