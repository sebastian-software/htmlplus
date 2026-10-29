import { theme, radius, surfaceShadow } from "./theme.js";

const styles = `
  [part=control] { position: relative; width: min(100%, calc(var(--_hp-otp-count) * var(--hp-otp-slot-size, 2.5rem) + (var(--_hp-otp-count) - 1) * var(--hp-otp-gap, .5rem))); overflow: clip; direction: ltr; }
  [part=slots] { display: grid; grid-template-columns: repeat(var(--_hp-otp-count), minmax(0, 1fr)); gap: var(--hp-otp-gap, .5rem); }
  [part~=slot] { position: relative; display: block; height: var(--hp-control-height, 2.5rem); border: 1px solid ${theme("input")}; border-radius: ${radius("md")}; background: ${theme("background")}; box-shadow: ${surfaceShadow("inset")}; }
  [part~=active-slot] { border-color: ${theme("ring")}; outline: 2px solid ${theme("ring")}; outline-offset: -2px; }
  [part~=selected-slot] { background: color-mix(in srgb, ${theme("ring")} 18%, ${theme("background")}); }
  [part~=active-slot]::after { content: ""; position: absolute; width: 1.5px; height: 1.25rem; background: ${theme("foreground")}; left: 50%; top: 50%; transform: translate(-50%, -50%); animation: hp-otp-caret 1.1s step-end infinite; }
  [part~=active-slot][data-filled]::after { left: calc(50% - .4em); }
  [part~=active-slot][data-end]::after { left: calc(50% + .4em); }
  [part=control] input { position: absolute; inset: 0 auto auto 0; width: calc(100% + 2 * var(--_hp-otp-cell, 2.5rem)); max-width: none; height: 100%; margin: 0; padding: 0 0 0 max(0px, calc((var(--_hp-otp-cell, 2.5rem) - 1ch) / 2)); border: 0; border-radius: 0; background: transparent; box-shadow: none; outline: none; font-family: ui-monospace, monospace; font-size: var(--hp-otp-font-size, 1.25rem); font-variant-numeric: tabular-nums; line-height: var(--hp-control-height, 2.5rem); letter-spacing: calc(var(--_hp-otp-pitch, 3rem) - 1ch); caret-color: transparent; text-align: start; direction: ltr; }
  [part=control] input::selection { color: ${theme("foreground")}; background: transparent; }
  [part=control] input:disabled { opacity: 1; }
  :host(:disabled) [part=control] { opacity: .5; }
  :host([data-touched]:invalid) [part~=slot] { border-color: ${theme("destructive")}; }
  [part=control][data-overflow] input { width: 100%; padding-inline: .75rem; letter-spacing: normal; caret-color: ${theme("foreground")}; }
  [part=control][data-overflow] [part=slots] { visibility: hidden; }
  [part=control][data-overflow] { border: 1px solid ${theme("destructive")}; border-radius: ${radius("md")}; background: ${theme("background")}; }
  @keyframes hp-otp-caret { 50% { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { [part~=active-slot]::after { animation: none; } }
  @media (forced-colors: active) { [part~=slot] { border-color: CanvasText; } [part~=active-slot] { outline-color: Highlight; } [part~=active-slot]::after { background: CanvasText; } [part~=selected-slot] { outline: 2px solid Highlight; outline-offset: -2px; } }
`;

/** Decorative cells share the native editor's geometry; there are no cell inputs. */
export class OtpPresentation {
  #control: HTMLElement;
  #slots: HTMLElement;
  #observer = new ResizeObserver(() => this.#measure());
  #connected = false;
  constructor(private readonly input: HTMLInputElement) {
    const root = input.getRootNode() as ShadowRoot;
    const style = document.createElement("style"); style.textContent = styles;
    this.#control = document.createElement("div"); this.#control.part.add("control");
    this.#slots = document.createElement("div"); this.#slots.part.add("slots"); this.#slots.setAttribute("aria-hidden", "true");
    this.#control.append(this.#slots); root.append(style, this.#control); this.#control.append(input);
  }
  connect(): void {
    if (this.#connected) return; this.#connected = true;
    this.#observer.observe(this.#control);
    for (const type of ["focus", "blur", "select", "selectionchange", "keyup", "pointerup"]) this.input.addEventListener(type, this.#selection);
    this.input.ownerDocument.addEventListener("selectionchange", this.#selection);
  }
  disconnect(): void {
    this.#connected = false; this.#observer.disconnect();
    for (const type of ["focus", "blur", "select", "selectionchange", "keyup", "pointerup"]) this.input.removeEventListener(type, this.#selection);
    this.input.ownerDocument.removeEventListener("selectionchange", this.#selection);
  }
  sync(length: number): void {
    this.#control.style.setProperty("--_hp-otp-count", String(length));
    while (this.#slots.children.length < length) { const slot = document.createElement("span"); slot.part.add("slot"); this.#slots.append(slot); }
    while (this.#slots.children.length > length) this.#slots.lastElementChild!.remove();
    this.#control.toggleAttribute("data-overflow", this.input.value.length > length || /\s/.test(this.input.value));
    this.#measure(); this.#selection();
  }
  #measure(): void {
    const cell = this.#slots.firstElementChild?.getBoundingClientRect().width ?? 0;
    const gap = parseFloat(getComputedStyle(this.#slots).columnGap) || 0;
    if (cell) { this.#control.style.setProperty("--_hp-otp-cell", `${cell}px`); this.#control.style.setProperty("--_hp-otp-pitch", `${cell + gap}px`); }
  }
  #selection = (): void => {
    const root = this.input.getRootNode() as ShadowRoot;
    const focused = root.activeElement === this.input;
    const start = this.input.selectionStart ?? 0, end = this.input.selectionEnd ?? start;
    const count = this.#slots.children.length;
    Array.from(this.#slots.children).forEach((slot, index) => {
      const filled = index < this.input.value.length;
      slot.part.toggle("filled-slot", filled); slot.toggleAttribute("data-filled", filled);
      slot.part.toggle("selected-slot", focused && index >= start && index < end);
      slot.part.toggle("active-slot", focused && start === end && index === Math.min(start, count - 1));
      slot.toggleAttribute("data-end", focused && start === end && start === count && index === count - 1);
    });
  };
}
