import { PlayerProfile, DEFAULT_PROFILE, LeaderboardEntry } from '../types';

const PROFILE_KEY = 'turbo_drift_profile_v1';
const LEADERBOARD_KEY = 'turbo_drift_leaderboard_v1';

export const loadProfile = (): PlayerProfile => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load profile", e);
  }
  return DEFAULT_PROFILE;
};

export const saveProfile = (profile: PlayerProfile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
};

export const getLeaderboardData = (): LeaderboardEntry[] => {
  // Generate some fake data if empty
  const stored = localStorage.getItem(LEADERBOARD_KEY);
  if (stored) return JSON.parse(stored);

  const fakeData: LeaderboardEntry[] = Array.from({ length: 9 }).map((_, i) => ({
    id: `bot_${i}`,
    username: `RacerBot_${Math.floor(Math.random() * 1000)}`,
    score: Math.floor(Math.random() * 10000) + 1000,
    rank: i + 2,
    isPlayer: false
  })).sort((a, b) => b.score - a.score);

  return fakeData;
};

export const saveScoreToLeaderboard = (username: string, score: number) => {
    let data = getLeaderboardData();
    // Add current player score
    data.push({
        id: 'player_local',
        username: username,
        score: score,
        rank: 0,
        isPlayer: true
    });
    
    // Sort and rank
    data.sort((a, b) => b.score - a.score);
    data = data.slice(0, 50).map((entry, index) => ({...entry, rank: index + 1}));
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
};