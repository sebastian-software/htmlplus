import { theme, radius, surfaceShadow } from "./theme.js";
import { nativeFieldStyles } from "./native-field-styles.js";

/** Optional styling for native elements; browser semantics remain intact. */
export const nativeStyles = `
@layer hp-native {
  h6-field { display: block; min-width: 0; }
  h6-field[hidden] { display: none; }
  ${nativeFieldStyles(false)}
  .hp-button {
    box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
    min-height: var(--hp-control-height, 2.5rem); padding: .5rem .75rem;
    border: 1px solid transparent; border-radius: ${radius("md")};
    background: ${theme("primary")}; color: ${theme("primary-foreground")};
    font-family: var(--hp-font-family, ui-sans-serif, system-ui, sans-serif); font-size: var(--hp-font-size, .875rem);
    line-height: var(--hp-line-height, 1.25rem); font-weight: 500; text-decoration: none; cursor: pointer;
    box-shadow: ${surfaceShadow("raised")};
  }
  .hp-button[data-variant=secondary] { background: ${theme("secondary")}; color: ${theme("secondary-foreground")}; border-color: ${theme("input")}; }
  .hp-button[data-variant=outline] { background: ${theme("background")}; color: ${theme("foreground")}; border-color: ${theme("input")}; }
  .hp-button[data-variant=ghost] { background: transparent; color: ${theme("foreground")}; box-shadow: none; }
  .hp-button[data-variant=destructive] { background: light-dark(${theme("destructive")}, color-mix(in srgb, ${theme("destructive")} 70%, #000)); color: white; }
  .hp-button:hover:not(:disabled):not([aria-disabled=true]) { filter: brightness(.94); text-decoration: none; }
  .hp-button[data-variant=ghost]:hover:not(:disabled) { background: ${theme("accent")}; color: ${theme("accent-foreground")}; filter: none; }
  .hp-button:active:not(:disabled) { box-shadow: ${surfaceShadow("pressed")}; }
  .hp-button:focus-visible { outline: 2px solid ${theme("ring")}; outline-offset: 3px; }
  .hp-button:disabled { opacity: .5; cursor: default; box-shadow: none; }
  .hp-button[data-size=sm] { min-height: 2rem; padding: .25rem .625rem; }
  .hp-button[data-size=lg] { min-height: 3rem; padding: .75rem 1rem; }
  .hp-button[data-size=icon] { width: var(--hp-control-height, 2.5rem); padding: .5rem; }
  .hp-button svg { width: 1rem; height: 1rem; flex: none; }
  .hp-button[aria-busy=true]::before { content: ""; width: .875rem; height: .875rem; flex: none; border: 2px solid currentColor; border-inline-end-color: transparent; border-radius: 50%; animation: hp-spin .8s linear infinite; }
  @keyframes hp-spin { to { transform: rotate(1turn); } }
  @media (prefers-reduced-motion: reduce) { .hp-button[aria-busy=true]::before { animation: none; } }
  @media (forced-colors: active) { .hp-button { box-shadow: none; border: 1px solid ButtonText; } .hp-button:disabled { color: GrayText; border-color: GrayText; } }
}
`;
