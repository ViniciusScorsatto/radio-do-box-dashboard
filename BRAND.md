# Radio do Box - F1 Brand Guide
> Living document for the Formula 1 Remotion workflow.
> Scope: Radio do Box, Formula 1, Brazilian Portuguese, videos and PNG stills.

---

## 01 - Brand Position

Radio do Box is a Brazilian Formula 1 broadcast graphics package.

It should feel:

- fast, technical, and editorial
- premium without becoming sterile
- data-first, with clear hierarchy
- made for social video, YouTube compression, and quick scanning
- close to modern motorsport timing graphics, not generic sports cards

The visual language can reference F1 TV overlays, Sky Sports F1, ESPN motorsport graphics,
telemetry screens, timing towers, pit wall dashboards, and race control panels. It must still
read as Radio do Box, not as a copy of any official Formula 1 package.

---

## 02 - Project Scope

This repo is F1-only.

Allowed scopes:

- Formula 1 Remotion compositions
- F1 dashboard screens
- F1 generated job JSON
- F1 API-Sports helpers
- Radio do Box F1 branding assets
- Audio, voiceover, driver, team, and circuit assets under F1 paths

Do not add football templates, football configs, football dashboard routes, Foot Analysis assets,
or multi-sport abstractions unless explicitly requested.

---

## 03 - Logo System

Primary brand: Radio do Box.

Logo variants live in:

```text
public/branding/radio-do-box/
```

Use:

- `white.png` on dark blue or dark neutral themes
- `yellow.png` on warm orange/red themes
- `black.png` on light themes
- `red.png` only when the layout already has enough contrast and the mark remains legible

Placement:

- Short vertical videos: logo appears in the production bed and/or lower brand area.
- Large 16:9 stills: logo should be a first-read brand signal, not hidden as tiny nav text.
- Never place the logo over busy imagery without enough contrast or a dark backing treatment.

---

## 04 - Core Palette

Primary red:

```text
#E10600
```

Core neutrals:

```text
#FFFFFF - main text
#0F0F0F - near black
#1B1B1B - dark surface
#2A2A2A - secondary surface
#A0A0A0 - secondary text
```

Motorsport accents:

```text
#00D2BE - telemetry cyan
#A855F7 - fastest lap purple
#FF8700 - warning orange / McLaren-adjacent highlight
```

Use red as the brand signal, not as a full-screen wash. The layout should stay dark, sharp,
and readable, with accents reserved for rails, tags, dividers, selected rows, and key numbers.

---

## 05 - Team Accents

Team colors are accents only. They should help identify drivers and constructors without taking
over the full layout.

Suggested mapping:

```text
Mercedes      #00D2BE
Ferrari       #DC0000
McLaren       #FF8700
Red Bull      #1E41FF
Alpine        #FF87BC
Aston Martin  #006F62
Williams      #005AFF
Racing Bulls  #6692FF
Haas          #B6BABD
Audi/Sauber   #00E676
Cadillac      #8FD1FF
```

Use team colors for badges, thin rails, chart strokes, driver compare chips, and selected timing
rows. Keep backgrounds and panels neutral.

---

## 06 - Typography

Display typography should be condensed, heavy, and uppercase when the layout needs impact.

Preferred display stack:

```text
Arial Black, Impact, Avenir Next Condensed, sans-serif
```

Support/data typography:

```text
Inter, Arial, Helvetica, sans-serif
```

Use display type for:

- race names
- standings titles
- large positions
- section headers
- winner/podium calls

Use support type for:

- labels
- subtitles
- timing data
- small metadata
- table values

Avoid decorative typography. Data must be readable first.

---

## 07 - Layout Rules

The system should feel like broadcast graphics, not a landing page.

Core patterns:

- dark broadcast surfaces
- angular panels and timing rows
- compact chips and labels
- strong left rails or top rails
- clear separation between hero information and supporting data
- no card-inside-card layouts
- no decorative orbs, bokeh blobs, or generic gradients

Vertical short format:

- Canvas: 1080 x 1920
- Keep data inside safe margins.
- Prioritize one main story per composition.
- Use motion to reveal data, but keep final frames clean enough for screenshots.

Large still format:

- Canvas: 1920 x 1080
- Must work as a YouTube/Canva-ready still.
- First viewport signal should clearly show Formula 1 subject and Radio do Box identity.
- Leave enough breathing room for compression and platform overlays.

---

## 08 - Template System

Active F1 templates:

- `race-results` -> `F1RaceResultsShort`
- `qualifying-grid` -> `F1QualifyingGridShort`
- `race-pace` -> `F1RacePaceShort`
- `teammate-battle` -> `F1TeammateBattleShort`
- `driver-standings` -> `F1DriverStandingsShort`
- `constructor-standings` -> `F1ConstructorStandingsShort`
- `weekend-schedule` -> `F1WeekendScheduleShort`
- `circuit-insights` -> `F1CircuitInsightsShort`
- large 16:9 stills -> `F1LargeVideos`

Circuit guidance:

- Use `circuit-insights` as the single circuit guide template.
- Do not reintroduce `circuit-race-info`; it was a legacy alias and has been retired.

---

## 09 - Motion And Timing

Motion should feel like data being revealed from a live broadcast package.

Use:

- quick wipes
- staggered row entries
- short timing pulses
- restrained highlight sweeps
- final clean hold for readability

Avoid:

- slow decorative animation
- excessive bounce
- motion that makes timing tables hard to read
- effects that hide the final data state

The production bed can carry intro, soundtrack, voiceover, and brand presence, but the template
must still stand on its own as a silent visual.

---

## 10 - Language

Primary language is Brazilian Portuguese.

Use audience-friendly F1 terms:

- "Resultado da Corrida"
- "Classificação de Largada"
- "Mundial de Pilotos"
- "Mundial de Construtores"
- "Ritmo de Corrida"
- "Head-to-Head de Equipe"
- "Guia do Circuito"
- "Volta a Volta"
- "Horários do GP"

Prefer clear, compact copy. Avoid long explanatory paragraphs inside the visual itself.

---

## 11 - Data And Assets

Primary sources:

- API-Sports Formula 1 for schedules, races, rankings, drivers, teams, and circuits
- Local fallback data in `src/data/f1.ts`

Generated job JSON lives in:

```text
src/data/generated/
```

F1 assets live in:

```text
public/f1/
public/audio/f1/
public/voiceovers/f1/
```

Generated visuals should prefer local paths under `public/f1/` so Remotion renders are stable.

---

## 12 - Quality Bar

Before treating a visual change as production-ready:

- TypeScript must pass.
- Remotion bundle or a representative render must pass.
- Text must not overlap at mobile/vertical or 16:9 sizes.
- Logos and images must resolve from `public/`.
- Team accents must not dominate the entire composition.
- The final frame must be readable as a still.
- The result must match Radio do Box/F1, not Foot Analysis or generic football templates.
