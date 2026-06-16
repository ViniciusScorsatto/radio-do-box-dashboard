import currentRaceResultsJobJson from './generated/current-job.f1.race-results.json';
import currentF1JobJson from './generated/current-job.f1.json';
import currentRacePaceJobJson from './generated/current-job.f1.race-pace.json';
import currentTeammateBattleJobJson from './generated/current-job.f1.teammate-battle.json';
import currentCircuitInsightsJobJson from './generated/current-job.f1.circuit-insights.json';
import currentQualifyingJobJson from './generated/current-job.f1.qualifying-grid.json';
import currentDriverStandingsJobJson from './generated/current-job.f1.driver-standings.json';
import currentConstructorStandingsJobJson from './generated/current-job.f1.constructor-standings.json';
import currentWeekendScheduleJobJson from './generated/current-job.f1.weekend-schedule.json';
import currentRacePredictionsJobJson from './generated/current-job.f1.race-predictions.json';
import type {
  F1CircuitInsightsJob,
  F1ConstructorStandingsJob,
  F1DriverStandingsJob,
  F1RacePaceJob,
  F1RacePredictionsJob,
  F1QualifyingGridJob,
  F1RaceResultsJob,
  F1TeammateBattleJob,
  F1VideoJob,
  F1WeekendScheduleJob,
} from '../lib/types';

const sampleRaceResultsJob: F1RaceResultsJob = {
  sport: 'f1',
  template: 'race-results',
  compositionId: 'F1RaceResultsShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'orange',
    background: 'linear-gradient(180deg, #4c120b 0%, #2a0b10 44%, #12070d 100%)',
    accent: '#ff8a3d',
    secondaryAccent: '#ffe36d',
    panelFill: 'linear-gradient(180deg, rgba(44,13,10,0.96), rgba(15,6,9,0.98))',
    panelStroke: 'rgba(255, 161, 77, 0.92)',
    text: '#fff4e5',
    mutedText: '#f6d9bb',
  },
  templateConfig: {
    template: 'race-results',
    label: 'Resultado da Corrida',
    compositionId: 'F1RaceResultsShort',
    themeVariant: 'orange',
    durationInFrames: 360,
    headlinePrefix: 'Grande Premio',
  },
  title: 'Grande Premio da Australia',
  subtitle: 'Resultado da Corrida',
  raceId: 101,
  raceName: 'GP da Australia',
  countryCode: 'AUS',
  circuitName: 'Albert Park',
  brandName: 'Radio do Box',
  outputName: 'sample-f1-race-results.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  podium: [
    {position: 1, name: 'George Russell', team: 'Mercedes', badge: {label: 'GR', accentColor: '#65e1c6'}, stat: '1:33:14.445', accentColor: '#65e1c6'},
    {position: 2, name: 'Kimi Antonelli', team: 'Mercedes', badge: {label: 'KA', accentColor: '#65e1c6'}, stat: '+1.4s', accentColor: '#65e1c6'},
    {position: 3, name: 'Charles Leclerc', team: 'Ferrari', badge: {label: 'CL', accentColor: '#ff5546'}, stat: '+3.9s', accentColor: '#ff5546'},
  ],
  entries: [
    {position: 4, name: 'Lewis Hamilton', team: 'Ferrari', badge: {label: 'LH', accentColor: '#ff5546'}, value: 'P4', secondaryValue: '+7.1s', accentColor: '#ff5546'},
    {position: 5, name: 'Lando Norris', team: 'McLaren', badge: {label: 'LN', accentColor: '#ff9a3d'}, value: 'P5', secondaryValue: '+10.6s', accentColor: '#ff9a3d'},
    {position: 6, name: 'Max Verstappen', team: 'Red Bull', badge: {label: 'MV', accentColor: '#5d74ff'}, value: 'P6', secondaryValue: '+12.0s', accentColor: '#5d74ff'},
  ],
};

