export interface NumericBounds { min: number; max: number; step: number; error: string }

export function numericBounds(host: Element): NumericBounds {
  const read = (name: string, fallback: number): number => host.hasAttribute(name) ? Number(host.getAttribute(name)) : fallback;
  const min = read("min", 0), max = read("max", 100), step = read("step", 1);
  if (![min, max, step, max - min].every(Number.isFinite) || min >= max || step <= 0 || !Number.isFinite((max - min) / step)) {
    return { min: 0, max: 100, step: 1, error: "Set finite bounds with min below max and a positive step." };
  }
  return { min, max, step, error: "" };
}

/** Snap to steps anchored at min, without allowing a rounded value past max. */
export function snap(value: number, { min, max, step }: NumericBounds): number {
  const ticks = Math.max(0, Math.min(Math.floor((max - min) / step + 1e-10), Math.round((value - min) / step)));
  return Number((min + ticks * step).toPrecision(15));
}
