import {Composition} from 'remotion';
import {F1CircuitInsightsComposition} from './compositions/F1CircuitInsightsComposition';
import {F1GridComposition} from './compositions/F1GridComposition';
import {F1LargeVideosComposition} from './compositions/F1LargeVideosComposition';
import {F1RacePaceComposition} from './compositions/F1RacePaceComposition';
import {F1ScheduleComposition} from './compositions/F1ScheduleComposition';
import {F1TeammateBattleComposition} from './compositions/F1TeammateBattleComposition';
import {F1ConstructorStandingsComposition, F1DriverStandingsComposition} from './compositions/F1StandingsComposition';
import currentF1JobJson from './data/generated/current-job.f1.json';
import {currentF1Jobs, sampleF1Jobs} from './data/f1';
import {baseF1Template} from './lib/f1-template-helpers';
import type {F1VideoJob} from './lib/types';

const currentF1Job = currentF1JobJson as Partial<F1VideoJob>;
const raceResultsJob = currentF1Jobs.raceResults;
const racePaceJob = currentF1Jobs.racePace;
const teammateBattleJob = currentF1Jobs.teammateBattle;
const qualifyingGridJob = currentF1Jobs.qualifyingGrid;
const driverStandingsJob = currentF1Jobs.driverStandings;
const constructorStandingsJob = currentF1Jobs.constructorStandings;
const weekendScheduleJob = currentF1Jobs.weekendSchedule;
const circuitInsightsJob = currentF1Jobs.circuitInsights;

const f1IntroOverrideByTemplate: Partial<
  Record<F1VideoJob['template'], {introTitle: string; introSubtitle: string}>
> = {
  'driver-standings': {
    introTitle: 'Mundial de Pilotos',
    introSubtitle: `Formula 1 ${driverStandingsJob.season ?? sampleF1Jobs.driverStandings.season}`,
  },
  'constructor-standings': {
    introTitle: 'Mundial de Construtores',
    introSubtitle: `Formula 1 ${
      constructorStandingsJob.season ?? sampleF1Jobs.constructorStandings.season
    }`,
  },
};

const f1MediaProps = (job: F1VideoJob, sample: F1VideoJob) => {
  const introOverride = f1IntroOverrideByTemplate[baseF1Template(job.template)];

  return {
    brandName: job.brandName ?? sample.brandName ?? 'Radio do Box',
    brandLogoPath: job.brandLogoPath ?? sample.brandLogoPath,
    soundtrackPath:
      job.soundtrackPath ?? sample.soundtrackPath ?? '/audio/f1/country-rough-everet-almond.mp3',
    soundtrackVolume: job.soundtrackVolume ?? sample.soundtrackVolume ?? 0.3,
    voiceoverPath: job.voiceoverPath ?? sample.voiceoverPath,
    introTitle: introOverride?.introTitle ?? job.introTitle ?? sample.introTitle ?? job.raceName ?? job.title,
    introSubtitle:
      introOverride?.introSubtitle ?? job.introSubtitle ?? sample.introSubtitle ?? job.subtitle,
  };
};

const raceResultsProps = {
  template: raceResultsJob.template ?? sampleF1Jobs.raceResults.template,
  title: raceResultsJob.title ?? sampleF1Jobs.raceResults.title,
  subtitle: raceResultsJob.subtitle ?? sampleF1Jobs.raceResults.subtitle,
  countryCode: raceResultsJob.countryCode ?? sampleF1Jobs.raceResults.countryCode,
  themeConfig: raceResultsJob.themeConfig ?? sampleF1Jobs.raceResults.themeConfig,
  podium: raceResultsJob.podium ?? sampleF1Jobs.raceResults.podium,
  entries: raceResultsJob.entries ?? sampleF1Jobs.raceResults.entries,
  ...f1MediaProps(raceResultsJob, sampleF1Jobs.raceResults),
  backgroundImagePath: raceResultsJob.backgroundImagePath ?? sampleF1Jobs.raceResults.backgroundImagePath,
};

const qualifyingProps = {
  template: qualifyingGridJob.template ?? sampleF1Jobs.qualifyingGrid.template,
  title: qualifyingGridJob.title ?? sampleF1Jobs.qualifyingGrid.title,
  subtitle: qualifyingGridJob.subtitle ?? sampleF1Jobs.qualifyingGrid.subtitle,
  countryCode: qualifyingGridJob.countryCode ?? sampleF1Jobs.qualifyingGrid.countryCode,
  themeConfig: qualifyingGridJob.themeConfig ?? sampleF1Jobs.qualifyingGrid.themeConfig,
  podium: qualifyingGridJob.podium ?? sampleF1Jobs.qualifyingGrid.podium,
  entries: qualifyingGridJob.entries ?? sampleF1Jobs.qualifyingGrid.entries,
  ...f1MediaProps(qualifyingGridJob, sampleF1Jobs.qualifyingGrid),
  backgroundImagePath: qualifyingGridJob.backgroundImagePath ?? sampleF1Jobs.qualifyingGrid.backgroundImagePath,
};

