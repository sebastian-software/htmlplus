/** Parse an elapsed duration to whole seconds; a bare integer already means seconds. */
export function parseDuration(value: string): number | null {
  const text = value.trim().toLowerCase();
  let seconds: number;
  if (/^\d+$/.test(text)) seconds = Number(text);
  else {
    const clock = /^(\d+):([0-5]\d)(?::([0-5]\d))?$/.exec(text);
    if (clock) seconds = Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3] ?? 0);
    else {
      const units = /^(?:(\d+)\s*h\s*)?(?:(\d+)\s*m\s*)?(?:(\d+)\s*s)?$/.exec(text);
      if (!units || !text) return null;
      seconds = Number(units[1] ?? 0) * 3600 + Number(units[2] ?? 0) * 60 + Number(units[3] ?? 0);
    }
  }
  return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null;
}
