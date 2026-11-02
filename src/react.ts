/** JSX types for React 19, which passes props and events to custom elements natively. */
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type {} from "./index.js";

type OwnProps<Element> = Partial<Omit<Element, keyof HTMLElement>>;
type ElementProps<Element> = OwnProps<Element> &
  Omit<DetailedHTMLProps<HTMLAttributes<Element>, Element>, keyof OwnProps<Element>> & { class?: string };

type HtmlPlusElements = {
  [Tag in keyof HTMLElementTagNameMap as Tag extends `h6-${string}` ? Tag : never]: ElementProps<
    HTMLElementTagNameMap[Tag]
  >;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends HtmlPlusElements {}
  }
}
