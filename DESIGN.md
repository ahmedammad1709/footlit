# Footlit design system: "Playbill"

Footlit is a stage: every GitHub event gets a proper entrance. The UI is a printed theatre programme, not a SaaS dashboard. Every decision below exists to keep it from drifting into the median "AI-generated" look (purple gradients, Inter, glass cards, identical rounded tiles, emoji icons).

## Research basis (what we are avoiding, and why)

Sources agree on the same tells: violet-to-indigo gradients (a Tailwind default that models copied), Inter with no pairing, three identical rounded cards with soft shadows, uniform radius and padding everywhere, thin generic line icons, glassmorphism/glow, gradient headline text, vague copy ("Build faster. Ship smarter."), and happy-path-only screens. Fixes they agree on: make the taste decisions explicitly, name tokens by function, commit to a palette with a reason, pair a display face with a readable body face, vary hierarchy, write specific copy, design empty/error states.

- https://www.mania.design/blog/spot-the-slop-a-ui-designers-guide-to-fixing-ai-defaults/
- https://www.925studios.co/blog/ai-slop-design-tells
- https://dev.to/james_anderson_h/the-purple-gradient-problem-why-ai-ui-all-looks-alike-and-how-to-fix-it-3j65

## The reason behind the palette

The product is stage lighting. So the colours are what a theatre actually has: **paper** (the printed programme), **ink** (the type on it), **tungsten** (the footlight, our one accent) and **velvet** (the curtain, our one danger colour). Nothing else. Dark mode is "house lights down": ink ground, tungsten text accents.

Tokens are named by function, never by hue:

| Token | Light ("Matinee") | Dark ("Evening") | Use |
|---|---|---|---|
| `--ground` | `#F1E8D4` | `#17120E` | page background |
| `--ground-sunk` | `#E7DCC2` | `#1F1913` | inset areas, wells |
| `--ground-raised` | `#F8F2E3` | `#272017` | popovers, raised chips |
| `--text` | `#1B1612` | `#F1E8D4` | primary text, rules |
| `--text-quiet` | `#5C5043` | `#B5A78F` | secondary text (>= 4.5:1 on ground) |
| `--rule` | `#1B1612` | `#F1E8D4` | structural lines (full strength) |
| `--rule-soft` | `#1B16122E` | `#F1E8D42E` | dotted leaders, hairlines |
| `--lit` | `#F2A81D` | `#F6B63B` | the accent: "on", selected, now showing |
| `--on-lit` | `#2B1C00` | `#2B1C00` | text on `--lit` fills |
| `--alarm` | `#B8301F` | `#E5604C` | danger moods, destructive |
| `--on-alarm` | `#FFF4E6` | `#1B0A07` | text on alarm fills |

Rules: `--lit` is a fill/indicator, never body text on paper (fails contrast). No gradients in UI chrome. The only gradient-like thing allowed is the **stepped light cone** (flat bands at stepped opacity), which is also the logo's vocabulary.

## Type: three voices, each with a job

- **League Gothic** (OFL): display. Condensed poster/wood-type feel. Uppercase, slight positive tracking. Headings, wordmark, overlay headlines. Never for paragraphs.
- **Newsreader** (OFL, variable, optical sizes): text. Warm editorial serif for descriptions, event names, copy. Italic carries the "stagehand's voice" asides.
- **DM Mono** (OFL): labels and data. Uppercase, tracked +0.08em, small. Tags, counters, timestamps, keys.

Not used, on purpose: Inter, Roboto, Arial, system-ui as a design choice, Space Grotesk, Fraunces, Playfair, any monospace "terminal" cliché.

Scale (px): 11 / 12 / 14 / 16 / 20 / 28 / 44 / 72 / 120. Display sizes are used big and sparingly so hierarchy is obvious.

## Shape, line, space

- Corners: **not uniform**. Wells and chips 2px; switches 3px; the poster/bill 0 with notched ticket edges; only avatar-like marks are round. Never a stack of identical 12px-radius cards.
- Lines: 1.5px solid ink for structure, double rule (3px gap) under headers like a printed programme, dotted leaders (`.....`) between a label and its control.
- Elevation: none. Depth comes from rules and inset wells. No drop shadows, no glow, no backdrop blur.
- Space: 4px base, but rhythm is deliberately uneven (tight within a group, generous between). Not everything is padded the same.
- Layout: asymmetric. The options page is a tall left column (wordmark + index) and a wide right column. The popup is a programme sheet, not a card grid.

## Components

