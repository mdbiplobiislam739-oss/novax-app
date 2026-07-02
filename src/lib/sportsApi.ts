// src/lib/sportsApi.ts
// This file handles API integrations for sports data (API-Football & The Odds API).
// Placeholders are used if API keys are missing.

const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY || '';
const API_FOOTBALL_KEY = import.meta.env.VITE_API_FOOTBALL_KEY || '';

export interface SportsMatch {
    id: string;
    sport: string;
    league: string;
    team1: string;
    team2: string;
    score1?: number;
    score2?: number;
    period: string; // e.g., '1st Half', 'Not Started', 'FT'
    state: 'pre' | 'in' | 'post';
    date: string; // ISO string
    markets: {
        [marketName: string]: {
            id: string;
            label: string;
            odds: number;
        }[];
    };
    timeMinutes?: number;
    timeSeconds?: number;
    overs?: number; // for cricket
}

// Fallback data when API keys are not provided
const FALLBACK_MATCHES: SportsMatch[] = [
    {
        id: 'fb1', sport: 'football', league: 'UEFA Champions League', team1: 'Real Madrid', team2: 'Bayern Munich', score1: 2, score2: 1, period: '2nd Half', timeMinutes: 78, timeSeconds: 30, state: 'in', date: new Date().toISOString(),
        markets: {
            'Match Winner': [
                { id: 'mw_fb1_1', label: 'W1', odds: 1.45 },
                { id: 'mw_fb1_x', label: 'X', odds: 3.20 },
                { id: 'mw_fb1_2', label: 'W2', odds: 5.10 },
            ]
        }
    },
    {
        id: 'cr1', sport: 'cricket', league: 'T20 World Cup', team1: 'India', team2: 'Australia', score1: 185, score2: 120, period: 'Innings 2', overs: 14.3, state: 'in', date: new Date().toISOString(),
        markets: {
            'Match Winner': [
                { id: 'mw_cr1_1', label: 'W1', odds: 1.15 },
                { id: 'mw_cr1_2', label: 'W2', odds: 4.80 },
            ]
        }
    },
    {
        id: 'up_fb1', sport: 'football', league: 'Premier League', team1: 'Arsenal', team2: 'Chelsea', score1: 0, score2: 0, period: 'Not Started', state: 'pre', date: new Date(Date.now() + 86400000).toISOString(),
        markets: {
            'Match Winner': [
                { id: 'mw_up_fb1_1', label: 'W1', odds: 2.15 },
                { id: 'mw_up_fb1_x', label: 'X', odds: 3.40 },
                { id: 'mw_up_fb1_2', label: 'W2', odds: 3.10 },
            ]
        }
    }
];

