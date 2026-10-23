const picker = document.querySelector<HTMLSelectElement>("#theme")!;
export function applyTheme(): void {
  const mode = picker.value;
  const dark = mode === "dark";
  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle("hp-light", !dark);
  document.documentElement.classList.toggle("hp-dark", dark);
}
picker.addEventListener("change", applyTheme);
applyTheme();
