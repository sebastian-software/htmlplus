// Stands in for @zag-js/popper. CSS anchor positioning places html+ popups, so Floating UI never runs.

interface PlacementOptions {
  placement?: string;
  onComplete?(data: { placement: string }): void;
}

export function getPlacement(_reference: unknown, _floating: unknown, options: PlacementOptions = {}): () => void {
  options.onComplete?.({ placement: options.placement ?? "bottom" });
  return () => {};
}

export function getPlacementSide(placement: string): string {
  return placement.split("-")[0]!;
}

export function getPlacementStyles(): { arrow: object; arrowTip: object; floating: object } {
  return { arrow: {}, arrowTip: {}, floating: {} };
}

export function isValidPlacement(value: string): boolean {
  return /^(?:top|bottom|left|right)(?:-(?:start|end))?$/.test(value);
}
