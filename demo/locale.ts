const picker = document.querySelector<HTMLSelectElement>("#locale")!;
const key = "htmlplus-demo-locale";
try {
  const saved = sessionStorage.getItem(key);
  if (saved && Array.from(picker.options).some((option) => option.value === saved)) picker.value = saved;
} catch {
  /* The locale picker also works without browser storage. */
}

export function applyFieldLocale(element: HTMLElement): void {
  if (!element.matches("hplus-date-picker, hplus-date-range-picker, hplus-number-input")) return;
  element.lang = picker.value;
  element.dir = picker.selectedOptions[0]?.dataset.direction ?? "ltr";
}
export function applyLocale(): void {
  // Page copy stays English; these hosts demonstrate the HTML language contract.
  for (const element of document.querySelectorAll<HTMLElement>(
    "hplus-date-picker, hplus-date-range-picker, hplus-number-input",
  ))
    applyFieldLocale(element);
}
picker.addEventListener("change", () => {
  applyLocale();
  try {
    sessionStorage.setItem(key, picker.value);
  } catch {
    /* Optional preference only. */
  }
  document.dispatchEvent(new Event("hp-locale-change"));
});
applyLocale();
