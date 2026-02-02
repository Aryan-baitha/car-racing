import React, { useEffect, useState } from 'react';
import { getLeaderboardData } from '../services/storageService';
import { LeaderboardEntry } from '../types';

interface LeaderboardViewProps {
  onBack: () => void;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setData(getLeaderboardData());
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 animate-slideIn">
       <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          ← BACK
        </button>
      </div>

      <h2 className="text-4xl font-display font-bold mb-2 neon-text text-center">GLOBAL RANKINGS</h2>
      <p className="text-center text-slate-400 mb-8">Season 4 - Week 2</p>

      <div className="max-w-3xl mx-auto w-full bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-800 p-4 font-bold text-slate-400 text-sm uppercase tracking-wider">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Pilot</div>
            <div className="col-span-4 text-right">Score</div>
        </div>
        <div className="divide-y divide-slate-700/50 overflow-y-auto max-h-[60vh]">
            {data.map((entry) => (
                <div 
                    key={entry.id} 
                    className={`grid grid-cols-12 p-4 items-center transition-colors ${
                        entry.isPlayer ? 'bg-blue-600/20' : 'hover:bg-slate-700/30'
                    }`}
                >
                    <div className="col-span-2 text-center font-display font-bold text-lg">
                        {entry.rank === 1 && <span className="text-yellow-400">🥇</span>}
                        {entry.rank === 2 && <span className="text-slate-300">🥈</span>}
                        {entry.rank === 3 && <span className="text-amber-600">🥉</span>}
                        {entry.rank > 3 && <span className="text-slate-500">#{entry.rank}</span>}
                    </div>
                    <div className="col-span-6 font-bold flex items-center gap-2">
                        {entry.username}
                        {entry.isPlayer && <span className="text-xs bg-blue-500 text-white px-1.5 rounded">YOU</span>}
                    </div>
                    <div className="col-span-4 text-right font-mono text-blue-300">
                        {entry.score.toLocaleString()}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;