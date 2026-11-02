import { readFileSync, writeFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { App } from "./App";

const template = readFileSync("dist/index.html", "utf8");
writeFileSync("dist/index.html", template.replace("<!--app-->", renderToString(<App />)));
