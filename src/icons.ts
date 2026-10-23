const paths = {
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-right": "m9 18 6-6-6-6",
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "arrow-down": "M12 4v16m-6-6 6 6 6-6",
  refresh: "M20 11a8 8 0 1 0-2.3 6.7M20 4v7h-7",
  "chevron-down": "m6 9 6 6 6-6",
} as const;

export type IconName = keyof typeof paths;

/** Decorative geometry independent of font metrics. The parent owns its accessible name. */
export function createIcon(name: IconName): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [attribute, value] of Object.entries({ viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" })) icon.setAttribute(attribute, value);
  const path = document.createElementNS(icon.namespaceURI, "path");
  path.setAttribute("d", paths[name]);
  icon.append(path);
  return icon;
}