const sampleQualifyingJob: F1QualifyingGridJob = {
  ...sampleRaceResultsJob,
  template: 'qualifying-grid',
  compositionId: 'F1QualifyingGridShort',
  themeConfig: {
    variant: 'blue',
    background: 'linear-gradient(180deg, #12246d 0%, #101f59 52%, #080f2f 100%)',
    accent: '#74a8ff',
    secondaryAccent: '#ffe06b',
    panelFill: 'linear-gradient(180deg, rgba(8,18,49,0.96), rgba(4,10,27,0.98))',
    panelStroke: 'rgba(141, 181, 255, 0.9)',
    text: '#f7f9ff',
    mutedText: '#d5def6',
  },
  templateConfig: {
    template: 'qualifying-grid',
    label: 'Grid de Largada',
    compositionId: 'F1QualifyingGridShort',
    themeVariant: 'blue',
    durationInFrames: 360,
    headlinePrefix: 'Grande Premio',
  },
  subtitle: 'Grid de Largada',
};

const sampleRacePaceJob: F1RacePaceJob = {
  sport: 'f1',
  template: 'race-pace',
  compositionId: 'F1RacePaceShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'blue',
    background: 'linear-gradient(180deg, #12246d 0%, #101f59 52%, #080f2f 100%)',
    accent: '#74a8ff',
    secondaryAccent: '#ffe06b',
    panelFill: 'linear-gradient(180deg, rgba(8,18,49,0.96), rgba(4,10,27,0.98))',
    panelStroke: 'rgba(141, 181, 255, 0.9)',
    text: '#f7f9ff',
    mutedText: '#d5def6',
  },
  templateConfig: {
    template: 'race-pace',
    label: 'Ritmo de Corrida',
    compositionId: 'F1RacePaceShort',
    themeVariant: 'blue',
    durationInFrames: 360,
  },
  title: 'Ritmo de Corrida',
  subtitle: 'GP da Austrália',
  raceType: 'Race',
  raceId: 101,
  raceName: 'GP da Austrália',
  countryCode: 'AUS',
  circuitName: 'Albert Park',
  brandName: 'Radio do Box',
  brandLogoPath: '/branding/radio-do-box/white.png',
  outputName: 'sample-f1-race-pace.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  sessionCode: 'R',
  paceSummary: 'Média limpa da corrida',
  entries: [
    {position: 1, name: 'George Russell', team: 'Mercedes-AMG Petronas', badge: {label: 'GR', accentColor: '#65e1c6'}, value: '1:39.157', secondaryValue: '--', driverNumber: '63', accentColor: '#65e1c6'},
    {position: 2, name: 'Kimi Antonelli', team: 'Mercedes-AMG Petronas', badge: {label: 'KA', accentColor: '#65e1c6'}, value: '1:39.182', secondaryValue: '+0.025s/volta', driverNumber: '12', accentColor: '#65e1c6'},
    {position: 3, name: 'Charles Leclerc', team: 'Scuderia Ferrari', badge: {label: 'CL', accentColor: '#ff5546'}, value: '1:39.240', secondaryValue: '+0.083s/volta', driverNumber: '16', accentColor: '#ff5546'},
    {position: 4, name: 'Lewis Hamilton', team: 'Scuderia Ferrari', badge: {label: 'LH', accentColor: '#ff5546'}, value: '1:39.286', secondaryValue: '+0.129s/volta', driverNumber: '44', accentColor: '#ff5546'},
    {position: 5, name: 'Lando Norris', team: 'McLaren Racing', badge: {label: 'LN', accentColor: '#ff9a3d'}, value: '1:39.344', secondaryValue: '+0.187s/volta', driverNumber: '4', accentColor: '#ff9a3d'},
    {position: 6, name: 'Max Verstappen', team: 'Red Bull Racing', badge: {label: 'MV', accentColor: '#5d74ff'}, value: '1:39.395', secondaryValue: '+0.238s/volta', driverNumber: '1', accentColor: '#5d74ff'},
    {position: 7, name: 'Oscar Piastri', team: 'McLaren Racing', badge: {label: 'OP', accentColor: '#ff9a3d'}, value: '1:39.412', secondaryValue: '+0.255s/volta', driverNumber: '81', accentColor: '#ff9a3d'},
    {position: 8, name: 'Pierre Gasly', team: 'Alpine F1 Team', badge: {label: 'PG', accentColor: '#ff76db'}, value: '1:39.498', secondaryValue: '+0.341s/volta', driverNumber: '10', accentColor: '#ff76db'},
    {position: 9, name: 'Oliver Bearman', team: 'Haas F1 Team', badge: {label: 'OB', accentColor: '#f1f1f1'}, value: '1:39.541', secondaryValue: '+0.384s/volta', driverNumber: '87', accentColor: '#f1f1f1'},
    {position: 10, name: 'Liam Lawson', team: 'Racing Bulls', badge: {label: 'LL', accentColor: '#7b94ff'}, value: '1:39.566', secondaryValue: '+0.409s/volta', driverNumber: '30', accentColor: '#7b94ff'},
  ],
};

