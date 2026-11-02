/** Registering twice would throw, so the first definition of a name stays. */
export function define(name: string, definition: CustomElementConstructor): void {
  if (!customElements.get(name)) customElements.define(name, definition);
}
