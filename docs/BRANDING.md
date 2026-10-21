# mnemo brand

The product display name is **mnemo**, lowercase. The identity uses the crimson
hexagon and coral ribbon from the designer master in `src/assets/logo.svg`.

## Palette

| Token          | Colour    | Purpose                                       |
| -------------- | --------- | --------------------------------------------- |
| Primary        | `#C81038` | Buttons, links, focus and selected navigation |
| Gradient start | `#DF103C` | Crimson highlight                             |
| Gradient end   | `#BB0730` | Deep crimson                                  |
| Burgundy       | `#790821` | Mobile gradient depth                         |
| Coral          | `#FB7185` | Dark-mode accent and agent identity           |
| Ink            | `#29282E` | Wordmark on light surfaces                    |

Success, warning and error colours retain their semantic roles.

## Assets

Run `python3 scripts/generate-brand-assets.py` with Pillow and CairoSVG installed.
The SVG master produces PNG, ICO and ICNS launcher icons, the macOS tray template,
Icon Composer artwork, mobile splash/launcher/favicon assets, and the vector
rendering blocks inside both iOS extensions.

ArchivEye uses `src/assets/logo-ae.svg` in integration UI; mobile loads
`mnemo-mobile/assets/logo-ae.png` generated from the same file.

## Identifiers

| Surface | Value |
| ------- | ----- |
| Desktop `appId` | `com.pura.mnemo` |
| Mobile iOS / Android | `com.pura.mnemo` (dev: `com.pura.mnemo.dev`) |
| URL scheme | `mnemo` (`mnemo-dev` in development) |
| Linux desktop entry | `mnemo.desktop` / `mnemo` executable |
| npm package (desktop) | `mnemo` |
| npm package (mobile) | `mnemo-mobile` |
| Policy / API headers | `x-mnemo-*` |
| Hosted Pura LLM cloud mode (when enabled) | provider id `pura` |

On-disk model and sidecar caches: `~/.cache/mnemo` (Windows: `%ProgramData%/Mnemo/cache`).
Override with `MNEMO_CACHE_ROOT`.

## Widget and BYOK setup

The floating dictation widget and assistant header use `logo-mono.svg` through
`MnemoMonoMark`. Fresh desktop profiles start at permissions, then shortcut and
provider setup, without a login screen. BYOK and local models are the primary
setup paths; account, billing, and subscription UI are hidden
(`src/config/mnemoProduct.ts`, `mnemo-mobile/src/config/mnemoProduct.ts`).

Mobile skips paywall and account gating; ArchivEye integration is the knowledge
surface for standalone mnemo.
