import "./theme.js";
import "./locale.js";
import "./icons.js";
import "../src/index.js";
import { H6TextField } from "../src/text-fields.js";

const form = document.querySelector<HTMLFormElement>("#demo-form")!;
const fields = document.querySelector<HTMLFieldSetElement>("#demo-fields")!;
const body = document.querySelector<HTMLTableSectionElement>("#entries-body")!;
const jsonOutput = document.querySelector<HTMLElement>("#json-output")!;
const validityStatus = document.querySelector<HTMLElement>("#validity-status")!;
const status = document.querySelector<HTMLElement>("#submission-status")!;
const tags = document.querySelector("h6-tags")!;
const updates = document.querySelector("h6-switch")!;
const selectAll = document.querySelector("#select-all") as HTMLElementTagNameMap["h6-checkbox"];
const selectionRows = Array.from(document.querySelectorAll("h6-checkbox[name=selected]")) as HTMLElementTagNameMap["h6-checkbox"][];
function syncSelection(): void {
  const rows = selectionRows.filter(row => !row.disabled), count = rows.filter(row => row.checked).length;
  selectAll.checked = rows.length > 0 && count === rows.length;
  selectAll.indeterminate = count > 0 && count < rows.length;
  selectAll.disabled = rows.length === 0;
  document.querySelector("#selection-feedback")!.textContent = `${count} of ${rows.length} selected. The header checkbox has no submitted value.`;
}
selectAll.addEventListener("change", () => { for (const row of selectionRows) if (!row.disabled) row.checked = selectAll.checked; syncSelection(); });
for (const row of selectionRows) row.addEventListener("change", syncSelection);
syncSelection();
let lastEvent = "Ready to edit";
let scheduled = false;

function entries(): [string, string][] {
  return Array.from(new FormData(form), ([name, value]) => [name, typeof value === "string" ? value : value.name]);
}

function grouped(data: [string, string][]): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = Object.create(null) as Record<string, string | string[]>;
  for (const [name, value] of data) {
    const previous = result[name];
    if (previous === undefined) result[name] = value;
    else if (Array.isArray(previous)) previous.push(value);
    else result[name] = [previous, value];
  }
  return result;
}

function renderJson(target: HTMLElement, value: unknown): void {
  const text = JSON.stringify(value, null, 2);
  const pattern = /("(?:\\.|[^"\\])*")|\b(true|false|null|\d+)\b/g;
  const fragment = document.createDocumentFragment();
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    fragment.append(document.createTextNode(text.slice(end, index)));
    const span = document.createElement("span");
    span.className = match[1] ? text[index + match[0].length] === ":" ? "json-key" : "json-string" : "json-number";
    span.textContent = match[0];
    fragment.append(span);
    end = index + match[0].length;
  }
  fragment.append(document.createTextNode(text.slice(end)));
  target.replaceChildren(fragment);
}

function render(): void {
  const data = entries();
  body.replaceChildren(...data.map(([name, value]) => {
    const row = document.createElement("tr");
    const key = document.createElement("td");
    const content = document.createElement("td");
    key.textContent = name;
    content.textContent = value;
    row.append(key, content);
    return row;
  }));
  document.querySelector("#entry-count")!.textContent = `${data.length} ${data.length === 1 ? "entry" : "entries"}`;
  document.querySelector<HTMLElement>("#empty-data")!.hidden = data.length > 0;
  renderJson(jsonOutput, grouped(data));

  const invalid = Array.from(form.elements).filter((element) => "willValidate" in element && "validity" in element && Boolean(element.willValidate) && !(element.validity as ValidityState).valid).length;
  const state = fields.disabled ? "disabled" : invalid ? "invalid" : "valid";
  validityStatus.dataset.state = state;
  const dot = document.createElement("span");
  dot.className = "status-dot";
  dot.setAttribute("aria-hidden", "true");
  validityStatus.replaceChildren(dot, document.createTextNode(fields.disabled ? "Fields disabled" : invalid ? `${invalid} ${invalid === 1 ? "field needs" : "fields need"} attention` : "All fields valid"));
  document.querySelector("#last-event")!.textContent = lastEvent;

  for (const [id, feedbackId] of [["iban-field", "iban-feedback"], ["bic-field", "bic-feedback"], ["otp-field", "otp-feedback"], ["duration-field", "duration-feedback"]] as const) {
    const field = document.getElementById(id) as H6TextField;
    const feedback = document.getElementById(feedbackId)!;
    feedback.dataset.state = fields.disabled || !field.value ? "neutral" : field.validity?.valid ? "valid" : "invalid";
    feedback.textContent = field.validationMessage && field.hasAttribute("data-touched") ? field.validationMessage : field.detail;
  }
  const interval = document.querySelector("h6-interval")!;
  const intervalFeedback = document.querySelector<HTMLElement>("#budget-feedback")!;
  intervalFeedback.dataset.state = !fields.disabled && !interval.validity.valid && interval.hasAttribute("data-touched") ? "invalid" : "neutral";
  intervalFeedback.textContent = intervalFeedback.dataset.state === "invalid" ? interval.validationMessage : "One control, two named values. The lower boundary cannot exceed the upper.";
  const date = document.querySelector("h6-date-picker")!;
  document.querySelector("#date-feedback")!.textContent = `Enter ${date.placeholder} or choose a day. The form receives YYYY-MM-DD without a time zone.`;
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; render(); });
}

