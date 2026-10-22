import "../src/index.js";
const form = document.querySelector("#demo-form");
const fields = document.querySelector("#demo-fields");
const body = document.querySelector("#entries-body");
const jsonOutput = document.querySelector("#json-output");
const validityStatus = document.querySelector("#validity-status");
const status = document.querySelector("#submission-status");
const tags = document.querySelector("h6-tags");
const updates = document.querySelector("h6-switch");
let lastEvent = "Ready to edit";
let scheduled = false;
function entries() {
    return Array.from(new FormData(form), ([name, value]) => [name, typeof value === "string" ? value : value.name]);
}
function grouped(data) {
    const result = Object.create(null);
    for (const [name, value] of data) {
        const previous = result[name];
        if (previous === undefined)
            result[name] = value;
        else if (Array.isArray(previous))
            previous.push(value);
        else
            result[name] = [previous, value];
    }
    return result;
}
function renderJson(target, value) {
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
function render() {
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
    document.querySelector("#entry-count").textContent = `${data.length} ${data.length === 1 ? "entry" : "entries"}`;
    document.querySelector("#empty-data").hidden = data.length > 0;
    renderJson(jsonOutput, grouped(data));
    const invalid = Array.from(form.elements).filter((element) => "willValidate" in element && "validity" in element && Boolean(element.willValidate) && !element.validity.valid).length;
    const state = fields.disabled ? "disabled" : invalid ? "invalid" : "valid";
    validityStatus.dataset.state = state;
    const dot = document.createElement("span");
    dot.className = "status-dot";
    dot.setAttribute("aria-hidden", "true");
    validityStatus.replaceChildren(dot, document.createTextNode(fields.disabled ? "Fields disabled" : invalid ? `${invalid} ${invalid === 1 ? "field needs" : "fields need"} attention` : "All fields valid"));
    document.querySelector("#last-event").textContent = lastEvent;
    for (const [id, feedbackId] of [["iban-field", "iban-feedback"], ["bic-field", "bic-feedback"], ["otp-field", "otp-feedback"]]) {
        const field = document.getElementById(id);
        const feedback = document.getElementById(feedbackId);
        feedback.dataset.state = fields.disabled || !field.value ? "neutral" : field.validity?.valid ? "valid" : "invalid";
        feedback.textContent = field.validationMessage && field.hasAttribute("data-touched") ? field.validationMessage : field.detail;
    }
}
function schedule() {
    if (scheduled)
        return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; render(); });
}
for (const type of ["input", "change"])
    form.addEventListener(type, (event) => {
        const target = event.target;
        lastEvent = `${target.name || target.id || target.localName} / ${type}`;
        schedule();
    });
form.addEventListener("focusout", schedule);
form.addEventListener("invalid", () => { form.classList.add("was-validated"); schedule(); }, true);
form.addEventListener("reset", (event) => queueMicrotask(() => {
    if (event.defaultPrevented)
        return;
    form.classList.remove("was-validated");
    lastEvent = "Form reset";
    status.textContent = "Defaults restored.";
    document.querySelector("#last-submission").hidden = true;
    schedule();
}));
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = entries();
    renderJson(document.querySelector("#submitted-output"), grouped(data));
    document.querySelector("#last-submission").hidden = false;
    lastEvent = "Submit captured";
    status.textContent = `Captured ${data.length} entries locally. Nothing was sent.`;
    schedule();
});
document.querySelector("#load-example").addEventListener("click", () => {
    fields.disabled = false;
    document.querySelector("#disable-fields").checked = false;
    document.querySelector("h6-iban").value = "de89 3704 0044 0532 0130 00";
    document.querySelector("h6-bic").value = "cobadeffxxx";
    document.querySelector("h6-otp").value = "004271";
    tags.value = ["html", "web-components"];
    updates.checked = true;
    lastEvent = "Example loaded";
    status.textContent = "Example values loaded. Try editing or disabling a field.";
    schedule();
});
document.querySelector("#disable-fields").addEventListener("change", (event) => {
    fields.disabled = event.target.checked;
    lastEvent = fields.disabled ? "Fieldset disabled" : "Fieldset enabled";
    schedule();
});
document.querySelector("#theme").addEventListener("change", (event) => {
    document.documentElement.dataset.theme = event.target.value;
});
for (const button of document.querySelectorAll("[data-view]"))
    button.addEventListener("click", () => {
        const view = button.dataset.view;
        for (const item of document.querySelectorAll("[data-view]"))
            item.setAttribute("aria-pressed", String(item === button));
        document.querySelector("#entries-view").hidden = view !== "entries";
        document.querySelector("#json-view").hidden = view !== "json";
    });
await Promise.all(["h6-switch", "h6-tags", "h6-iban", "h6-bic", "h6-otp"].map((name) => customElements.whenDefined(name)));
render();
