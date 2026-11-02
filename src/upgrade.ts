/** A property assigned before upgrade shadows the class accessor; replay it through the setter. */
export function upgradeProperties(element: HTMLElement, names: readonly string[]): void {
  const target = element as unknown as Record<string, unknown>;
  for (const name of names) {
    if (!Object.hasOwn(element, name)) continue;
    const value = target[name];
    delete target[name];
    target[name] = value;
  }
}

/** Value assignment follows native text fields: only null and undefined mean empty. */
export function textValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}
