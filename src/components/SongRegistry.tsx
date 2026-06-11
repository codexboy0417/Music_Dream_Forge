import React, { useState } from "react";
import { Heart, Trash2, Play, Music4, Eye } from "lucide-react";
import { Track } from "../types";

interface SongRegistryProps {
  tracks: Track[];
  currentTrack: Track | null;
  onTrackSelected: (track: Track) => void;
  onToggleFavorite: (id: string) => void;
  onTrackDeleted: (id: string) => void;
}

export const SongRegistry: React.FC<SongRegistryProps> = ({
  tracks,
  currentTrack,
  onTrackSelected,
  onToggleFavorite,
  onTrackDeleted,
}) => {
  const [filter, setFilter] = useState<"all" | "favorites" | "frequent">("all");

  // Filtering criteria
  const filteredTracks = tracks.filter((t) => {
    if (filter === "favorites") return t.isFavorite;
    if (filter === "frequent") return t.playCount > 100;
    return true; // "all"
  });

  return (
    <div id="song-registry-column" className="flex flex-col gap-5 h-full">
      
      {/* Dynamic pill filter tabs bar */}
      <div className="flex bg-[#0a0b0f] p-1 rounded-xl border border-[#1b1c25] self-start">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer ${
            filter === "all"
              ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          All Music
        </button>
        <button
          onClick={() => setFilter("favorites")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer ${
            filter === "favorites"
              ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Favorites
        </button>
        <button
          onClick={() => setFilter("frequent")}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer ${
            filter === "frequent"
              ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Frequent
        </button>
      </div>

      {/* Grid containing Cards matching exactly Quantum Pulse, Grid Runner, Liquid State, Void Echoes */}
      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto max-h-[85vh] custom-scrollbar pr-0.5">
        {filteredTracks.map((track) => {
          const isSelected = currentTrack?.id === track.id;
          return (
            <div
              key={track.id}
              className={`group relative bg-[#0e0f14] border rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? "border-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                  : "border-[#1d1f2b] hover:border-gray-700 hover:shadow-xl"
              }`}
            >
              {/* Cover Art Visual with CSS Procedural Graphics to match screens exactly */}
              <div className="relative aspect-square w-full bg-black/80 flex items-center justify-center p-4 group overflow-hidden border-b border-gray-950">
                <CoverGraphics id={track.id} isSelected={isSelected} />

                {/* Overlaid Play Controller */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => onTrackSelected(track)}
                    className="w-11 h-11 rounded-full bg-[#7c3aed] hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300 cursor-pointer"
                  >
                    <Play size={18} className="fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Title & Stats */}
              <div className="p-3.5 flex flex-col text-left">
                <span className="text-[12px] font-sans font-semibold tracking-tight text-white group-hover:text-purple-400 transition-colors truncate">
                  {track.title}
                </span>
                
                {/* Favorites and Remove buttons overlay matching mock */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-900 text-gray-500">
                  <button
                    onClick={() => onToggleFavorite(track.id)}
                    className={`hover:text-pink-500 transition-colors cursor-pointer p-0.5`}
                  >
                    <Heart
                      size={13}
                      className={track.isFavorite ? "fill-pink-500 stroke-pink-500" : "stroke-current"}
                    />
                  </button>

                  <span className="text-[9px] font-mono tracking-wide uppercase text-gray-600">
                    {track.style}
                  </span>

                  <button
                    onClick={() => onTrackDeleted(track.id)}
                    className="hover:text-red-500 transition-colors cursor-pointer p-0.5"
                    title="Delete Track"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredTracks.length === 0 && (
          <div className="col-span-2 py-12 text-center text-gray-500 font-mono text-xs border border-dashed border-gray-900 rounded-xl">
            <Music4 size={24} className="mx-auto mb-2 opacity-30" />
            No audio matrices loaded in current filter.
          </div>
        )}
      </div>

    </div>
  );
};

// Cover procedural graphic renderer
const CoverGraphics: React.FC<{ id: string; isSelected: boolean }> = ({ id, isSelected }) => {
  if (id === "quantum-pulse") {
    // Elegant magnetic neon ring sphere rotating with glowing center particle
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 bg-[#07010f]/40" />
        <div className="absolute w-16 h-16 rounded-full border-2 border-pink-500/40 animate-[spin_6s_linear_infinite]" />
        <div className="absolute w-12 h-12 rounded-full border-2 border-dashed border-cyan-400/40 animate-[spin_3s_linear_infinite_reverse]" />
        <div className="absolute w-6 h-6 rounded-full bg-pink-500 blur-[4px] animate-pulse" />
        <div className="w-4 h-4 rounded-full bg-cyan-400 border border-white" />
      </div>
    );
  }

  if (id === "grid-runner") {
    // Dynamic synth perspective lines on glowing dark blue horizon
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#000512]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,1)]" />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px]" />
        {/* Sun dial */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-t from-pink-500 to-transparent blur-[1px] absolute top-[25%] opacity-70" />
        {/* Perspective grid lines */}
        <div className="absolute bottom-0 w-full h-1/2 flex justify-between px-2 text-cyan-500/20 text-[9px] font-mono leading-none select-none">
          <span>//GRID_SYS</span>
          <span>101.99</span>
        </div>
      </div>
    );
  }

  if (id === "liquid-state") {
    // Floating organic warm morphing fluid shape
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0f0101]" />
        <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-red-600 rounded-[50%_40%_30%_60%/_50%_60%_30%_40%] animate-[pulse_4s_ease-in-out_infinite] blur-[10px] opacity-50" />
        <div className="w-10 h-10 bg-pink-400 rounded-full animate-[ping_3s_infinite_alternate]" />
      </div>
    );
  }

  if (id === "void-echoes") {
    // Concentric dark sonar radar patterns
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 bg-[#040406]" />
        <div className="w-16 h-16 rounded-full border border-gray-800 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border border-gray-900 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border border-pink-500/30 animate-ping" />
          </div>
        </div>
        <div className="absolute w-2 h-2 rounded-full bg-white/20" />
      </div>
    );
  }

  // Handle uploaded cards using elegant tech-pattern backup
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#07080c]">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.5),transparent)]" />
      <div className="w-12 h-12 rounded-full border border-dashed border-purple-500/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
        <Music4 size={18} className="text-purple-400" />
      </div>
    </div>
  );
};
