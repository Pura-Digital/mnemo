// Liquid-glass capsule surface (pairs with the --shadow-glass token in index.css).
// transform-gpu keeps the surface on its own compositing layer from first paint —
// without it, Chromium can flash a black first frame when backdrop-blur mounts.
export const GLASS_SURFACE =
  "bg-white/55 dark:bg-white/6 backdrop-blur-xl backdrop-saturate-150 shadow-(--shadow-glass) transform-gpu";

/** Same velature as GLASS_SURFACE without CSS blur (OS compositor provides blur). */
export const NATIVE_GLASS_SURFACE =
  "bg-white/45 dark:bg-white/4 shadow-(--shadow-glass) transform-gpu";

export function resolveGlassSurface(nativeGlass: boolean): string {
  return nativeGlass ? NATIVE_GLASS_SURFACE : GLASS_SURFACE;
}

export function resolveWindowChromeSurface(nativeGlass: boolean): string {
  return nativeGlass ? "glass-chrome-surface" : "bg-surface-window";
}

export function resolveWindowPanelSurface(nativeGlass: boolean): string {
  return nativeGlass ? "glass-panel-surface" : "bg-background";
}

/** Meeting cards and similar elevated panels over native glass. */
export const NATIVE_GLASS_CARD_SURFACE =
  "bg-white/50 dark:bg-white/6 border-border/50 dark:border-white/10 shadow-(--shadow-glass) transform-gpu";

export const GLASS_CARD_SURFACE =
  "bg-card/95 dark:bg-surface-2/95 backdrop-blur-xl border-border/70 dark:border-border-subtle/60";

export function resolveGlassCardSurface(nativeGlass: boolean): string {
  return nativeGlass ? NATIVE_GLASS_CARD_SURFACE : GLASS_CARD_SURFACE;
}
