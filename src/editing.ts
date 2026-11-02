/** Frameworks write back the value a person just produced. That must not disturb the text they are editing. */
export function isEditing(input: HTMLInputElement): boolean {
  const root = input.getRootNode();
  return root instanceof ShadowRoot && root.activeElement === input;
}
