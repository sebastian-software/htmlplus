/** Semantic values resolve at the consuming element, preserving nested theme scopes.
 * Public --hp-* overrides take precedence over the optional shadcn bridge.
 */
const defaults = {
  "background": "#ffffff",
  "foreground": "#171717",
  "popover": "#ffffff",
  "popover-foreground": "#171717",
  "primary": "#171717",
  "primary-foreground": "#fafafa",
  "secondary": "#f5f5f5",
  "secondary-foreground": "#262626",
  "muted": "#f5f5f5",
  "muted-foreground": "#737373",
  "accent": "#f5f5f5",
  "accent-foreground": "#171717",
  "destructive": "#b91c1c",
  "border": "#d4d4d4",
  "input": "#d4d4d4",
  "ring": "#737373",
  "radius": ".625rem",
} as const;

export function theme(token: keyof typeof defaults): string {
  return `var(--hp-${token}, var(--_hp-shadcn-${token}, ${defaults[token]}))`;
}

const radiusScale = { sm: .6, md: .8, lg: 1, xl: 1.4, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 } as const;

/** Derive at use, rather than freezing a parent's computed radius in an inherited alias. */
export function radius(size: keyof typeof radiusScale): string {
  return `var(--hp-radius-${size}, calc(${theme("radius")} * ${radiusScale[size]}))`;
}

/** Surface depth resolves at use; color-scheme follows explicit, nested theme scopes. */
const surfaceShadows = {
  raised: "inset 0 1px 0 light-dark(rgb(255 255 255 / .9), rgb(255 255 255 / .12)), inset 0 -1px 0 light-dark(rgb(0 0 0 / .1), rgb(0 0 0 / .3)), inset 0 -6px 8px -6px light-dark(rgb(0 0 0 / .14), rgb(255 255 255 / .06)), 0 1px 2px light-dark(rgb(0 0 0 / .08), rgb(0 0 0 / .25))",
  pressed: "inset 0 1px 3px light-dark(rgb(0 0 0 / .18), rgb(0 0 0 / .45)), inset 0 -1px 0 light-dark(rgb(255 255 255 / .3), rgb(255 255 255 / .08))",
  inset: "inset 0 1px 3px light-dark(rgb(0 0 0 / .1), rgb(0 0 0 / .4)), 0 1px 0 light-dark(rgb(255 255 255 / .8), rgb(255 255 255 / .04))",
  thumb: "inset 0 1px 0 rgb(255 255 255 / .65), inset 0 -2px 3px rgb(0 0 0 / .08), 0 1px 3px rgb(0 0 0 / .2)",
  popover: "inset 0 1px 0 light-dark(rgb(255 255 255 / .8), rgb(255 255 255 / .06)), 0 8px 24px -6px light-dark(rgb(0 0 0 / .18), rgb(0 0 0 / .5)), 0 2px 6px light-dark(rgb(0 0 0 / .08), rgb(0 0 0 / .3))",
} as const;

export function surfaceShadow(role: keyof typeof surfaceShadows): string {
  return `var(--hp-shadow-${role}, ${surfaceShadows[role]})`;
}
