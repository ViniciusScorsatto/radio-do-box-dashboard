// Preparation is isolated and time-bounded; it never writes the local current-job files.
import {
  prepareF1Job,
  loadF1SourceEvents,
  loadF1Editorial,
  f1SoundtrackPresets,
} from "../lib/f1-system.mjs";
export const templates = [
  "source-results",
  "source-driver-standings",
  "source-constructor-standings",
  "editorial",
];
const domains = {
  f1: "www.formula1.com",
  f2: "www.fiaformula2.com",
  f3: "www.fiaformula3.com",
  "f1-academy": "www.f1academy.com",
  indycar: "www.indycar.com",
  "stock-pro": "velocigroup.com.br",
  "stock-light": "velocigroup.com.br",
};
const standingsOnly = new Set(["indycar", "stock-pro", "stock-light"]);
export function validateInput(body) {
  const season = Number(body.season);
  const category = body.category || "f1";
  if (
    !Object.hasOwn(domains, category) ||
    !Number.isInteger(season) ||
    season < 1950 ||
    season > 2100
  )
    throw new Error("invalid_selection");
  return { season, category };
}
function sourceUrl(value, category) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== domains[category] ||
    url.port ||
    url.username ||
    url.password
  )
    throw new Error("invalid_source_url");
  return url.href;
}
export async function prepare(body) {
  const { season, category } = validateInput(body);
  if (!templates.includes(body.template)) throw new Error("invalid_template");
  if (
    standingsOnly.has(category) &&
    body.template !== "source-driver-standings"
  )
    throw new Error("category_standings_only");
  if (body.template === "source-constructor-standings" && category !== "f1")
    throw new Error("constructors_f1_only");
  const raceType = body.raceType || "race";
  if (
    !["race", "sprint", "qualifying", "starting-grid", "practice"].includes(
      raceType,
    )
  )
    throw new Error("invalid_session");
  const soundtrackPath = body.soundtrackPath || f1SoundtrackPresets[0]?.value;
  if (!f1SoundtrackPresets.some((item) => item.value === soundtrackPath))
    throw new Error("invalid_soundtrack");
  const volume = Number(body.soundtrackVolume ?? 0.2);
  if (!Number.isFinite(volume) || volume < 0 || volume > 1)
    throw new Error("invalid_volume");
  const shortText = (v) =>
    typeof v === "string" ? v.slice(0, 160) : undefined;
  const result = await prepareF1Job({
    template: body.template,
    season,
    category,
    raceType,
    eventUrl:
      body.template === "source-results"
        ? sourceUrl(body.eventUrl, category)
        : undefined,
    articleUrl:
      body.template === "editorial"
        ? sourceUrl(body.articleUrl, category)
        : undefined,
    soundtrackPath,
    soundtrackVolume: volume,
    brandName: "Radio do Box",
    labelOverride: shortText(body.labelOverride),
    introTitle: shortText(body.introTitle),
    introSubtitle: shortText(body.introSubtitle),
    voiceoverEnabled: false,
    persist: false,
  });
  if (result.fallbackReason) throw new Error("source_unavailable");
  return {
    ...result.job,
    onlineSelection: {
      template: body.template,
      category,
      season,
      session: raceType,
    },
  };
}
if (process.send)
  process.once("message", async ({ operation, body }) => {
    try {
      const selection = validateInput(body);
      if (operation !== "prepare" && standingsOnly.has(selection.category))
        throw new Error("category_standings_only");
      const result =
        operation === "events"
          ? await loadF1SourceEvents(selection)
          : operation === "editorial"
            ? await loadF1Editorial(selection)
            : await prepare(body);
      process.send({ ok: true, result }, () => process.exit(0));
    } catch (error) {
      process.send(
        {
          ok: false,
          code: /^[a-z_]+$/.test(error.message)
            ? error.message
            : error.errorType || "source_unavailable",
        },
        () => process.exit(1),
      );
    }
  });
