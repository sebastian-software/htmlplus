/** ARIA ID references stay in the author's tree; shadow controls receive resolved text. */
export function referencedText(host: HTMLElement, attribute: string): string {
  const root = host.getRootNode() as Document | ShadowRoot;
  return (host.getAttribute(attribute) ?? "").split(/\s+/).map(id => root.getElementById?.(id)?.textContent?.trim() ?? "").filter(Boolean).join(" ");
}
export function fieldLabel(host: HTMLElement, labels: NodeList, fallback: string): string {
  return referencedText(host, "aria-labelledby") || host.getAttribute("aria-label") || Array.from(labels, label => label.textContent?.trim() ?? "").filter(Boolean).join(" ") || fallback;
}
