import { hydrateRoot } from "react-dom/client";
import { App } from "./App";

const errors: string[] = [];
const report = (message: unknown) => errors.push(String(message));
Object.assign(window, { hydrationErrors: errors });
hydrateRoot(document.querySelector("#root")!, <App />, { onRecoverableError: report, onCaughtError: report });
