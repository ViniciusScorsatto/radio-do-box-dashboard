import {prepareF1Job} from './lib/f1-system.mjs';

const template = process.env.F1_TEMPLATE ?? 'race-results';
const apiKey = process.env.F1_API_KEY;
const apiHost = process.env.F1_API_HOST ?? 'v1.formula-1.api-sports.io';
const competitionId = Number(process.env.F1_COMPETITION_ID ?? '1');
const season = Number(process.env.F1_SEASON ?? '2026');
const raceId = process.env.F1_RACE_ID ? Number(process.env.F1_RACE_ID) : undefined;
const raceType = process.env.F1_RACE_TYPE ?? '';
const brandName = process.env.F1_BRAND_NAME ?? 'Radio do Box';
const competitionName = process.env.F1_COMPETITION_NAME ?? 'Formula 1';
const labelOverride = process.env.F1_LABEL_OVERRIDE ?? '';
const outputName = process.env.F1_OUTPUT_NAME ?? '';

const result = await prepareF1Job({
  template,
  apiKey,
  apiHost,
  competitionId,
  season,
  raceType,
  raceId,
  brandName,
  competitionName,
  labelOverride,
  outputName,
});

console.log(`Prepared ${result.job.template} job for ${result.job.competitionName}`);
console.log(`Current job: ${result.files.currentJobFile}`);
console.log(result.message);