const racePaceProps = {
  title: racePaceJob.title ?? sampleF1Jobs.racePace.title,
  subtitle: racePaceJob.subtitle ?? sampleF1Jobs.racePace.subtitle,
  raceName: racePaceJob.raceName ?? sampleF1Jobs.racePace.raceName,
  themeConfig: racePaceJob.themeConfig ?? sampleF1Jobs.racePace.themeConfig,
  paceSummary: racePaceJob.paceSummary ?? sampleF1Jobs.racePace.paceSummary,
  entries: racePaceJob.entries ?? sampleF1Jobs.racePace.entries,
  ...f1MediaProps(racePaceJob, sampleF1Jobs.racePace),
  backgroundImagePath: racePaceJob.backgroundImagePath ?? sampleF1Jobs.racePace.backgroundImagePath,
};

const teammateBattleProps = {
  title: teammateBattleJob.title ?? sampleF1Jobs.teammateBattle.title,
  subtitle: teammateBattleJob.subtitle ?? sampleF1Jobs.teammateBattle.subtitle,
  raceName: teammateBattleJob.raceName ?? sampleF1Jobs.teammateBattle.raceName,
  teamName: teammateBattleJob.teamName ?? sampleF1Jobs.teammateBattle.teamName,
  contextSubtitle:
    teammateBattleJob.contextSubtitle ?? sampleF1Jobs.teammateBattle.contextSubtitle,
  themeConfig: teammateBattleJob.themeConfig ?? sampleF1Jobs.teammateBattle.themeConfig,
  driver1: teammateBattleJob.driver1 ?? sampleF1Jobs.teammateBattle.driver1,
  driver2: teammateBattleJob.driver2 ?? sampleF1Jobs.teammateBattle.driver2,
  qualifyingScore:
    teammateBattleJob.qualifyingScore ?? sampleF1Jobs.teammateBattle.qualifyingScore,
  raceFinishScore:
    teammateBattleJob.raceFinishScore ?? sampleF1Jobs.teammateBattle.raceFinishScore,
  championshipPoints:
    teammateBattleJob.championshipPoints ?? sampleF1Jobs.teammateBattle.championshipPoints,
  podiums:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.podiums
      : sampleF1Jobs.teammateBattle.podiums,
  wins:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.wins
      : sampleF1Jobs.teammateBattle.wins,
  bestRaceFinish:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.bestRaceFinish
      : sampleF1Jobs.teammateBattle.bestRaceFinish,
  highestGridPosition:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.highestGridPosition
      : sampleF1Jobs.teammateBattle.highestGridPosition,
  dnfCount:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.dnfCount
      : sampleF1Jobs.teammateBattle.dnfCount,
  dnsCount:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.dnsCount
      : sampleF1Jobs.teammateBattle.dnsCount,
  dsqCount:
    teammateBattleJob.template === 'teammate-battle'
      ? teammateBattleJob.dsqCount
      : sampleF1Jobs.teammateBattle.dsqCount,
  championshipLeader:
    teammateBattleJob.championshipLeader ?? sampleF1Jobs.teammateBattle.championshipLeader,
  ...f1MediaProps(teammateBattleJob, sampleF1Jobs.teammateBattle),
  backgroundImagePath:
    teammateBattleJob.backgroundImagePath ?? sampleF1Jobs.teammateBattle.backgroundImagePath,
};

const driverStandingsProps = {
  template: driverStandingsJob.template ?? sampleF1Jobs.driverStandings.template,
  title: driverStandingsJob.title ?? sampleF1Jobs.driverStandings.title,
  subtitle: driverStandingsJob.subtitle ?? sampleF1Jobs.driverStandings.subtitle,
  countryCode: driverStandingsJob.countryCode ?? sampleF1Jobs.driverStandings.countryCode,
  themeConfig: driverStandingsJob.themeConfig ?? sampleF1Jobs.driverStandings.themeConfig,
  leader: driverStandingsJob.leader ?? sampleF1Jobs.driverStandings.leader,
  entries: driverStandingsJob.entries ?? sampleF1Jobs.driverStandings.entries,
  ...f1MediaProps(driverStandingsJob, sampleF1Jobs.driverStandings),
  backgroundImagePath:
    driverStandingsJob.backgroundImagePath ?? sampleF1Jobs.driverStandings.backgroundImagePath,
};

