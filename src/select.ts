import * as select from "@zag-js/select";
import { VanillaMachine, normalizeProps } from "@zag-js/vanilla";
import { H6Choice } from "./choice.js";
import type { Choice, ChoiceApi, ChoiceCollection, ChoiceProps } from "./choice.js";
import type { InteractionMachine } from "./zag-dom.js";

export class H6Select extends H6Choice<select.Service> {
  constructor() {
    super(false);
  }
  protected createMachine(props: ChoiceProps): InteractionMachine<select.Service, ChoiceProps> {
    return new VanillaMachine(select.machine, props as select.Props);
  }
  protected connectMachine(service: select.Service): ChoiceApi {
    return select.connect(service, normalizeProps);
  }
  protected createCollection(items: Choice[]): ChoiceCollection {
    return select.collection({ items });
  }
}
