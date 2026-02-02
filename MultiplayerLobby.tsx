import React, { useEffect, useState } from 'react';
import { PlayerProfile } from '../types';

interface MultiplayerLobbyProps {
  profile: PlayerProfile;
  onMatchStart: () => void;
  onBack: () => void;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ profile, onMatchStart, onBack }) => {
  const [status, setStatus] = useState<'SEARCHING' | 'FOUND' | 'STARTING'>('SEARCHING');
  const [timer, setTimer] = useState(0);
  const [players, setPlayers] = useState<{name: string, ready: boolean}[]>([
      { name: profile.username, ready: true }
  ]);

  useEffect(() => {
    let interval: any;
    
    // Simulate finding players
    if (status === 'SEARCHING') {
        const timeToFind = Math.floor(Math.random() * 2000) + 1000;
        setTimeout(() => {
            setPlayers(prev => [
                ...prev,
                { name: `SpeedDemon_${Math.floor(Math.random()*100)}`, ready: true },
                { name: `DriftKing`, ready: true },
                { name: `NeonRider`, ready: true },
            ]);
            setStatus('FOUND');
        }, timeToFind);
    }

    if (status === 'FOUND') {
        setTimeout(() => setStatus('STARTING'), 1500);
    }

    if (status === 'STARTING') {
        setTimer(3);
        interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onMatchStart();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    return () => clearInterval(interval);
  }, [status, onMatchStart, profile.username]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-6 relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-white">CANCEL MATCHMAKING</button>
      
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center">
        
        {status === 'SEARCHING' && (
            <div className="space-y-6">
                 <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <h2 className="text-2xl font-bold animate-pulse">SEARCHING FOR OPPONENTS...</h2>
                 <p className="text-slate-400">Estimated wait: 00:05</p>
            </div>
        )}

        {(status === 'FOUND' || status === 'STARTING') && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-green-400">MATCH FOUND!</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
                    {players.map((p, idx) => (
                        <div key={idx} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center animate-fadeIn" style={{animationDelay: `${idx * 100}ms`}}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                                <span className="font-bold">{p.name}</span>
                            </div>
                            <span className="text-xs font-bold text-green-400 bg-green-900/30 px-2 py-1 rounded">READY</span>
                        </div>
                    ))}
                </div>

                {status === 'STARTING' && (
                    <div className="mt-8">
                        <p className="text-slate-400 uppercase tracking-widest text-sm mb-2">Race Starting In</p>
                        <div className="text-6xl font-black font-display text-white">{timer}</div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default MultiplayerLobby;