for (const type of ["input", "change", "valuechange"]) form.addEventListener(type, (event) => {
  const target = event.target as HTMLInputElement;
  lastEvent = `${target.name || target.id || target.localName} / ${type}`;
  schedule();
});
form.addEventListener("focusout", schedule);
document.addEventListener("hp-locale-change", schedule);
form.addEventListener("invalid", () => { form.classList.add("was-validated"); schedule(); }, true);
form.addEventListener("reset", (event) => queueMicrotask(() => {
  if (event.defaultPrevented) return;
  form.classList.remove("was-validated");
  syncSelection();
  lastEvent = "Form reset";
  status.textContent = "Defaults restored.";
  document.querySelector<HTMLElement>("#last-submission")!.hidden = true;
  schedule();
}));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = entries();
  renderJson(document.querySelector<HTMLElement>("#submitted-output")!, grouped(data));
  document.querySelector<HTMLElement>("#last-submission")!.hidden = false;
  lastEvent = "Submit captured";
  status.textContent = `Captured ${data.length} entries locally. Nothing was sent.`;
  schedule();
});

document.querySelector("#load-example")!.addEventListener("click", () => {
  fields.disabled = false;
  document.querySelector<HTMLInputElement>("#disable-fields")!.checked = false;
  document.querySelector("h6-iban")!.value = "de89 3704 0044 0532 0130 00";
  document.querySelector("h6-bic")!.value = "cobadeffxxx";
  document.querySelector("h6-otp")!.value = "004271";
  document.querySelector("h6-duration")!.value = "1h 30m";
  document.querySelector("h6-interval")!.value = [200, 800];
  document.querySelector("h6-segmented")!.value = "standard";
  document.querySelector("h6-slider")!.value = 35;
  document.querySelector("h6-range-slider")!.value = [100, 350];
  document.querySelector("h6-rating")!.value = 4;
  document.querySelector("h6-select")!.value = "standard";
  document.querySelector("h6-combobox")!.value = "DE";
  document.querySelector("h6-date-picker")!.value = "2026-10-28";
  document.querySelector("h6-date-range-picker")!.value = ["2026-10-28", "2026-11-03"];
  tags.value = ["html", "web-components"];
  updates.checked = true;
  document.querySelector("h6-toggle")!.pressed = false;
  document.querySelector("h6-tabs")!.value = "profile";
  document.querySelector("h6-accordion")!.value = ["delivery"];
  document.querySelector("h6-radio-group")!.value = "weekly";
  document.querySelector("h6-number-input")!.value = "3";
  document.querySelector("h6-password-input")!.value = "Demo-only-42!";
  document.querySelector("h6-password-input")!.visible = false;
  document.querySelector("h6-toggle-group")!.value = ["csv", "json"];
  for (const row of selectionRows) row.checked = row.defaultChecked;
  syncSelection();
  for (const input of form.querySelectorAll<HTMLInputElement>(".native-field input")) input.value = input.defaultValue;
  lastEvent = "Example loaded";
  status.textContent = "Example values loaded. Try editing or disabling a field.";
  schedule();
});

document.querySelector("#disable-fields")!.addEventListener("change", (event) => {
  fields.disabled = (event.target as HTMLInputElement).checked;
  lastEvent = fields.disabled ? "Fieldset disabled" : "Fieldset enabled";
  schedule();
});
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-view]")) button.addEventListener("click", () => {
  const view = button.dataset.view;
  for (const item of document.querySelectorAll<HTMLButtonElement>("[data-view]")) item.setAttribute("aria-pressed", String(item === button));
  document.querySelector<HTMLElement>("#entries-view")!.hidden = view !== "entries";
  document.querySelector<HTMLElement>("#json-view")!.hidden = view !== "json";
});

await Promise.all(["h6-switch", "h6-tags", "h6-iban", "h6-bic", "h6-otp", "h6-duration", "h6-interval", "h6-segmented", "h6-toggle", "h6-tabs", "h6-accordion", "h6-slider", "h6-range-slider", "h6-rating", "h6-select", "h6-combobox", "h6-date-picker", "h6-date-range-picker"].map((name) => customElements.whenDefined(name)));
render();

try {
  const response = await fetch("./demo/themes.css");
  if (!response.ok) throw new Error("Theme stylesheet unavailable");
  document.querySelector("#theme-code")!.textContent = await response.text();
} catch { document.querySelector("#theme-code")!.textContent = "Theme source unavailable. Use the download link or reload the page."; }