const sampleTeammateBattleJob: F1TeammateBattleJob = {
  sport: 'f1',
  template: 'teammate-battle',
  compositionId: 'F1TeammateBattleShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'blue',
    background: 'linear-gradient(180deg, #12246d 0%, #101f59 52%, #080f2f 100%)',
    accent: '#74a8ff',
    secondaryAccent: '#ffe06b',
    panelFill: 'linear-gradient(180deg, rgba(8,18,49,0.96), rgba(4,10,27,0.98))',
    panelStroke: 'rgba(141, 181, 255, 0.9)',
    text: '#f7f9ff',
    mutedText: '#d5def6',
  },
  templateConfig: {
    template: 'teammate-battle',
    label: 'Head-to-Head de Equipe',
    compositionId: 'F1TeammateBattleShort',
    themeVariant: 'blue',
    durationInFrames: 360,
  },
  title: 'GP da Austrália',
  subtitle: 'Head-to-Head de Equipe',
  raceType: 'Race',
  raceId: 101,
  raceName: 'GP da Austrália',
  countryCode: 'AUS',
  circuitName: 'Albert Park',
  brandName: 'Radio do Box',
  brandLogoPath: '/branding/radio-do-box/white.png',
  outputName: 'sample-f1-head-to-head.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  teamId: 1,
  teamName: 'Mercedes-AMG Petronas',
  contextSubtitle: 'Após o GP da Austrália',
  driver1: {
    code: 'RUS',
    name: 'George Russell',
    team: 'Mercedes-AMG Petronas',
    badge: {
      label: 'GR',
      accentColor: '#65e1c6',
      imagePath: '/f1/drivers/mercedes-amg-petronas-george-russell.png',
    },
    accentColor: '#65e1c6',
  },
  driver2: {
    code: 'ANT',
    name: 'Andrea Kimi Antonelli',
    team: 'Mercedes-AMG Petronas',
    badge: {
      label: 'AK',
      accentColor: '#65e1c6',
      imagePath: '/f1/drivers/mercedes-amg-petronas-andrea-kimi-antonelli.png',
    },
    accentColor: '#65e1c6',
  },
  qualifyingScore: {
    driver1: 3,
    driver2: 1,
    label: 'Classificação (Temporada)',
  },
  raceFinishScore: {
    driver1: 2,
    driver2: 2,
    label: 'Corrida (Temporada)',
  },
  championshipPoints: {
    driver1: 51,
    driver2: 47,
    label: 'Pontos no Campeonato',
  },
  podiums: {
    driver1: 2,
    driver2: 1,
    label: 'Pódios',
    hasData: true,
  },
  wins: {
    driver1: 1,
    driver2: 0,
    label: 'Vitórias',
    hasData: true,
  },
  bestRaceFinish: {
    driver1: 1,
    driver2: 2,
    driver1Display: '1º',
    driver2Display: '2º',
    label: 'Melhor Chegada',
    higherIsBetter: false,
    hasData: true,
  },
  highestGridPosition: {
    driver1: 1,
    driver2: 3,
    driver1Display: '1º',
    driver2Display: '3º',
    label: 'Melhor Largada',
    higherIsBetter: false,
    hasData: true,
  },
  dnfCount: {
    driver1: 0,
    driver2: 0,
    label: 'DNF · Abandono',
    higherIsBetter: false,
    hasData: true,
  },
  dnsCount: {
    driver1: 0,
    driver2: 0,
    label: 'DNS · Não largou',
    higherIsBetter: false,
    hasData: true,
  },
  dsqCount: {
    driver1: 0,
    driver2: 0,
    label: 'DSQ · Desclassificado',
    higherIsBetter: false,
    hasData: true,
  },
  championshipLeader: 'driver1',
};

