import React, { useState, useEffect } from 'react';
import { ViewState, PlayerProfile, DEFAULT_PROFILE, GameMode } from './types';
import { loadProfile, saveProfile } from './services/storageService';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import GarageView from './components/GarageView';
import LeaderboardView from './components/LeaderboardView';
import MultiplayerLobby from './components/MultiplayerLobby';
import { AudioService } from './services/audioService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.MENU);
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(GameMode.SINGLE_PLAYER);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    
    // Initialize Audio Context on first interaction if needed
    const unlockAudio = () => {
      AudioService.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }, []);

  const handleProfileUpdate = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const navigateTo = (newView: ViewState) => {
    setView(newView);
  };

  const startGame = (mode: GameMode) => {
    setSelectedGameMode(mode);
    if (mode === GameMode.MULTIPLAYER) {
      navigateTo(ViewState.LOBBY);
    } else {
      navigateTo(ViewState.GAME);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white overflow-hidden relative selection:bg-blue-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080?blur=10')] opacity-20 bg-cover bg-center pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full">
        {view === ViewState.MENU && (
          <MainMenu 
            profile={profile} 
            onStart={(mode) => startGame(mode)}
            onGarage={() => navigateTo(ViewState.GARAGE)}
            onLeaderboard={() => navigateTo(ViewState.LEADERBOARD)}
          />
        )}

        {view === ViewState.GARAGE && (
          <GarageView 
            profile={profile}
            onUpdateProfile={handleProfileUpdate}
            onBack={() => navigateTo(ViewState.MENU)}
          />
        )}

        {view === ViewState.LEADERBOARD && (
          <LeaderboardView 
            onBack={() => navigateTo(ViewState.MENU)}
          />
        )}

        {view === ViewState.LOBBY && (
          <MultiplayerLobby 
            profile={profile}
            onMatchStart={() => navigateTo(ViewState.GAME)}
            onBack={() => navigateTo(ViewState.MENU)}
          />
        )}

        {view === ViewState.GAME && (
          <GameCanvas 
            mode={selectedGameMode}
            profile={profile}
            onRaceFinished={(results) => {
              // Update coins and stats
              const newCoins = profile.coins + results.coinsEarned;
              const newXp = profile.xp + results.xpEarned;
              const updatedProfile = { 
                ...profile, 
                coins: newCoins, 
                xp: newXp,
                highScore: Math.max(profile.highScore, results.score)
              };
              handleProfileUpdate(updatedProfile);
              
              // Return to menu
              navigateTo(ViewState.MENU);
            }}
            onExit={() => navigateTo(ViewState.MENU)}
          />
        )}
      </div>
    </div>
  );
};

export default App;