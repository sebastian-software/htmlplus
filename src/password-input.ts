import * as passwordInput from "@zag-js/password-input";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { label, wrap } from "./compound-input.js";
import { H6TextField } from "./text-fields.js";
import { DomBindings, direction, interactionId } from "./zag-dom.js";
import type { InteractionMachine } from "./zag-dom.js";
import { visiblyInvalid } from "./touched.js";

export class H6PasswordInput extends H6TextField {
  static override observedAttributes = [...H6TextField.observedAttributes, "show-label", "hide-label"];
  #id = interactionId("password");
  #machine?: InteractionMachine<passwordInput.Service, passwordInput.Props>;
  #bindings = new DomBindings();
  #control: HTMLElement;
  #trigger: HTMLButtonElement;
  #visible = false;
  #form?: HTMLFormElement | null;
  constructor() {
    super();
    this.#control = wrap(
      this,
      '<button part="visibility-trigger" type="button"><svg part="indicator" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path data-slash d="m3 3 18 18"/></svg></button>',
    );
    this.#trigger = this.#control.querySelector("button")!;
    this.#trigger.addEventListener("click", () => {
      if (this.input.disabled) return;
      const start = this.input.selectionStart,
        end = this.input.selectionEnd;
      passwordInput.connect(this.#machine!.service, normalizeProps).toggleVisible();
      this.input.focus({ preventScroll: true });
      if (start !== null && end !== null) this.input.setSelectionRange(start, end);
    });
  }
  override get defaultAutocomplete(): AutoFill {
    return "current-password";
  }
  protected override get upgradedProperties(): readonly string[] {
    return ["value", "visible"];
  }
  // Like a native password field, keep the secret out of session-history form state.
  protected override get restorationState(): string | null {
    return null;
  }
  override formStateRestoreCallback(state: string): void {
    this.#visible = false;
    super.formStateRestoreCallback(state);
  }
  get visible(): boolean {
    return this.#visible;
  }
  set visible(value: boolean) {
    this.#visible = Boolean(value);
    this.refresh();
  }
  override connectedCallback(): void {
    super.connectedCallback();
    this.#machine = new VanillaMachine(passwordInput.machine, {
      id: this.#id,
      getRootNode: () => this.shadowRoot!,
      visible: this.#visible,
      onVisibilityChange: ({ visible }) => {
        this.#visible = visible;
        this.refresh();
        this.dispatchEvent(new CustomEvent("visibilitychange", { detail: { visible } }));
      },
    });
    this.#machine.subscribe(() => this.#render());
    this.refresh();
    this.#machine.start();
    this.formAssociatedCallback(this.form);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#machine?.stop();
    this.#machine = undefined;
    this.#bindings.clear();
    this.#form?.removeEventListener("submit", this.#hide);
    this.#form = null;
  }
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.#form?.removeEventListener("submit", this.#hide);
    this.#form = form;
    form?.addEventListener("submit", this.#hide);
  }
  #hide = (): void => {
    this.visible = false;
  };
  override formResetCallback(): void {
    this.#visible = false;
    super.formResetCallback();
  }
  override refresh(): void {
    super.refresh();
    this.#machine?.updateProps({
      visible: this.#visible,
      disabled: this.input.disabled,
      readOnly: this.readOnly,
      required: this.required,
      invalid: visiblyInvalid(this),
      autoComplete: this.getAttribute("autocomplete") === "new-password" ? "new-password" : "current-password",
      dir: direction(this),
      translations: {
        visibilityTrigger: (visible) =>
          this.getAttribute(visible ? "hide-label" : "show-label") || (visible ? "Hide password" : "Show password"),
      },
    });
    this.#render();
  }
  #render(): void {
    if (!this.#machine) return;
    const api = passwordInput.connect(this.#machine.service, normalizeProps);
    this.#bindings.apply(this.#control, api.getControlProps());
    this.#bindings.apply(this.input, api.getInputProps());
    // Native click handles keyboard, touch, and pointer exactly once.
    const props = api.getVisibilityTriggerProps();
    delete props.onpointerdown;
    this.#bindings.apply(this.#trigger, props);
    this.#trigger.tabIndex = this.input.disabled ? -1 : 0;
    this.#trigger.removeAttribute("aria-expanded");
    this.#trigger.querySelector<SVGElement>("[data-slash]")!.style.display = this.#visible ? "none" : "";
    label(this);
  }
}