const sampleDriverStandingsJob: F1DriverStandingsJob = {
  sport: 'f1',
  template: 'driver-standings',
  compositionId: 'F1DriverStandingsShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'light',
    background: 'linear-gradient(180deg, #fdfdff 0%, #eef3fa 56%, #dce5f1 100%)',
    accent: '#57d6be',
    secondaryAccent: '#ffcc68',
    panelFill: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(238,243,251,0.96))',
    panelStroke: 'rgba(73, 96, 150, 0.25)',
    text: '#111931',
    mutedText: '#6b7b9d',
  },
  templateConfig: {
    template: 'driver-standings',
    label: 'Mundial de Pilotos',
    compositionId: 'F1DriverStandingsShort',
    themeVariant: 'light',
    durationInFrames: 360,
  },
  title: 'Mundial de Pilotos',
  subtitle: 'Formula 1 2026',
  countryCode: 'INT',
  brandName: 'Radio do Box',
  brandLogoPath: '/branding/radio-do-box/black.png',
  outputName: 'sample-f1-driver-standings.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  leader: {
    position: 1,
    name: 'George Russell',
    team: 'Mercedes-AMG Petronas',
    badge: {
      label: 'GR',
      accentColor: '#65e1c6',
      imagePath: '/f1/drivers/mercedes-amg-petronas-george-russell.png',
      logoPath: '/f1/teams/mercedes-amg-petronas.png',
      sublabel: 'Mercedes-AMG Petronas',
    },
    stat: '25 pts',
    accentColor: '#65e1c6',
  },
  entries: [
    {position: 1, name: 'George Russell', team: 'Mercedes-AMG Petronas', badge: {label: 'GR', accentColor: '#65e1c6', imagePath: '/f1/drivers/mercedes-amg-petronas-george-russell.png', logoPath: '/f1/teams/mercedes-amg-petronas.png', sublabel: 'Mercedes-AMG Petronas'}, value: '25', secondaryValue: '1 vit', driverNumber: '63', accentColor: '#65e1c6'},
    {position: 2, name: 'Kimi Antonelli', team: 'Mercedes-AMG Petronas', badge: {label: 'KA', accentColor: '#65e1c6', imagePath: '/f1/drivers/mercedes-amg-petronas-andrea-kimi-antonelli.png', logoPath: '/f1/teams/mercedes-amg-petronas.png', sublabel: 'Mercedes-AMG Petronas'}, value: '18', secondaryValue: '+7', driverNumber: '12', accentColor: '#65e1c6'},
    {position: 3, name: 'Charles Leclerc', team: 'Scuderia Ferrari', badge: {label: 'CL', accentColor: '#ff5546', imagePath: '/f1/drivers/scuderia-ferrari-charles-leclerc.png', logoPath: '/f1/teams/scuderia-ferrari.png', sublabel: 'Scuderia Ferrari'}, value: '15', secondaryValue: '+10', driverNumber: '16', accentColor: '#ff5546'},
    {position: 4, name: 'Lewis Hamilton', team: 'Scuderia Ferrari', badge: {label: 'LH', accentColor: '#ff5546', imagePath: '/f1/drivers/scuderia-ferrari-lewis-hamilton.png', logoPath: '/f1/teams/scuderia-ferrari.png', sublabel: 'Scuderia Ferrari'}, value: '12', secondaryValue: '+13', driverNumber: '44', accentColor: '#ff5546'},
    {position: 5, name: 'Lando Norris', team: 'McLaren Racing', badge: {label: 'LN', accentColor: '#ff9a3d', imagePath: '/f1/drivers/mclaren-racing-lando-norris.png', logoPath: '/f1/teams/mclaren-racing.png', sublabel: 'McLaren Racing'}, value: '10', secondaryValue: '+15', driverNumber: '4', accentColor: '#ff9a3d'},
    {position: 6, name: 'Max Verstappen', team: 'Red Bull Racing', badge: {label: 'MV', accentColor: '#5d74ff', imagePath: '/f1/drivers/red-bull-racing-max-verstappen.png', logoPath: '/f1/teams/red-bull-racing.png', sublabel: 'Red Bull Racing'}, value: '8', secondaryValue: '+17', driverNumber: '1', accentColor: '#5d74ff'},
    {position: 7, name: 'Oliver Bearman', team: 'Haas F1 Team', badge: {label: 'OB', accentColor: '#f1f1f1', imagePath: '/f1/drivers/haas-f1-team-oliver-bearman.png', logoPath: '/f1/teams/haas-f1-team.png', sublabel: 'Haas F1 Team'}, value: '6', secondaryValue: '+19', driverNumber: '87', accentColor: '#f1f1f1'},
    {position: 8, name: 'Arvid Lindblad', team: 'Racing Bulls', badge: {label: 'AL', accentColor: '#7b94ff', imagePath: '/f1/drivers/racing-bulls-arvid-lindblad.png', logoPath: '/f1/teams/racing-bulls.png', sublabel: 'Racing Bulls'}, value: '4', secondaryValue: '+21', driverNumber: '41', accentColor: '#7b94ff'},
    {position: 9, name: 'Gabriel Bortoleto', team: 'Audi Revolut F1 Team', badge: {label: 'GB', accentColor: '#d4d7df', imagePath: '/f1/drivers/audi-revolut-f1-team-gabriel-bortoleto.png', sublabel: 'Audi Revolut F1 Team'}, value: '2', secondaryValue: '+23', driverNumber: '5', accentColor: '#d4d7df'},
    {position: 10, name: 'Pierre Gasly', team: 'Alpine F1 Team', badge: {label: 'PG', accentColor: '#ff76db', imagePath: '/f1/drivers/alpine-f1-team-pierre-gasly.png', logoPath: '/f1/teams/alpine-f1-team.png', sublabel: 'Alpine F1 Team'}, value: '1', secondaryValue: '+24', driverNumber: '10', accentColor: '#ff76db'},
    {position: 11, name: 'Carlos Sainz Jr', team: 'Williams F1 Team', badge: {label: 'CS', accentColor: '#6fb4ff', imagePath: '/f1/drivers/williams-f1-team-carlos-sainz-jr.png', logoPath: '/f1/teams/williams-f1-team.png', sublabel: 'Williams F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '55', accentColor: '#6fb4ff'},
    {position: 12, name: 'Liam Lawson', team: 'Racing Bulls', badge: {label: 'LL', accentColor: '#7b94ff', imagePath: '/f1/drivers/racing-bulls-liam-lawson.png', logoPath: '/f1/teams/racing-bulls.png', sublabel: 'Racing Bulls'}, value: '0', secondaryValue: '+25', driverNumber: '30', accentColor: '#7b94ff'},
    {position: 13, name: 'Franco Colapinto', team: 'Alpine F1 Team', badge: {label: 'FC', accentColor: '#ff76db', imagePath: '/f1/drivers/alpine-f1-team-franco-colapinto.png', logoPath: '/f1/teams/alpine-f1-team.png', sublabel: 'Alpine F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '43', accentColor: '#ff76db'},
    {position: 14, name: 'Valtteri Bottas', team: 'Cadillac Formula 1 Team', badge: {label: 'VB', accentColor: '#8fd1ff', imagePath: '/f1/drivers/cadillac-formula-1-team-valtteri-bottas.png', sublabel: 'Cadillac Formula 1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '77', accentColor: '#8fd1ff'},
    {position: 15, name: 'Sergio Perez', team: 'Cadillac Formula 1 Team', badge: {label: 'SP', accentColor: '#8fd1ff', imagePath: '/f1/drivers/cadillac-formula-1-team-sergio-perez.png', sublabel: 'Cadillac Formula 1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '11', accentColor: '#8fd1ff'},
    {position: 16, name: 'Esteban Ocon', team: 'Haas F1 Team', badge: {label: 'EO', accentColor: '#f1f1f1', imagePath: '/f1/drivers/haas-f1-team-esteban-ocon.png', logoPath: '/f1/teams/haas-f1-team.png', sublabel: 'Haas F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '31', accentColor: '#f1f1f1'},
    {position: 17, name: 'Oscar Piastri', team: 'McLaren Racing', badge: {label: 'OP', accentColor: '#ff9a3d', imagePath: '/f1/drivers/mclaren-racing-oscar-piastri.png', logoPath: '/f1/teams/mclaren-racing.png', sublabel: 'McLaren Racing'}, value: '0', secondaryValue: '+25', driverNumber: '81', accentColor: '#ff9a3d'},
    {position: 18, name: 'Nico Hulkenberg', team: 'Audi Revolut F1 Team', badge: {label: 'NH', accentColor: '#d4d7df', imagePath: '/f1/drivers/audi-revolut-f1-team-nico-hulkenberg.png', sublabel: 'Audi Revolut F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '27', accentColor: '#d4d7df'},
    {position: 19, name: 'Isack Hadjar', team: 'Red Bull Racing', badge: {label: 'IH', accentColor: '#5d74ff', imagePath: '/f1/drivers/red-bull-racing-isack-hadjar.png', logoPath: '/f1/teams/red-bull-racing.png', sublabel: 'Red Bull Racing'}, value: '0', secondaryValue: '+25', driverNumber: '6', accentColor: '#5d74ff'},
    {position: 20, name: 'Alexander Albon', team: 'Williams F1 Team', badge: {label: 'AA', accentColor: '#6fb4ff', imagePath: '/f1/drivers/williams-f1-team-alexander-albon.png', logoPath: '/f1/teams/williams-f1-team.png', sublabel: 'Williams F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '23', accentColor: '#6fb4ff'},
    {position: 21, name: 'Fernando Alonso', team: 'Aston Martin F1 Team', badge: {label: 'FA', accentColor: '#41c287', imagePath: '/f1/drivers/aston-martin-f1-team-fernando-alonso.png', logoPath: '/f1/teams/aston-martin-f1-team.png', sublabel: 'Aston Martin F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '14', accentColor: '#41c287'},
    {position: 22, name: 'Lance Stroll', team: 'Aston Martin F1 Team', badge: {label: 'LS', accentColor: '#41c287', imagePath: '/f1/drivers/aston-martin-f1-team-lance-stroll.png', logoPath: '/f1/teams/aston-martin-f1-team.png', sublabel: 'Aston Martin F1 Team'}, value: '0', secondaryValue: '+25', driverNumber: '18', accentColor: '#41c287'},
  ],
};

const sampleConstructorStandingsJob: F1ConstructorStandingsJob = {
  ...sampleDriverStandingsJob,
  template: 'constructor-standings',
  compositionId: 'F1ConstructorStandingsShort',
  themeConfig: {
    variant: 'orange',
    background: 'linear-gradient(180deg, #4c120b 0%, #2a0b10 44%, #12070d 100%)',
    accent: '#ff8a3d',
    secondaryAccent: '#ffe36d',
    panelFill: 'linear-gradient(180deg, rgba(44,13,10,0.96), rgba(15,6,9,0.98))',
    panelStroke: 'rgba(255, 161, 77, 0.92)',
    text: '#fff4e5',
    mutedText: '#f6d9bb',
  },
  templateConfig: {
    template: 'constructor-standings',
    label: 'Mundial de Construtores',
    compositionId: 'F1ConstructorStandingsShort',
    themeVariant: 'orange',
    durationInFrames: 360,
  },
  title: 'Mundial de Construtores',
  leader: {
    position: 1,
    name: 'Mercedes',
    team: 'Mercedes',
    badge: {label: 'ME', accentColor: '#65e1c6'},
    stat: '43 pts',
    accentColor: '#65e1c6',
  },
  entries: [
    {position: 1, name: 'Mercedes', badge: {label: 'ME', accentColor: '#65e1c6'}, value: '43', secondaryValue: '2 vitorias', accentColor: '#65e1c6'},
    {position: 2, name: 'Ferrari', badge: {label: 'FE', accentColor: '#ff5546'}, value: '27', secondaryValue: '2 podios', accentColor: '#ff5546'},
    {position: 3, name: 'McLaren', badge: {label: 'MC', accentColor: '#ff9a3d'}, value: '10', secondaryValue: '', accentColor: '#ff9a3d'},
    {position: 4, name: 'Red Bull', badge: {label: 'RB', accentColor: '#5d74ff'}, value: '8', secondaryValue: '', accentColor: '#5d74ff'},
    {position: 5, name: 'Haas', badge: {label: 'HA', accentColor: '#f1f1f1'}, value: '6', secondaryValue: '', accentColor: '#f1f1f1'},
  ],
};

const sampleScheduleJob: F1WeekendScheduleJob = {
  sport: 'f1',
  template: 'weekend-schedule',
  compositionId: 'F1WeekendScheduleShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'orange',
    background: 'linear-gradient(180deg, #4c120b 0%, #2a0b10 44%, #12070d 100%)',
    accent: '#ff8a3d',
    secondaryAccent: '#ffe36d',
    panelFill: 'linear-gradient(180deg, rgba(44,13,10,0.96), rgba(15,6,9,0.98))',
    panelStroke: 'rgba(255, 161, 77, 0.92)',
    text: '#fff4e5',
    mutedText: '#f6d9bb',
  },
  templateConfig: {
    template: 'weekend-schedule',
    label: 'Horarios do GP',
    compositionId: 'F1WeekendScheduleShort',
    themeVariant: 'orange',
    durationInFrames: 360,
  },
  title: 'Horarios da Formula 1',
  subtitle: 'GP da China',
  raceId: 102,
  raceName: 'GP da China',
  countryCode: 'CHN',
  circuitName: 'Xangai',
  brandName: 'Radio do Box',
  outputName: 'sample-f1-weekend-schedule.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  sessions: [
    {dayLabel: 'Sexta-feira', title: 'Treino Livre 1', timeLabel: '23H30 - 00H30'},
    {dayLabel: 'Sexta-feira', title: 'Treino Livre 2', timeLabel: '03H00 - 04H00'},
    {dayLabel: 'Sabado', title: 'Classificacao', timeLabel: '03H00 - 04H00'},
    {dayLabel: 'Domingo', title: 'Corrida', timeLabel: '02H00 (BRT)'},
  ],
};

const sampleCircuitInsightsJob: F1CircuitInsightsJob = {
  ...sampleScheduleJob,
  template: 'circuit-insights',
  compositionId: 'F1CircuitInsightsShort',
  templateConfig: {
    template: 'circuit-insights',
    label: 'Circuito Insights',
    compositionId: 'F1CircuitInsightsShort',
    themeVariant: 'orange',
    durationInFrames: 360,
  },
  title: 'GP do Japão',
  subtitle: 'Guia do Circuito',
  raceType: 'Race',
  raceName: 'GP do Japão',
  countryCode: 'JPN',
  circuitName: 'Suzuka',
  outputName: 'sample-f1-circuit-insights.mp4',
  keyPoints: [
    'Suzuka exige ritmo forte nas curvas de alta.',
    'Primeiro setor costuma separar boas voltas.',
    'Equilíbrio aerodinâmico é crítico no trecho final.',
    'Tração na saída de curva faz diferença no tempo de volta.',
  ],
  stats: [
    {label: 'Circuito', value: 'Suzuka'},
    {label: 'País', value: 'Japão'},
    {label: 'Cidade', value: 'Suzuka'},
    {label: 'Comprimento', value: '5.807 km'},
    {label: 'Voltas', value: '53'},
  ],
  historicalNote: 'Último vencedor: Max Verstappen (2025)',
  trackImagePath: undefined,
};

const sampleRacePredictionsJob: F1RacePredictionsJob = {
  sport: 'f1',
  template: 'race-predictions',
  compositionId: 'F1RacePredictionsShort',
  season: 2026,
  competitionId: 1,
  competitionName: 'Formula 1',
  competitionConfig: {
    competitionId: 1,
    label: 'Formula 1',
    shortLabel: 'F1',
    countryCode: 'INT',
  },
  themeConfig: {
    variant: 'orange',
    background: 'linear-gradient(180deg, #150708 0%, #23080b 45%, #09090d 100%)',
    accent: '#E10600',
    secondaryAccent: '#FF8700',
    panelFill: 'linear-gradient(180deg, rgba(31,10,11,0.96), rgba(8,8,12,0.98))',
    panelStroke: 'rgba(225, 6, 0, 0.9)',
    text: '#fff7f0',
    mutedText: '#f0b9a7',
  },
  templateConfig: {
    template: 'race-predictions',
    label: 'Palpites Top 10',
    compositionId: 'F1RacePredictionsShort',
    themeVariant: 'orange',
    durationInFrames: 360,
  },
  title: 'Palpites Corrida',
  subtitle: 'Corrida',
  raceType: 'Race',
  raceId: 103,
  raceName: 'GP do Japão',
  countryCode: 'JPN',
  circuitName: 'Suzuka',
  brandName: 'Radio do Box',
  brandLogoPath: '/branding/radio-do-box/yellow.png',
  outputName: 'sample-f1-race-predictions.mp4',
  durationInFrames: 360,
  dataSource: 'sample',
  predictionType: 'race',
  predictionAuthor: 'vini',
  authorName: 'Vini',
  authorImagePath: '/branding/radio-do-box/hosts/vini.png',
  entries: sampleRacePaceJob.entries.map((entry, index) => ({
    ...entry,
    position: index + 1,
    value: `P${index + 1}`,
    secondaryValue: entry.team,
  })),
};

export const sampleF1Jobs = {
  raceResults: sampleRaceResultsJob,
  racePace: sampleRacePaceJob,
  teammateBattle: sampleTeammateBattleJob,
  qualifyingGrid: sampleQualifyingJob,
  driverStandings: sampleDriverStandingsJob,
  constructorStandings: sampleConstructorStandingsJob,
  weekendSchedule: sampleScheduleJob,
  circuitInsights: sampleCircuitInsightsJob,
  racePredictions: sampleRacePredictionsJob,
};

const currentF1Job = currentF1JobJson as F1VideoJob;

const selectCurrentF1Job = <T extends F1VideoJob>(
  template: T['template'],
  templateJobJson: unknown,
  sampleJob: T
) => {
  if (currentF1Job.template === template) {
    return currentF1Job as T;
  }

  const templateJob = templateJobJson as F1VideoJob;
  return templateJob.template === template ? (templateJobJson as T) : sampleJob;
};

const raceResultsJob =
  selectCurrentF1Job<F1RaceResultsJob>('race-results', currentRaceResultsJobJson, sampleRaceResultsJob);

const racePaceJob =
  selectCurrentF1Job<F1RacePaceJob>('race-pace', currentRacePaceJobJson, sampleRacePaceJob);

const teammateBattleJob =
  selectCurrentF1Job<F1TeammateBattleJob>('teammate-battle', currentTeammateBattleJobJson, sampleTeammateBattleJob);

const qualifyingGridJob =
  selectCurrentF1Job<F1QualifyingGridJob>('qualifying-grid', currentQualifyingJobJson, sampleQualifyingJob);

const driverStandingsJob =
  selectCurrentF1Job<F1DriverStandingsJob>('driver-standings', currentDriverStandingsJobJson, sampleDriverStandingsJob);

const constructorStandingsJob =
  selectCurrentF1Job<F1ConstructorStandingsJob>('constructor-standings', currentConstructorStandingsJobJson, sampleConstructorStandingsJob);

const weekendScheduleJob =
  selectCurrentF1Job<F1WeekendScheduleJob>('weekend-schedule', currentWeekendScheduleJobJson, sampleScheduleJob);

const circuitInsightsJob =
  selectCurrentF1Job<F1CircuitInsightsJob>('circuit-insights', currentCircuitInsightsJobJson, sampleCircuitInsightsJob);

const racePredictionsJob =
  selectCurrentF1Job<F1RacePredictionsJob>('race-predictions', currentRacePredictionsJobJson, sampleRacePredictionsJob);

export const currentF1Jobs = {
  raceResults: raceResultsJob,
  racePace: racePaceJob,
  teammateBattle: teammateBattleJob,
  qualifyingGrid: qualifyingGridJob,
  driverStandings: driverStandingsJob,
  constructorStandings: constructorStandingsJob,
  weekendSchedule: weekendScheduleJob,
  circuitInsights: circuitInsightsJob,
  racePredictions: racePredictionsJob,
};