- **Lever switch** (not an iOS pill): 38x20 rectangular track, 2px ink border, 3px radius, square knob; ON fills the track with `--lit` and shows "ON" in DM Mono; OFF shows the empty track.
- **Programme row**: `Event name .......... [rehearse] [lever]`, with the mood as a tiny mono tag under the name.
- **Stamp**: rotated -3deg, 1.5px border, mono caps, used for "NOW SHOWING" and "ON AIR" marks. One per screen at most.
- **Segmented control**: shared border, square cells, selected cell filled with ink and paper text.
- **Icons**: custom, drawn in-house on a 20px grid, 1.5px stroke, square caps, slightly irregular (they are stamps, not Lucide). No emoji anywhere in the UI.
- **Focus**: 2px `--lit` outline offset by 2px (visible in both modes). Every control is keyboard reachable.

## Motion

- Easing: one overshoot spring `cubic-bezier(.34,1.56,.64,1)` for things that land (letters, stamps), one standard `cubic-bezier(.2,.7,.2,1)` for everything else.
- Durations: 120ms for state changes, 240ms for reveals; the overlay uses its own timeline.
- Never identical fade-ins; stagger by 30 to 50ms.
- `prefers-reduced-motion`: overlays degrade to a still card with a fade (no movement, no particles); UI transitions drop to opacity only.

## Voice

A dry stagehand: specific, short, a little theatrical, never twee. Say what the thing does.

- "Opening night" not "Repository created successfully".
- Empty log: "Nothing has happened yet. Go push something."
- Setting help: "Footlit stays quiet for an hour after you press Mute."
- No "Get started", "Supercharge", "seamless", sparkle language.

## States we must design (not just the happy path)

Empty (no events yet), muted, disabled master switch, "open GitHub to rehearse" (no GitHub tab), font failed to load (system fallbacks), storage unavailable, a detector that has never fired.

## Overlay themes

Each theme is a complete little production with its own visual language, headline copy per event, and treatment per mood (applause / farewell / alarm). A theme must: size itself from its container (works full-screen and in the options preview), respect reduced motion, finish and clean up within about 4 seconds, and never block the page (`pointer-events: none`).

- **Marquee** (default): velvet, bulbs, spotlight cone in stepped bands, paper confetti, ticket stub with the performance number.
- **Pixel**: 8-bit "STAGE CLEAR / GAME OVER" with blocky particles (Press Start 2P).
- Later: Web Crawler, Matrix.

---

## Placement and findability (popup vs settings)

Research (general UX guidance; the extension-specific sources were thin): the popup is for quick, frequent, per-page actions and should have one obvious purpose; the options page is the complete home for every setting, grouped by feature, with the common ones first and rarely needed ones behind progressive disclosure; search only pays off when many options are hidden deep; a theme choice benefits from a live preview and a sensible default; keyboard navigation and visible focus are mandatory.

How Footlit applies it:

- **Popup (372px) = things you do while browsing:** master on/off, switch theme (tile grid), per-event on/off with Rehearse, quiet 1h, link to all settings. Notices (out-of-date tab, quiet mode) appear at the top, above the controls, with a one-click fix.
- **Settings = everything, ordered by how often you will touch it:** 01 Themes (the reason you came), 02 Events, 03 Preferences, 04 Activity and help. Section names are plain words with the playbill name as a subtitle, so the personality never costs clarity.
- **No settings search:** there are about fifteen settings. A sticky sidebar that highlights the section you are reading is faster than a search box at this size. Revisit if settings grow past roughly thirty.
- **Progressive disclosure:** troubleshooting and the privacy answer live in native `<details>` blocks; per-event theme override is one dropdown per row defaulting to "Default (Marquee)", so nobody has to configure it.
- **Feedback:** every change saves immediately and the sidebar says "Saved". Destructive reset asks for confirmation.
- **First run:** a three-step welcome on the settings page (pick a theme, rehearse an event, open GitHub), dismissable and never shown again.
- **Errors say what to do:** a stale GitHub tab produces a red notice with a Reload button instead of a silently dead Rehearse button.

### Live preview dock (added after user testing)

Problem found in use: the preview stage sat above the theme cards, so on a laptop-height screen you had to scroll down to click, then scroll up to watch. Fix: the preview is not part of the page flow any more. It is a persistent dock that stays on screen while you scroll, so every action that changes a show (picking a theme, Rehearse on an event, show length, reduced motion, mood) plays where you are already looking.

- 1340px and wider: three columns (sidebar, settings, sticky preview). The sidebar tightens below 1600px so 1366x768 laptops still fit all three.
- Narrower: the dock floats bottom-right with a Hide button, and the page reserves space beneath it.
- A caption under the stage always says what is playing (theme / event / mood).
