/** ARIA ID references stay in the author's tree; shadow controls receive resolved text. */
function references(host: HTMLElement, attribute: string): Element[] {
  const root = host.getRootNode() as Document | ShadowRoot;
  return (host.getAttribute(attribute) ?? "").split(/\s+/).flatMap(id => root.getElementById?.(id) ?? []);
}
export function referencedText(host: HTMLElement, attribute: string): string {
  return references(host, attribute).map(node => node.textContent?.trim() ?? "").filter(Boolean).join(" ");
}
/** A wrapping label's text excludes the control itself, such as its option children. */
function labelText(label: Element, host: HTMLElement): string {
  const walker = document.createTreeWalker(label, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: node => node === host ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  let text = "";
  while (walker.nextNode()) if (walker.currentNode.nodeType === Node.TEXT_NODE) text += walker.currentNode.nodeValue;
  return text.replace(/\s+/g, " ").trim();
}
export function fieldLabel(host: HTMLElement, labels: NodeList, fallback: string): string {
  return referencedText(host, "aria-labelledby") || host.getAttribute("aria-label") || Array.from(labels, label => labelText(label as Element, host)).filter(Boolean).join(" ") || fallback;
}

/**
 * Keeps a shadow editor's name current without observing the document: known labels and
 * references, plus siblings added beside the control or its labels. A label added anywhere
 * else is picked up when the control next receives focus.
 */
export class LabelContext {
  #observer = new MutationObserver(() => this.#refresh());
  #refresh = (): void => { this.#watch(); this.changed(); };
  constructor(private readonly host: HTMLElement & { readonly labels: NodeList }, private readonly changed: () => void) {}
  connect(): void { this.host.addEventListener("focusin", this.#refresh); this.#watch(); }
  disconnect(): void { this.host.removeEventListener("focusin", this.#refresh); this.#observer.disconnect(); }
  #watch(): void {
    this.#observer.disconnect();
    this.#observer.observe(this.host, { attributes: true, attributeFilter: ["id", "aria-labelledby", "aria-describedby"] });
    const labels = Array.from(this.host.labels) as Element[];
    for (const parent of new Set([this.host, ...labels].map(node => node.parentNode))) if (parent) this.#observer.observe(parent, { childList: true });
    for (const node of [...labels, ...references(this.host, "aria-labelledby"), ...references(this.host, "aria-describedby")]) {
      this.#observer.observe(node, { childList: true, characterData: true, subtree: true });
    }
  }
}
