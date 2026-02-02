export enum ViewState {
  MENU = 'MENU',
  GAME = 'GAME',
  GARAGE = 'GARAGE',
  LEADERBOARD = 'LEADERBOARD',
  LOBBY = 'LOBBY',
}

export enum GameMode {
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  MULTIPLAYER = 'MULTIPLAYER',
}

export interface CarStats {
  id: string;
  name: string;
  speed: number;
  handling: number;
  acceleration: number;
  price: number;
  color: string;
}

export interface PlayerProfile {
  username: string;
  coins: number;
  xp: number;
  level: number;
  ownedCars: string[];
  equippedCarId: string;
  highScore: number;
  rank: string;
}

export const CARS: CarStats[] = [
  { id: 'c1', name: 'Neon Scout', speed: 60, handling: 80, acceleration: 60, price: 0, color: '#3b82f6' },
  { id: 'c2', name: 'Crimson Fury', speed: 80, handling: 60, acceleration: 85, price: 1000, color: '#ef4444' },
  { id: 'c3', name: 'Void Runner', speed: 95, handling: 90, acceleration: 90, price: 5000, color: '#8b5cf6' },
  { id: 'c4', name: 'Golden Era', speed: 98, handling: 50, acceleration: 98, price: 10000, color: '#eab308' },
];

export const DEFAULT_PROFILE: PlayerProfile = {
  username: 'Racer_' + Math.floor(Math.random() * 9999),
  coins: 100,
  xp: 0,
  level: 1,
  ownedCars: ['c1'],
  equippedCarId: 'c1',
  highScore: 0,
  rank: 'Rookie'
};

export interface RaceResult {
  score: number;
  distance: number;
  coinsEarned: number;
  xpEarned: number;
  position?: number; // For multiplayer
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  rank: number;
  isPlayer?: boolean;
}