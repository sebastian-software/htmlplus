import "../src/elements/switch.js";
import "../src/elements/tags.js";
import { H6Iban } from "../src/elements/iban.js";

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
