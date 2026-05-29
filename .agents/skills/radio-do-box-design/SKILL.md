---
name: radio-do-box-design
description: >
  F1-only design system and workflow for Radio do Box Remotion videos and PNG stills.
  Use this skill whenever creating, redesigning, reviewing, or rendering Formula 1 visual
  content in this repository, including race results, qualifying grids, standings, schedules,
  circuit cards, dashboard still previews, and any broadcast-style F1
  layout. This skill is intentionally isolated from all Foot Analysis football templates.
---

# Rádio do Box — Official F1 Broadcast Design System

Use this skill ONLY for Formula 1 visual systems, Remotion compositions, generated PNG stills,
dashboard layouts, and broadcast-style graphics related to Rádio do Box.

This skill defines:

* brand direction
* color system
* typography
* spacing
* component patterns
* broadcast layout rules
* rendering workflows
* safe-area standards
* visual hierarchy
* F1-specific UI behavior

This is NOT a football skill.

---

# Visual Reference

Primary reference board:

```text
references/radio-do-box-visual-reference.png
```

Use this image as the compact visual north star for Rádio do Box F1 work. It demonstrates:

* the official dark broadcast surface treatment
* red as the primary brand signal, not a full-screen wash
* white condensed uppercase titles with strong contrast
* Inter-style support typography for data and labels
* angular timing rows, badges, tags, dividers, and telemetry strips
* race result, driver standings, and constructor standings example layouts
* safe spacing for 16:9 PNG stills intended for Canva/video assembly

When refining F1 stills or Remotion compositions, compare against this board before changing
the visual system. The output should feel like a continuation of this package, not a new brand.

---

# Brand Identity

Rádio do Box should feel like:

* modern motorsport broadcasting
* aggressive but readable
* technical and fast
* dark and premium
* editorial but data-first
* optimized for YouTube compression
* optimized for motion graphics
* optimized for Remotion still rendering

The visual language should combine:

* F1 TV overlays
* Sky Sports F1
* ESPN motorsport graphics
* modern telemetry dashboards
* racing timing systems

But adapted into a unique Rádio do Box identity.

Core emotional pillars:

* speed
* tension
* analysis
* urgency
* opinion
* technical authority

---

# Isolation Rules

Touch ONLY F1-scoped files unless explicitly requested otherwise.

Safe scopes include:

* `src/compositions/F1*.tsx`
* `src/components/F1*.tsx`
* `dashboard/f1/`
* `dashboard/f1-large-videos/`
* `config/f1/`
* `public/f1/`
* `public/branding/radio-do-box/`

Never modify:

* football compositions
* football dashboards
* Foot Analysis configs
* football templates
* football generated JSON
* football design systems

Do not merge F1 visual logic into football abstractions.

---

# Brand Colors

## Core Palette

Primary Red:

```ts
#E10600
```

Pure White:

```ts
#FFFFFF
```

Near Black:

```ts
#0F0F0F
```

Dark Surface:

```ts
#1B1B1B
```

Secondary Surface:

```ts
#2A2A2A
```

Secondary Text:

```ts
#A0A0A0
```

Telemetry Cyan:

```ts
#00D2BE
```

Fastest Lap Purple:

```ts
#A855F7
```

Warning Orange:

```ts
#FF8700
```

---

# Team Accent System

Use team accents carefully.

The layout itself must remain neutral.
Teams provide accents only.

Example:

```ts
export const TEAM_COLORS = {
  Mercedes: "#00D2BE",
  Ferrari: "#DC0000",
  McLaren: "#FF8700",
  RedBull: "#1E41FF",
  Alpine: "#FF87BC",
  AstonMartin: "#006F62",
  Williams: "#005AFF",
  RB: "#6692FF",
  Haas: "#B6BABD",
  Sauber: "#00E676",
};
```

Never allow team colors to dominate the full layout.

---

# Typography System

## Display Typography

Use condensed heavy typography.

Preferred stack:

```ts
"Arial Black",
"Impact",
"Avenir Next Condensed",
sans-serif
```

Use for:

* titles
* driver names
* standings
* race labels
* section headers
* positions

Rules:

* uppercase preferred
* high weight
* aggressive tracking control
* large hierarchy contrast

---

## Body/Data Typography

Preferred stack:

```ts
"Avenir Next",
"Segoe UI",
sans-serif
```

Use for:

* metadata
* timing
* telemetry
* subtitles
* secondary labels

---

# Typography Rules

