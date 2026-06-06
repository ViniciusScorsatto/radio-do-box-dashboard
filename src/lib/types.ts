export type Sport = 'f1';

export type F1VideoTemplate =
  | 'race-results'
  | 'race-pace'
  | 'teammate-battle'
  | 'circuit-insights'
  | 'qualifying-grid'
  | 'driver-standings'
  | 'constructor-standings'
  | 'weekend-schedule';
export type VideoTemplate = F1VideoTemplate;

export type TeamBadge = {
  label: string;
  logoPath?: string;
  imagePath?: string;
  accentColor?: string;
  sublabel?: string;
};

export type F1ThemeVariant = 'blue' | 'orange' | 'light';

export type F1ThemeConfig = {
  variant: F1ThemeVariant;
  background: string;
  accent: string;
  secondaryAccent: string;
  panelFill: string;
  panelStroke: string;
  text: string;
  mutedText: string;
};

export type F1CompetitionConfig = {
  competitionId: number;
  label: string;
  shortLabel: string;
  countryCode: string;
};

export type F1TemplateConfig = {
  template: F1VideoTemplate;
  label: string;
  compositionId:
    | 'F1RaceResultsShort'
    | 'F1RacePaceShort'
    | 'F1TeammateBattleShort'
    | 'F1CircuitInsightsShort'
    | 'F1QualifyingGridShort'
    | 'F1DriverStandingsShort'
    | 'F1ConstructorStandingsShort'
    | 'F1WeekendScheduleShort';
  themeVariant: F1ThemeVariant;
  durationInFrames: number;
  headlinePrefix?: string;
};


type BaseVideoJob = {
  sport: 'f1';
  brandName: string;
  brandLogoPath?: string;
  backgroundImagePath?: string;
  soundtrackPath?: string;
  soundtrackLabel?: string;
  soundtrackVolume?: number;
  outputName: string;
  durationInFrames: number;
  dataSource?: 'api' | 'sample';
  warnings?: string[];
};

export type F1PodiumEntry = {
  position: number;
  name: string;
  team: string;
  badge: TeamBadge;
  value?: string;
  secondaryValue?: string;
  stat?: string;
  accentColor?: string;
};

export type F1RankingEntry = {
  position: number;
  name: string;
  team?: string;
  badge: TeamBadge;
  value?: string;
  secondaryValue?: string;
  driverNumber?: string;
  accentColor?: string;
};

export type F1ScheduleEntry = {
  dayLabel: string;
  title: string;
  timeLabel: string;
  subtitle?: string;
};

export type F1CircuitInsightsStat = {
  label: string;
  value: string;
};

type F1BaseVideoJob = BaseVideoJob & {
  sport: 'f1';
  template: F1VideoTemplate;
  compositionId: F1TemplateConfig['compositionId'];
  season: number;
  competitionId: number;
  competitionName: string;
  competitionConfig?: F1CompetitionConfig;
  themeConfig: F1ThemeConfig;
  templateConfig: F1TemplateConfig;
  title: string;
  subtitle: string;
  raceType?: string;
  raceId?: number;
  raceName?: string;
  countryCode?: string;
  circuitName?: string;
  introTitle?: string;
  introSubtitle?: string;
  voiceoverText?: string;
  voiceoverEnabled?: boolean;
  voiceoverPath?: string;
  voiceoverLabel?: string;
};

export type F1RaceResultsJob = F1BaseVideoJob & {
  template: 'race-results';
  compositionId: 'F1RaceResultsShort';
  podium: F1PodiumEntry[];
  entries: F1RankingEntry[];
  fastestLap?: {
    name: string;
    team?: string;
    value: string;
    badge?: TeamBadge;
    accentColor?: string;
  };
};

export type F1RacePaceJob = F1BaseVideoJob & {
  template: 'race-pace';
  compositionId: 'F1RacePaceShort';
  sessionCode: 'R';
  paceSummary: string;
  entries: F1RankingEntry[];
};

