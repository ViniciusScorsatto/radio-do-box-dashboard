---
name: api-sports-f1
description: >
  Reference skill for working with the API-Sports Formula 1 API in this Remotion project.
  Use whenever implementing, debugging, or planning F1 schedules, races, standings, teams,
  drivers, circuits, race sessions, results, rankings, timezone conversion, sprint weekends,
  or API-Sports Formula 1 normalization logic.
---

# Formula 1 API Skill For Codex

Reference skill for working with the API-Sports Formula 1 API.

This skill provides:
- available endpoints
- common response structures
- normalization guidance
- examples
- query patterns
- useful workflows

Use this skill whenever working with:
- Formula 1 schedules
- races
- standings
- teams
- drivers
- circuits
- race sessions
- results
- rankings
- timezone conversion
- sprint weekends

---

# Documentation

Official documentation:

- https://api-sports.io/documentation/formula-1/v1

Base API URL:

```txt
https://v1.formula-1.api-sports.io
```

---

# Authentication

All requests require headers:

```http
x-rapidapi-key: YOUR_API_KEY
x-rapidapi-host: v1.formula-1.api-sports.io
```

Example:

```ts
const response = await fetch(
  'https://v1.formula-1.api-sports.io/races?season=2026',
  {
    headers: {
      'x-rapidapi-key': process.env.API_SPORTS_KEY!,
      'x-rapidapi-host': 'v1.formula-1.api-sports.io',
    },
  }
);
```

---

# General Recommendations

## Normalize Responses

Do not depend directly on raw API response fields.

Create internal normalized schemas for:
- drivers
- teams
- standings
- races
- sessions
- race results

---

## Cache Strategy

Suggested cache durations:

| Resource | Suggested Cache |
|---|---|
| standings | 5 minutes |
| races | 1 hour |
| circuits | 7 days |
| teams | 7 days |
| drivers | 7 days |

---

## Timezones

Most API dates are UTC.

Always convert dates into the desired timezone before display.

Example:

```ts
const localDate = dayjs.utc(date).tz('Pacific/Auckland');
```

---

# Main Endpoints

## Seasons

### Get all available seasons

```http
GET /seasons
```

Example:

```txt
/seasons
```

Typical use cases:
- validating seasons
- determining available historical data
- selecting current season dynamically

---

## Races

### Get races by season

```http
GET /races?season=2026
```

Returns:
- race calendar
- rounds
- dates
- competition
- circuit
- country
- session info

Useful for:
- full season calendars
- race week data
- detecting sprint weekends

### Get next race

```http
GET /races?next=1
```

Useful for:
- upcoming event detection
- schedule automation
- countdowns

### Get race by ID

```http
GET /races?id=123
```

Useful for:
- detailed race lookup
- linking sessions/results

### Sprint Weekend Detection

Sprint weekends may appear as additional session types.

Example logic:

```ts
const sprintWeekend = sessions.some((session) => session.type === 'Sprint');
```

---

## Rankings

### Driver standings

```http
GET /rankings/drivers?season=2026
```

Returns:
- positions
- points
- wins
- driver/team references

Useful for:
- championship standings
- points gap analysis
- title fight tracking

### Constructor standings

```http
GET /rankings/teams?season=2026
```

Returns:
- constructor positions
- points
- wins

Useful for:
- constructor championship tracking
- team comparison

---

## Drivers

### Get all drivers

```http
GET /drivers?season=2026
```

Returns:
- driver IDs
- names
- nationalities
- teams
- driver metadata

Useful for:
- profile pages
- standings joins
- overlays
- filtering by season

### Get driver by ID

```http
GET /drivers?id=123
```

Useful for:
- detailed driver lookup
- historical references

---

## Teams

### Get all teams

```http
GET /teams?season=2026
```

Returns:
- team IDs
- names
- logos
- nationality

Useful for:
- constructor standings
- branding
- overlays

### Get team by ID

```http
GET /teams?id=12
```

Useful for:
- detailed team lookup
- team-specific views

---

## Circuits

### Get circuits

```http
GET /circuits
```

Returns:
- circuit names
- countries
- cities
- lengths
- metadata

Useful for:
- track previews
- location-based displays
- weather integration

### Get circuit by ID

```http
GET /circuits?id=7
```

Useful for:
- detailed circuit pages
- race enrichment

---

## Race Results

### Get race rankings/results

```http
GET /rankings/races?race=123
```

Returns:
- finishing order
- gaps
- laps
- status
- points

Useful for:
- post-race analysis
- podium extraction
- race recap generation

---

## Sessions

Some race/session information may be included inside races endpoints.

Useful session types:
- Practice 1
- Practice 2
- Practice 3
- Sprint
- Sprint Qualifying
- Qualifying
- Race

Recommended:
- normalize session names internally
- create a stable enum for session types

Example:

```ts
enum SessionType {
  Practice1,
  Practice2,
  Practice3,
  Sprint,
  SprintQualifying,
  Qualifying,
  Race,
}
```

---

# Recommended Internal Schemas

## Driver Standing

```ts
type DriverStanding = {
  position: number;
  driverId: number;
  driverName: string;
  teamName: string;
  points: number;
  wins: number;
};
```

## Team Standing

```ts
type TeamStanding = {
  position: number;
  teamId: number;
  teamName: string;
  points: number;
  wins: number;
};
```

## Race

```ts
type Race = {
  id: number;
  season: number;
  round: number;
  competition: string;
  circuit: string;
  country: string;
  date: string;
  timezone: string;
  sprint: boolean;
  status: 'scheduled' | 'live' | 'finished';
};
```

## Race Result

```ts
type RaceResult = {
  position: number;
  driverName: string;
  teamName: string;
  laps: number;
  gap: string;
  points: number;
  status: string;
};
```

---

# Common Query Patterns

## Current Season Standings

```http
GET /rankings/drivers?season=2026
GET /rankings/teams?season=2026
```

## Upcoming Race

```http
GET /races?next=1
```

## Full Season Calendar

```http
GET /races?season=2026
```

## Single Race Results

```http
GET /rankings/races?race=123
```

## Driver Lookup

```http
GET /drivers?id=123
```

## Team Lookup

```http
GET /teams?id=12
```

---

# Suggested Utility Functions

## Detect Sprint Weekend

```ts
function isSprintWeekend(sessions) {
  return sessions.some((session) => session.type === 'Sprint');
}
```

## Convert UTC Timezone

```ts
function convertTimezone(date, timezone) {
  return dayjs.utc(date).tz(timezone);
}
```

## Determine Race Status

```ts
function normalizeRaceStatus(status) {
  if (status === 'Finished') return 'finished';
  if (status === 'Live') return 'live';

  return 'scheduled';
}
```

---

# Important Notes

- API responses may change between seasons.
- Some endpoints may have inconsistent field naming.
- Session naming may vary.
- Always normalize responses internally.
- Some race statuses may not immediately reflect final classifications.
- Historical data coverage may vary by endpoint.
- Prefer stable internal enums/types instead of raw strings.

---

# Recommended Expansion Areas

Potential future integrations:
- weather APIs
- tire strategy data
- qualifying delta calculations
- live timing overlays
- driver momentum models
- telemetry integrations
- F2/F3/F1 Academy support
