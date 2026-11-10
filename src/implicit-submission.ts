/** Shadow editors have no form owner, so the browser cannot submit implicitly for them. */
const editorHosts = new WeakSet<Element>();
const blockingTypes = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "number",
]);

function blocksImplicitSubmission(element: Element): boolean {
  return editorHosts.has(element) || (element instanceof HTMLInputElement && blockingTypes.has(element.type));
}

function submitImplicitly(form: HTMLFormElement): void {
  const fields = Array.from(form.elements);
  // Image inputs are omitted from form.elements. Search the tree so external
  // form-associated buttons also keep their native document order.
  const root = form.getRootNode() as Document | DocumentFragment | Element;
  const button = Array.from(root.querySelectorAll("button, input")).find(
    (element): element is HTMLButtonElement | HTMLInputElement =>
      (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) &&
      element.form === form &&
      (element.type === "submit" || element.type === "image"),
  );
  if (button) {
    if (!button.disabled) button.click();
    return;
  }
  if (fields.filter(blocksImplicitSubmission).length <= 1) form.requestSubmit();
}

export function enableImplicitSubmission(
  host: HTMLElement & { readonly form: HTMLFormElement | null },
  inputs: readonly HTMLInputElement[],
): void {
  editorHosts.add(host);
  for (const input of inputs) {
    input.addEventListener("keypress", (event) => {
      if (event.key !== "Enter" || event.isComposing) return;
      // A task runs after the native change event and any later preventDefault, matching native order.
      setTimeout(() => {
        if (!event.defaultPrevented && host.form) submitImplicitly(host.form);
      });
    });
  }
}
