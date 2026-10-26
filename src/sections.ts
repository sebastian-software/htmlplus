export interface Section {
  element: HTMLElement;
  value: string;
  label: string;
  disabled: boolean;
  slot: string;
}

// display:none reconstructs native editors and drops Firefox's undo history.
export const inactiveSectionStyles = `[hidden] {
  display: block !important; block-size: 0 !important; min-block-size: 0 !important;
  padding-block: 0 !important; margin-block: 0 !important; border-block-width: 0 !important;
  overflow: clip !important; visibility: hidden !important;
}`;

/** Light-DOM content stays in its original form; only its slot assignment is managed. */
export function readSections(host: HTMLElement, id: string): Section[] {
  const values = new Set<string>();
  const result: Section[] = [];
  for (const child of host.children) {
    if (!(child instanceof HTMLElement) || child.localName !== "section") continue;
    const value = child.dataset.value ?? "";
    if (!value || values.has(value)) {
      if (child.slot.startsWith(`${id}-`)) child.removeAttribute("slot");
      continue;
    }
    values.add(value);
    const slot = `${id}-${encodeURIComponent(value)}`;
    if (child.slot !== slot) child.slot = slot;
    result.push({ element: child, value, label: child.dataset.label || value, disabled: child.hasAttribute("data-disabled"), slot });
  }
  return result;
}

export function sectionsChanged(records: MutationRecord[], host: HTMLElement): boolean {
  return records.some((record) => record.type === "childList" ? record.target === host : (record.target as Element).parentElement === host);
}

export function containsFocus(section: Section): boolean {
  return section.element.contains(section.element.ownerDocument.activeElement);
}

export function reconcileChildren(parent: Element, children: Element[]): void {
  children.forEach((child, index) => { if (parent.children[index] !== child) parent.insertBefore(child, parent.children[index] ?? null); });
  while (parent.children.length > children.length) parent.lastElementChild!.remove();
}
