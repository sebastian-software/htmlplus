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
