export const CLUB_LEAGUES = [
  'La Liga',
  'Premier League',
  'Liga MX',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
]

export const INTL_LEAGUES = [
  'World Cup',
  'Copa America',
  'Euro Championship',
  'UEFA Nations League',
  'World Cup - Qualification South America',
  'World Cup - Qualification Europe',
]

export const ALL_LEAGUES = [...CLUB_LEAGUES, ...INTL_LEAGUES]

const INTL_KEYWORDS = ['world cup', 'copa', 'euro', 'nations', 'qualification']
export function isInternational(league) {
  return INTL_KEYWORDS.some(k => league.toLowerCase().includes(k))
}

export const TEAMS_BY_LEAGUE = {
  'La Liga': [
    'Real Madrid', 'FC Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia CF',
    'Villarreal', 'Athletic Club', 'Real Sociedad', 'Real Betis', 'Osasuna',
    'Celta Vigo', 'Getafe', 'Alaves', 'Rayo Vallecano', 'Mallorca', 'Las Palmas',
    'Girona', 'Leganes', 'Valladolid', 'Espanyol', 'Levante',
  ],
  'Premier League': [
    'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United',
    'Tottenham', 'Newcastle', 'Aston Villa', 'West Ham', 'Brighton',
    'Crystal Palace', 'Wolves', 'Bournemouth', 'Fulham', 'Brentford',
    'Everton', 'Leicester', 'Southampton', 'Ipswich', 'Nottingham Forest',
  ],
  'Liga MX': [
    'Club America', 'Guadalajara', 'Cruz Azul', 'UNAM', 'Tigres UANL', 'Monterrey',
    'Toluca', 'Leon', 'Santos Laguna', 'Atlas', 'Pachuca', 'Necaxa',
    'Queretaro', 'FC Juarez', 'Tijuana', 'Atletico San Luis', 'Mazatlan', 'Puebla',
  ],
  'Serie A': [
    'Inter', 'AC Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta',
    'Fiorentina', 'Torino', 'Bologna', 'Udinese', 'Empoli', 'Monza',
    'Lecce', 'Cagliari', 'Hellas Verona', 'Genoa', 'Como', 'Parma', 'Venezia',
  ],
  'Bundesliga': [
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
    'Eintracht Frankfurt', 'Wolfsburg', 'Borussia Monchengladbach', 'Freiburg',
    'Hoffenheim', 'Mainz', 'Augsburg', 'Werder Bremen', 'Stuttgart',
    'Cologne', 'Bochum', 'Union Berlin', 'Heidenheim', 'St. Pauli',
  ],
  'Ligue 1': [
    'Paris Saint Germain', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Nice',
    'Rennes', 'Lens', 'Strasbourg', 'Montpellier', 'Nantes', 'Toulouse',
    'Reims', 'Brest', 'Le Havre', 'Saint Etienne', 'Auxerre', 'Angers',
  ],
}

export const NATIONAL_TEAMS = [
  // Sudamérica
  'Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Ecuador', 'Peru',
  'Venezuela', 'Bolivia', 'Paraguay', 'Chile',
  // CONCACAF
  'United States', 'Mexico', 'Canada', 'Costa Rica', 'Panama', 'Honduras',
  'Jamaica', 'El Salvador', 'Guatemala', 'Cuba', 'Trinidad and Tobago',
  // Europa
  'France', 'England', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Portugal',
  'Belgium', 'Croatia', 'Poland', 'Serbia', 'Switzerland', 'Denmark', 'Austria',
  'Scotland', 'Czech Republic', 'Hungary', 'Romania', 'Turkey', 'Ukraine',
  'Slovakia', 'Slovenia', 'Greece', 'Albania', 'Norway', 'Sweden', 'Finland',
  'Ireland', 'Bosnia and Herzegovina', 'Iceland',
  // África
  'Morocco', 'Senegal', 'Nigeria', 'Egypt', 'Ghana', 'Cameroon', 'Tunisia',
  'South Africa', 'DR Congo', 'Algeria', 'Mali', 'Ivory Coast', 'Zambia',
  // Asia
  'Japan', 'South Korea', 'Iran', 'Saudi Arabia', 'Australia', 'Qatar',
  'Indonesia', 'Uzbekistan', 'Jordan', 'Iraq', 'UAE', 'Oman',
  // Wales se clasificó en el pasado, mantener por historial
  'Wales',
]

export function getTeamSuggestions(league) {
  return TEAMS_BY_LEAGUE[league] ?? []
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
