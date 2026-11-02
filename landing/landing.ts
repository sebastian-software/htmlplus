import { H6Switch } from "../src/switch.js";
import { H6Tags } from "../src/tags.js";
import { H6Iban } from "../src/text-fields.js";

for (const [name, definition] of [
  ["h6-iban", H6Iban],
  ["h6-tags", H6Tags],
  ["h6-switch", H6Switch],
] as const) {
  if (!customElements.get(name)) customElements.define(name, definition);
}

const form = document.querySelector<HTMLFormElement>("#sheet-form")!;
const rows = document.querySelector<HTMLElement>("#result-rows")!;
const status = document.querySelector<HTMLElement>("#result-status")!;

function show(): void {
  rows.replaceChildren(
    ...Array.from(new FormData(form), ([name, value]) => {
      const row = document.createElement("tr"),
        key = document.createElement("th"),
        cell = document.createElement("td");
      key.scope = "row";
      key.textContent = name;
      cell.textContent = String(value);
      row.append(key, cell);
      return row;
    }),
  );
  const invalid = Array.from(form.elements).find((element) => element instanceof H6Iban && !element.validity.valid) as
    | H6Iban
    | undefined;
  status.toggleAttribute("data-invalid", Boolean(invalid));
  status.textContent = invalid ? `A submit would be blocked: ${invalid.validationMessage}` : "All fields valid.";
}

for (const type of ["input", "change"]) form.addEventListener(type, show);
// Reset callbacks run after the reset event, so read the restored values in a task.
form.addEventListener("reset", () => setTimeout(show));
form.addEventListener("submit", (event) => event.preventDefault());
show();
