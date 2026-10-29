export interface FormattedText { value: string; caret: number }
export type TextFormat = (value: string, caret: number) => FormattedText;

export function groupedIban(value: string): string {
  return value.replace(/\s/g, "").toUpperCase().match(/.{1,4}/gu)?.join(" ") ?? "";
}
export function ibanFormat(value: string, caret: number): FormattedText {
  const before = value.slice(0, caret).replace(/\s/g, "").toUpperCase();
  return { value: groupedIban(value), caret: groupedIban(before).length };
}

/** Use native editing commands, rather than value assignment, to retain undo.
 * Unsupported commands leave the original edit available to the browser.
 */
export class NativeTextFormat {
  #busy = false;
  #connected = false;
  constructor(private readonly input: HTMLInputElement, private readonly format: TextFormat) {}
  connect(): void {
    if (this.#connected) return; this.#connected = true;
    this.input.addEventListener("beforeinput", this.#before);
    this.input.addEventListener("paste", this.#paste);
    this.input.addEventListener("input", this.#after, true);
    this.input.addEventListener("compositionend", this.#commit);
    this.input.addEventListener("blur", this.#commit);
  }
  disconnect(): void {
    this.#connected = false;
    this.input.removeEventListener("beforeinput", this.#before);
    this.input.removeEventListener("paste", this.#paste);
    this.input.removeEventListener("input", this.#after, true);
    this.input.removeEventListener("compositionend", this.#commit);
    this.input.removeEventListener("blur", this.#commit);
  }
  #replace(value: string, caret: number): boolean {
    const input = this.input, previous = input.value;
    if (input.disabled || input.readOnly || this.#busy) return false;
    if (previous === value) { input.setSelectionRange(caret, caret); return true; }
    if (input.getRootNode() instanceof ShadowRoot && (input.getRootNode() as ShadowRoot).activeElement !== input) return false;
    const start = input.selectionStart ?? 0, end = input.selectionEnd ?? start, direction = input.selectionDirection;
    let prefix = 0, suffix = 0;
    while (prefix < previous.length && prefix < value.length && previous[prefix] === value[prefix]) prefix++;
    while (suffix < previous.length - prefix && suffix < value.length - prefix && previous[previous.length - suffix - 1] === value[value.length - suffix - 1]) suffix++;
    let emitted = false;
    const observe = (): void => { emitted = true; };
    input.addEventListener("input", observe);
    this.#busy = true;
    try {
      input.setSelectionRange(prefix, previous.length - suffix);
      // There is currently no standard replacement API that retains native undo.
      input.ownerDocument.execCommand("insertText", false, value.slice(prefix, value.length - suffix));
      if (input.value !== previous) {
        input.setSelectionRange(Math.min(caret, input.value.length), Math.min(caret, input.value.length));
        if (!emitted) input.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, inputType: "insertText" }));
        return true;
      }
      input.setSelectionRange(start, end, direction ?? undefined); return false;
    } catch {
      input.setSelectionRange(start, end, direction ?? undefined); return false;
    } finally { this.#busy = false; input.removeEventListener("input", observe); }
  }
  #edit(insert: string, start: number, end: number, force = false): boolean {
    const raw = this.input.value.slice(0, start) + insert + this.input.value.slice(end);
    const result = this.format(raw, start + insert.length);
    // Already formatted native edits keep their ordinary browser path.
    if (raw === result.value && !force) return false;
    return this.#replace(result.value, result.caret);
  }
  #before = (event: InputEvent): void => {
    if (!event.cancelable || event.defaultPrevented || event.isComposing || this.#busy || event.inputType.startsWith("history")) return;
    const start = this.input.selectionStart ?? 0, end = this.input.selectionEnd ?? start;
    if (event.inputType === "insertText" && event.data !== null) {
      if (this.#edit(event.data, start, end)) event.preventDefault();
    } else if (event.inputType === "deleteContentBackward" || event.inputType === "deleteContentForward") {
      if (/[^\x20-\x7e]/.test(this.input.value)) return;
      let from = start, to = end, separator = false;
      if (from === to && event.inputType === "deleteContentBackward") from = Math.max(0, from - 1);
      if (from === to && event.inputType === "deleteContentForward") to = Math.min(this.input.value.length, to + 1);
      // A generated separator is not a character the person needs to delete twice.
      if (start === end && event.inputType === "deleteContentBackward" && /^\s+$/.test(this.input.value.slice(from, to))) { from = Math.max(0, from - 1); separator = true; }
      if (start === end && event.inputType === "deleteContentForward" && /^\s+$/.test(this.input.value.slice(from, to))) { to = Math.min(this.input.value.length, to + 1); separator = true; }
      if (this.#edit("", from, to, separator)) event.preventDefault();
    }
  };
  #paste = (event: ClipboardEvent): void => {
    if (event.defaultPrevented || !event.clipboardData || this.#busy) return;
    if (this.#edit(event.clipboardData.getData("text/plain"), this.input.selectionStart ?? 0, this.input.selectionEnd ?? 0)) event.preventDefault();
  };
  #after = (event: Event): void => {
    if (this.#busy || (event instanceof InputEvent && (event.isComposing || event.inputType.startsWith("history")))) return;
    const result = this.format(this.input.value, this.input.selectionStart ?? this.input.value.length);
    if (result.value !== this.input.value && this.#replace(result.value, result.caret)) event.stopImmediatePropagation();
  };
  #commit = (): void => {
    if (this.#busy) return;
    const result = this.format(this.input.value, this.input.selectionStart ?? this.input.value.length);
    if (result.value !== this.input.value) this.#replace(result.value, result.caret);
  };
}