* Points/timing columns must always be right-aligned.
* Driver names should dominate visually.
* Team names should never overpower drivers.
* Timing/status should always align consistently.
* Avoid centered tables.
* Never allow unreadable compressed typography.
* Prioritize readability over density.

Minimum practical sizes:

* 9:16 video primary text: 18px+
* 16:9 still primary text: 20px+
* metadata: never below 12px

---

# Spacing System

Use an 8px base system.

```ts
4
8
16
24
32
40
48
64
80
96
128
```

Rules:

* consistent spacing beats decorative complexity
* never crowd standings rows
* preserve breathing room around hero elements

---

# Safe Areas

Critical for YouTube and Shorts.

Minimum safe margins:

* Horizontal: 80px
* Vertical: 60px

Nothing important should touch edges.

Especially important for:

* driver names
* timing
* standings positions
* sponsor areas

---

# Visual Language

Rádio do Box visuals should use:

* angular cuts
* thin separators
* timing rails
* subtle gradients
* layered dark surfaces
* broadcast panels
* technical overlays
* restrained glow effects

Avoid:

* soft rounded app UI
* pastel palettes
* oversized blur effects
* floating disconnected elements
* generic SaaS visuals
* atmospheric-only backgrounds

Everything should feel:

* functional
* technical
* race-oriented

---

# Layout Principles

## Data First

Always prioritize:

1. headline
2. key result
3. standings
4. metadata

Never let decoration overpower information.

---

# Large 16:9 Stills (1920x1080)

Primary format for long-form YouTube support graphics.

Recommended structure:

* left feature panel
* right standings/classification table

OR

* hero winner section
* continuation table
* telemetry footer

Never center everything equally.

Use directional composition.

---

# Race Results Layout

Preferred composition:

* top 3 feature
* continuation standings table
* far-right timing/gap column

Include:

* driver portrait
* team accent
* finishing status
* optional fastest lap

The classification table must remain scan-friendly.

---

# Driver Standings Layout

Preferred composition:

* championship leader feature card
* standings table starting from P2
* points emphasized heavily

Optional:

* wins
* delta
* gap to leader

Never overpower points.

---

# Constructor Standings Layout

Preferred composition:

* leading constructor feature
* full standings table
* minimal driver imagery

Focus:

* team colors
* points
* clean alignment

---

# Component System

Preferred reusable components:

```text
/components/f1/
```

Suggested primitives:

* Header
* SectionTitle
* TableRow
* DriverRow
* TeamBadge
* PositionBadge
* TimingCell
* TelemetryStrip
* Divider
* GradientPanel
* StatChip

Reuse existing components where possible.

Avoid creating duplicated abstractions.

---

# Background System

Preferred backgrounds:

* graphite gradients
* dark textured panels
* subtle carbon fiber
* low-opacity racing lines
* telemetry-inspired overlays

Never use:

* noisy photo backgrounds
* random bokeh
* over-detailed patterns

Backgrounds must support readability first.

---

# Motion Rules

Even for still-focused workflows, designs should feel motion-capable.

Layouts should support future:

* Remotion animation
* wipes
* timing reveals
* position transitions
* telemetry sweeps

Avoid static poster compositions.

Think like a broadcast graphics package.

---

# Rendering Workflow

Preferred workflow:

```text
API
↓
Normalizer
↓
Internal JSON schema
↓
Remotion composition
↓
PNG render
↓
Canva assembly
↓
Final export
```

Never:

```text
API → presentation/slides → export
```

---

# Data Architecture Rules

Do NOT consume raw API responses directly inside visual components.

Always normalize.

BAD:

```ts
api.response[0].driver.name
```

GOOD:

```ts
{
  driverName: "Antonelli",
  teamName: "Mercedes",
  points: 186
}
```

Visual layers should never know API structure.

---

# Workflow Rules

Before editing:

* check `git diff --name-only`
* confirm edits are F1-only

During editing:

* prefer F1-local helpers/components
* avoid football abstractions
* preserve render determinism

After editing:

* run `npx tsc --noEmit`
* render affected compositions
* inspect PNG output visually
* verify spacing and safe areas manually

Do not trust TypeScript alone for layout validation.

---

# Final Philosophy

Rádio do Box graphics are not generic social media posts.

They are:

* broadcast graphics
* race overlays
* standings systems
* technical storytelling tools

Prioritize:

1. readability
2. hierarchy
3. consistency
4. broadcast feel
5. rendering stability
6. scalable automation

The system should feel like a professional motorsport broadcast package adapted for modern
YouTube-native F1 content.
