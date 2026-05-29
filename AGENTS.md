# AGENTS.md - Radio do Box Project Contract

This project contains only the Formula 1 / Radio do Box Remotion workflow extracted from the original multi-sport workspace.

## Scope

- Brand: Radio do Box
- Sport: Formula 1
- Primary language: Brazilian Portuguese (pt-br)
- Output: Remotion videos and PNG stills

## Primary Paths

- src/compositions/ - F1 Remotion composition entry points
- src/components/ - F1 visual primitives and production bed components
- src/data/ - F1 fallback and generated job data
- scripts/ - F1 sync, dashboard, and render orchestration
- scripts/lib/ - F1 API-Sports helpers
- config/f1/ - F1 competitions, templates, themes, and translations
- public/f1/ - F1 drivers, teams, and circuits assets
- public/audio/f1/ - F1 soundtrack assets

## Guardrail

Do not add football templates, football configs, football dashboard routes, or Foot Analysis assets here. Shared type changes should stay minimal and support F1 job JSON consumed by Remotion compositions.
