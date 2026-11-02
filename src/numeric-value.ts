export interface NumericBounds { min: number; max: number; step: number; any: boolean; error: string }

export function numericBounds(host: Element): NumericBounds {
  const read = (name: string, fallback: number): number => host.hasAttribute(name) ? Number(host.getAttribute(name)) : fallback;
  // As with native step="any", values are not snapped; keyboard stepping still moves by one.
  const any = host.getAttribute("step")?.trim().toLowerCase() === "any";
  const min = read("min", 0), max = read("max", 100), step = any ? 1 : read("step", 1);
  if (![min, max, step, max - min].every(Number.isFinite) || min >= max || step <= 0 || !Number.isFinite((max - min) / step)) {
    return { min: 0, max: 100, step: 1, any: false, error: "Set finite bounds with min below max and a positive step." };
  }
  return { min, max, step, any, error: "" };
}

/** Snap to steps anchored at min, without allowing a rounded value past max. */
export function snap(value: number, { min, max, step, any }: NumericBounds): number {
  if (any) return Math.min(max, Math.max(min, value));
  const ticks = Math.max(0, Math.min(Math.floor((max - min) / step + 1e-10), Math.round((value - min) / step)));
  return Number((min + ticks * step).toPrecision(15));
}
