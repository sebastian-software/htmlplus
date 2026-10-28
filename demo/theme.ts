const picker = document.querySelector<HTMLSelectElement>("#theme")!;
const palette = document.querySelector<HTMLSelectElement>("#palette")!;
const surface = document.querySelector<HTMLSelectElement>("#surface")!;
const palettes = ["neutral", "blue", "green", "orange", "rose", "utility"];
export function applyTheme(): void {
  document.documentElement.classList.toggle("hp-flat", surface.value === "flat");
  const dark = picker.value === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "base";
  document.documentElement.dataset.palette = palette.value;
  document.documentElement.classList.toggle("hp-light", !dark);
  document.documentElement.classList.toggle("hp-dark", dark);
  for (const name of palettes) document.documentElement.classList.toggle(`hp-${name}`, palette.value === name);
}
picker.addEventListener("change", applyTheme);
surface.addEventListener("change", applyTheme);
palette.addEventListener("change", applyTheme);
applyTheme();