export async function fetchLiveMatches(): Promise<SportsMatch[]> {
    if (!ODDS_API_KEY) {
        console.warn("The Odds API Key missing, using fallback live data.");
        return FALLBACK_MATCHES.filter(m => m.state === 'in');
    }

    try {
        const res = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h`);
        if (!res.ok) throw new Error('Failed to fetch from Odds API');
        
        const data = await res.json();
        
        const matches: SportsMatch[] = data
            .filter((m: any) => new Date(m.commence_time).getTime() <= Date.now() + 7200000) // Within 2 hours (mock live)
            .slice(0, 15).map((match: any) => ({
                id: match.id,
                sport: mapSport(match.sport_title),
                league: match.sport_title,
                team1: match.home_team,
                team2: match.away_team,
                score1: Math.floor(Math.random() * 3), 
                score2: Math.floor(Math.random() * 3),
                period: '1st Half',
                state: 'in', 
                date: match.commence_time,
                markets: {
                    'Match Winner': match.bookmakers[0]?.markets[0]?.outcomes.map((o: any) => ({
                        id: `mw_${match.id}_${o.name}`,
                        label: o.name,
                        odds: o.price
                    })) || []
                }
        }));
        
        return matches;
    } catch (e) {
        console.error("Live matches fetch error:", e);
        return FALLBACK_MATCHES.filter(m => m.state === 'in');
    }
}

export async function fetchUpcomingMatches(): Promise<SportsMatch[]> {
    if (!ODDS_API_KEY) {
        console.warn("The Odds API Key missing, using fallback upcoming data.");
        return FALLBACK_MATCHES.filter(m => m.state === 'pre');
    }

    try {
        const res = await fetch(`https://api.the-odds-api.com/v4/sports/upcoming/odds/?apiKey=${ODDS_API_KEY}&regions=eu&markets=h2h`);
        if (!res.ok) throw new Error('Failed to fetch from Odds API');
        
        const data = await res.json();
        
        const matches: SportsMatch[] = data
            .filter((m: any) => new Date(m.commence_time).getTime() > Date.now() + 7200000) 
            .slice(0, 30).map((match: any) => ({
                id: match.id,
                sport: mapSport(match.sport_title),
                league: match.sport_title,
                team1: match.home_team,
                team2: match.away_team,
                score1: 0, 
                score2: 0,
                period: 'Not Started', 
                state: 'pre',
                date: match.commence_time,
                markets: {
                    'Match Winner': match.bookmakers[0]?.markets[0]?.outcomes.map((o: any) => ({
                        id: `mw_${match.id}_${o.name}`,
                        label: o.name,
                        odds: o.price
                    })) || []
                }
        }));
        
        return matches;
    } catch (e) {
        console.error("Upcoming matches fetch error:", e);
        return FALLBACK_MATCHES.filter(m => m.state === 'pre');
    }
}

export async function fetchFootballFixtures(status: 'live' | 'upcoming'): Promise<SportsMatch[]> {
    if (!API_FOOTBALL_KEY) {
        console.warn("API-Football Key missing, returning empty array.");
        return [];
    }

    try {
        const endpoint = status === 'live' ? 'fixtures?live=all' : `fixtures?date=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}`;
        const res = await fetch(`https://v3.football.api-sports.io/${endpoint}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': API_FOOTBALL_KEY
            }
        });
        if (!res.ok) throw new Error('Failed to fetch from API-Football');
        const data = await res.json();
        
        const fixtures = data.response || [];
        return fixtures.slice(0, 30).map((f: any) => ({
            id: f.fixture.id.toString(),
            sport: 'football',
            league: f.league.name,
            team1: f.teams.home.name,
            team2: f.teams.away.name,
            score1: f.goals.home ?? 0,
            score2: f.goals.away ?? 0,
            period: f.fixture.status.long,
            state: status === 'live' ? 'in' : 'pre',
            date: f.fixture.date,
            markets: {
                'Match Winner': [
                    { id: `mw_${f.fixture.id}_1`, label: 'W1', odds: 2.10 },
                    { id: `mw_${f.fixture.id}_x`, label: 'X', odds: 3.20 },
                    { id: `mw_${f.fixture.id}_2`, label: 'W2', odds: 2.80 },
                ],
                'Total Goals Over/Under 2.5': [
                    { id: `ou_${f.fixture.id}_o`, label: 'Over', odds: 1.85 },
                    { id: `ou_${f.fixture.id}_u`, label: 'Under', odds: 1.85 },
                ]
            }
        }));
    } catch (e) {
        console.error("API-Football fetch error:", e);
        return [];
    }
}

function mapSport(sportTitle: string): string {
    const s = sportTitle.toLowerCase();
    if (s.includes('soccer') || s.includes('football')) return 'football';
    if (s.includes('cricket')) return 'cricket';
    if (s.includes('basketball')) return 'basketball';
    if (s.includes('tennis')) return 'tennis';
    if (s.includes('volleyball')) return 'volleyball';
    if (s.includes('esports')) return 'esports';
    if (s.includes('baseball') || s.includes('kbo') || s.includes('mlb')) return 'baseball';
    
    // Attempt to extract the first word or default to 'other'
    return s.split('_')[0] || 'other';
}
