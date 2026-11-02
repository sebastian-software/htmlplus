/** Invalid presentation waits until focus leaves the control or validation fails. */
export function trackTouched(host: HTMLElement, changed: () => void): void {
  const touch = (): void => {
    if (!host.hasAttribute("data-touched")) {
      host.setAttribute("data-touched", "");
      changed();
    }
  };
  // Focus moving inside the shadow tree does not reach a host listener.
  host.addEventListener("focusout", touch);
  host.addEventListener("invalid", touch);
}

export function visiblyInvalid(
  host: HTMLElement & { readonly willValidate: boolean; readonly validity: ValidityState },
): boolean {
  return host.hasAttribute("data-touched") && host.willValidate && !host.validity.valid;
}
