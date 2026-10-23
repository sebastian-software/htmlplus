import { createIcon } from "../src/icons.js";
import type { IconName } from "../src/icons.js";

for (const placeholder of document.querySelectorAll<HTMLElement>("[data-icon]")) {
  placeholder.replaceChildren(createIcon(placeholder.dataset.icon as IconName));
}
