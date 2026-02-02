import React, { useState } from 'react';
import { PlayerProfile, CARS, CarStats } from '../types';

interface GarageViewProps {
  profile: PlayerProfile;
  onUpdateProfile: (p: PlayerProfile) => void;
  onBack: () => void;
}

const GarageView: React.FC<GarageViewProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [selectedCarId, setSelectedCarId] = useState(profile.equippedCarId);

  const selectedCar = CARS.find(c => c.id === selectedCarId) || CARS[0];
  const isOwned = profile.ownedCars.includes(selectedCarId);
  const isEquipped = profile.equippedCarId === selectedCarId;

  const handlePurchase = () => {
    if (profile.coins >= selectedCar.price) {
      onUpdateProfile({
        ...profile,
        coins: profile.coins - selectedCar.price,
        ownedCars: [...profile.ownedCars, selectedCarId],
        equippedCarId: selectedCarId
      });
    }
  };

  const handleEquip = () => {
    onUpdateProfile({
      ...profile,
      equippedCarId: selectedCarId
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 animate-slideIn">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2">
          ← BACK
        </button>
        <div className="text-yellow-400 font-mono text-xl font-bold">
          ₵ {profile.coins.toLocaleString()}
        </div>
      </div>

      <h2 className="text-4xl font-display font-bold mb-8 neon-text">GARAGE</h2>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Car List */}
        <div className="w-full md:w-1/3 space-y-3 overflow-y-auto pr-2 max-h-[60vh]">
          {CARS.map(car => {
            const owned = profile.ownedCars.includes(car.id);
            return (
              <button
                key={car.id}
                onClick={() => setSelectedCarId(car.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all relative overflow-hidden ${
                  selectedCarId === car.id 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-bold font-display">{car.name}</span>
                  {owned && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">OWNED</span>}
                  {!owned && <span className="text-xs text-yellow-400">₵ {car.price}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Car Preview & Stats */}
        <div className="flex-1 bg-slate-800/50 rounded-2xl p-8 border border-slate-700 flex flex-col items-center justify-center relative">
            {/* Visual Representation of Car */}
            <div className="w-64 h-96 relative flex items-center justify-center mb-8 group">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                
                {/* Car Shape - CSS composed */}
                <div className="relative w-32 h-56 transition-transform duration-500 transform group-hover:scale-105">
                     <div className="w-full h-full rounded-3xl relative shadow-2xl" style={{ backgroundColor: selectedCar.color }}>
                        {/* Windshield */}
                        <div className="absolute top-12 left-4 right-4 h-12 bg-slate-900 rounded-sm opacity-80"></div>
                        {/* Roof details */}
                        <div className="absolute top-28 left-0 right-0 h-2 bg-black/20"></div>
                        <div className="absolute bottom-8 left-2 right-2 h-1 bg-white/20 rounded-full"></div>
                        {/* Headlights */}
                        <div className="absolute top-2 left-2 w-4 h-6 bg-yellow-100 rounded-full blur-[2px] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                        <div className="absolute top-2 right-2 w-4 h-6 bg-yellow-100 rounded-full blur-[2px] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                        {/* Taillights */}
                        <div className="absolute bottom-2 left-3 w-6 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                        <div className="absolute bottom-2 right-3 w-6 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                     </div>
                </div>
            </div>

            <div className="w-full max-w-md space-y-4">
                <StatBar label="Speed" value={selectedCar.speed} />
                <StatBar label="Handling" value={selectedCar.handling} />
                <StatBar label="Acceleration" value={selectedCar.acceleration} />
            </div>

            <div className="mt-8 flex gap-4">
                {isOwned ? (
                    <button 
                        onClick={handleEquip}
                        disabled={isEquipped}
                        className={`px-8 py-3 rounded-lg font-bold font-display tracking-wider transition-all ${
                            isEquipped 
                            ? 'bg-green-600/50 text-green-200 cursor-default' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                        }`}
                    >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP RIDE'}
                    </button>
                ) : (
                    <button 
                        onClick={handlePurchase}
                        disabled={profile.coins < selectedCar.price}
                        className={`px-8 py-3 rounded-lg font-bold font-display tracking-wider transition-all ${
                            profile.coins < selectedCar.price
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                        }`}
                    >
                        BUY FOR ₵ {selectedCar.price}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatBar = ({ label, value }: { label: string, value: number }) => (
    <div className="flex items-center gap-4">
        <span className="w-24 text-sm text-slate-400 font-mono uppercase">{label}</span>
        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500" 
                style={{ width: `${value}%` }}
            ></div>
        </div>
        <span className="w-8 text-right text-xs text-white">{value}</span>
    </div>
);

export default GarageView;