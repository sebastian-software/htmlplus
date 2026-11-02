export interface OptionChoice {
  value: string;
  label: string;
  description: string;
  disabled: boolean;
}

/** Direct child options follow native <option> defaults; the first duplicate identifier wins. */
export function readOptionChoices(host: Element): OptionChoice[] {
  const seen = new Set<string>();
  return Array.from(host.children).flatMap((option) => {
    if (!(option instanceof HTMLOptionElement) || !option.value || seen.has(option.value)) return [];
    seen.add(option.value);
    return [
      {
        value: option.value,
        label: option.label || option.value,
        description: option.dataset.description ?? "",
        disabled: option.disabled,
      },
    ];
  });
}

/** A stored selection only counts while its option is present and enabled, and returns with it. */
export function enabledChoice<Choice extends OptionChoice>(
  choices: readonly Choice[],
  value: string,
): Choice | undefined {
  return choices.find((choice) => choice.value === value && !choice.disabled);
}