const constructorStandingsProps = {
  template: constructorStandingsJob.template ?? sampleF1Jobs.constructorStandings.template,
  title: constructorStandingsJob.title ?? sampleF1Jobs.constructorStandings.title,
  subtitle: constructorStandingsJob.subtitle ?? sampleF1Jobs.constructorStandings.subtitle,
  countryCode: constructorStandingsJob.countryCode ?? sampleF1Jobs.constructorStandings.countryCode,
  themeConfig: constructorStandingsJob.themeConfig ?? sampleF1Jobs.constructorStandings.themeConfig,
  leader: constructorStandingsJob.leader ?? sampleF1Jobs.constructorStandings.leader,
  entries: constructorStandingsJob.entries ?? sampleF1Jobs.constructorStandings.entries,
  ...f1MediaProps(constructorStandingsJob, sampleF1Jobs.constructorStandings),
  backgroundImagePath:
    constructorStandingsJob.backgroundImagePath ??
    sampleF1Jobs.constructorStandings.backgroundImagePath,
};

const scheduleProps = {
  title: weekendScheduleJob.title ?? sampleF1Jobs.weekendSchedule.title,
  subtitle: weekendScheduleJob.subtitle ?? sampleF1Jobs.weekendSchedule.subtitle,
  themeConfig: weekendScheduleJob.themeConfig ?? sampleF1Jobs.weekendSchedule.themeConfig,
  sessions: weekendScheduleJob.sessions ?? sampleF1Jobs.weekendSchedule.sessions,
  ...f1MediaProps(weekendScheduleJob, sampleF1Jobs.weekendSchedule),
  backgroundImagePath:
    weekendScheduleJob.backgroundImagePath ?? sampleF1Jobs.weekendSchedule.backgroundImagePath,
};

const circuitInsightsProps = {
  title: circuitInsightsJob.title ?? sampleF1Jobs.circuitInsights.title,
  subtitle: circuitInsightsJob.subtitle ?? sampleF1Jobs.circuitInsights.subtitle,
  themeConfig: circuitInsightsJob.themeConfig ?? sampleF1Jobs.circuitInsights.themeConfig,
  keyPoints: circuitInsightsJob.keyPoints ?? sampleF1Jobs.circuitInsights.keyPoints,
  stats: circuitInsightsJob.stats ?? sampleF1Jobs.circuitInsights.stats,
  historicalNote: circuitInsightsJob.historicalNote ?? sampleF1Jobs.circuitInsights.historicalNote,
  trackImagePath: circuitInsightsJob.trackImagePath ?? sampleF1Jobs.circuitInsights.trackImagePath,
  ...f1MediaProps(circuitInsightsJob, sampleF1Jobs.circuitInsights),
  backgroundImagePath:
    circuitInsightsJob.backgroundImagePath ?? sampleF1Jobs.circuitInsights.backgroundImagePath,
};

const largeVideosJob =
  currentF1Job.template === 'driver-standings'
    ? driverStandingsJob
    : currentF1Job.template === 'constructor-standings'
      ? constructorStandingsJob
      : raceResultsJob;

const largeVideosProps = {
  job: largeVideosJob,
};

const F1_DURATION_IN_FRAMES = 360;
const F1_STILL_DURATION_IN_FRAMES = 30;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="F1RaceResultsShort"
        component={F1GridComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={raceResultsProps}
      />
      <Composition
        id="F1LargeVideos"
        component={F1LargeVideosComposition}
        durationInFrames={F1_STILL_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={largeVideosProps}
      />
      <Composition
        id="F1QualifyingGridShort"
        component={F1GridComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={qualifyingProps}
      />
      <Composition
        id="F1RacePaceShort"
        component={F1RacePaceComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={racePaceProps}
      />
      <Composition
        id="F1TeammateBattleShort"
        component={F1TeammateBattleComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={teammateBattleProps}
      />
      <Composition
        id="F1DriverStandingsShort"
        component={F1DriverStandingsComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={driverStandingsProps}
      />
      <Composition
        id="F1ConstructorStandingsShort"
        component={F1ConstructorStandingsComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={constructorStandingsProps}
      />
      <Composition
        id="F1WeekendScheduleShort"
        component={F1ScheduleComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={scheduleProps}
      />
      <Composition
        id="F1CircuitInsightsShort"
        component={F1CircuitInsightsComposition}
        durationInFrames={F1_DURATION_IN_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={circuitInsightsProps}
      />
    </>
  );
};