export type F1TeammateBattleScoreBlock = {
  driver1: number;
  driver2: number;
  label: string;
  driver1Display?: string;
  driver2Display?: string;
  higherIsBetter?: boolean;
  hasData?: boolean;
};

export type F1TeammateBattlePilot = {
  code: string;
  name: string;
  team: string;
  badge: TeamBadge;
  accentColor?: string;
};

export type F1TeammateBattleDriverStats = {
  driverId: number | null;
  name: string;
  championshipPosition: number | null;
  championshipPoints: number;
  wins: number;
  podiums: number;
  poles: number;
  bestFinish: number | null;
  averageFinish: number | null;
  bestGrid: number | null;
  averageGrid: number | null;
  racesStarted: number;
  classifiedResults: number;
  dnfCount?: number;
  dnsCount?: number;
  dsqCount?: number;
};

export type F1TeammateBattleDiagnostics = {
  completedRaceCount: number;
  raceResultRaceCount: number;
  startingGridRaceCount: number;
  skippedRaceIds: number[];
  warnings: string[];
};

export type F1TeammateBattleJob = F1BaseVideoJob & {
  template: 'teammate-battle';
  compositionId: 'F1TeammateBattleShort';
  teamId: number;
  teamName: string;
  contextSubtitle?: string;
  driver1: F1TeammateBattlePilot;
  driver2: F1TeammateBattlePilot;
  qualifyingScore: F1TeammateBattleScoreBlock;
  raceFinishScore: F1TeammateBattleScoreBlock;
  championshipPoints: F1TeammateBattleScoreBlock;
  podiums?: F1TeammateBattleScoreBlock;
  wins?: F1TeammateBattleScoreBlock;
  bestRaceFinish?: F1TeammateBattleScoreBlock;
  highestGridPosition?: F1TeammateBattleScoreBlock;
  dnfCount?: F1TeammateBattleScoreBlock;
  dnsCount?: F1TeammateBattleScoreBlock;
  dsqCount?: F1TeammateBattleScoreBlock;
  driverStats?: F1TeammateBattleDriverStats[];
  leaderDriverId?: number | null;
  diagnostics?: F1TeammateBattleDiagnostics;
  championshipLeader: 'driver1' | 'driver2' | 'tie';
};

export type F1QualifyingGridJob = F1BaseVideoJob & {
  template: 'qualifying-grid';
  compositionId: 'F1QualifyingGridShort';
  podium: F1PodiumEntry[];
  entries: F1RankingEntry[];
};

export type F1DriverStandingsJob = F1BaseVideoJob & {
  template: 'driver-standings';
  compositionId: 'F1DriverStandingsShort';
  leader?: F1PodiumEntry;
  entries: F1RankingEntry[];
};

export type F1ConstructorStandingsJob = F1BaseVideoJob & {
  template: 'constructor-standings';
  compositionId: 'F1ConstructorStandingsShort';
  leader?: F1PodiumEntry;
  entries: F1RankingEntry[];
};

export type F1WeekendScheduleJob = F1BaseVideoJob & {
  template: 'weekend-schedule';
  compositionId: 'F1WeekendScheduleShort';
  sessions: F1ScheduleEntry[];
};

export type F1CircuitInsightsJob = F1BaseVideoJob & {
  template: 'circuit-insights';
  compositionId: 'F1CircuitInsightsShort';
  keyPoints: string[];
  stats: F1CircuitInsightsStat[];
  historicalNote: string;
  trackImagePath?: string;
};

export type F1VideoJob =
  | F1RaceResultsJob
  | F1RacePaceJob
  | F1TeammateBattleJob
  | F1CircuitInsightsJob
  | F1QualifyingGridJob
  | F1DriverStandingsJob
  | F1ConstructorStandingsJob
  | F1WeekendScheduleJob;

export type VideoJob = F1VideoJob;
