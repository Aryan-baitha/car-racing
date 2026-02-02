import React from 'react';
import { GameMode, PlayerProfile } from '../types';

interface MainMenuProps {
  profile: PlayerProfile;
  onStart: (mode: GameMode) => void;
  onGarage: () => void;
  onLeaderboard: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ profile, onStart, onGarage, onLeaderboard }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h1 className="text-6xl md:text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 neon-text italic tracking-tighter">
          TURBO DRIFT
        </h1>
        <p className="text-blue-200 text-lg tracking-widest font-mono">CYBER RACER v1.0</p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md transform transition-all hover:border-blue-500/50">
        <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
          <div>
            <p className="text-xs text-slate-400 uppercase">Pilot</p>
            <p className="text-xl font-bold text-white">{profile.username}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase">Bank</p>
            <p className="text-xl font-bold text-yellow-400 font-mono">₵ {profile.coins.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex justify-between text-sm text-slate-300">
           <span>Level {profile.level}</span>
           <span>XP: {profile.xp}</span>
        </div>
        <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (profile.xp % 1000) / 10)}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <button 
          onClick={() => onStart(GameMode.SINGLE_PLAYER)}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          <span className="relative z-10 text-xl font-bold font-display tracking-wider">SINGLE PLAYER</span>
        </button>

        <button 
          onClick={() => onStart(GameMode.MULTIPLAYER)}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(192,38,211,0.5)]"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          <span className="relative z-10 text-xl font-bold font-display tracking-wider flex items-center justify-center gap-2">
            MULTIPLAYER <span className="text-xs bg-black/30 px-2 py-0.5 rounded">LIVE</span>
          </span>
        </button>

        <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onGarage}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold border border-slate-600 hover:border-slate-400 transition-all"
            >
              GARAGE
            </button>
            <button 
              onClick={onLeaderboard}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold border border-slate-600 hover:border-slate-400 transition-all"
            >
              RANKINGS
            </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;