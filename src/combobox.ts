import * as combobox from "@zag-js/combobox";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { HPlusChoice } from "./choice.js";
import type { Choice, ChoiceApi, ChoiceCollection, ChoiceProps } from "./choice.js";
import type { InteractionMachine } from "./zag-dom.js";

export class HPlusCombobox extends HPlusChoice<combobox.Service> {
  constructor() {
    super(true);
  }
  protected override get upgradedProperties(): readonly string[] {
    return ["value", "query"];
  }
  get query(): string {
    return this.queryText;
  }
  set query(value: string) {
    this.queryText = value;
  }
  protected createMachine(props: ChoiceProps): InteractionMachine<combobox.Service, ChoiceProps> {
    return new VanillaMachine(combobox.machine, {
      ...props,
      selectionBehavior: "preserve",
      inputBehavior: "none",
      allowCustomValue: false,
      // The visible empty state already announces itself, so Zag only announces the count.
      translations: { noResults: "", resultsCount: (count) => (count === 1 ? "1 option" : `${count} options`) },
    } as combobox.Props);
  }
  protected connectMachine(service: combobox.Service): ChoiceApi {
    return combobox.connect(service, normalizeProps);
  }
  protected createCollection(items: Choice[]): ChoiceCollection {
    return combobox.collection({ items });
  }
  protected override sendQuery(service: combobox.Service, query: string): void {
    service.send({ type: "INPUT.CHANGE", value: query, src: "input-change" });
  }
}
