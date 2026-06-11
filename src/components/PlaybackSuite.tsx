import React, { useState, useEffect } from "react";
import { Play, Pause, Volume2, Shuffle, SkipBack, SkipForward, Repeat } from "lucide-react";
import { Track } from "../types";
import { instance as audioEngine } from "../audioEngine";

interface PlaybackSuiteProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  onPlayPauseToggle: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onVolumeChange: (vol: number) => void;
  volume: number;
  onSeek: (time: number) => void;
}

export const PlaybackSuite: React.FC<PlaybackSuiteProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  onPlayPauseToggle,
  onPrevTrack,
  onNextTrack,
  onVolumeChange,
  volume,
  onSeek,
}) => {
  const [shuffleActive, setShuffleActive] = useState(false);
  const [repeatActive, setRepeatActive] = useState(false);
  const progressBarRef = React.useRef<HTMLDivElement | null>(null);

  // Convert seconds to readable min:sec string
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const trackDuration = currentTrack ? currentTrack.duration : 243;
  const progressPercent = Math.min((currentTime / trackDuration) * 100, 100);

  // Seek click handler
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    onSeek(percentage * trackDuration);
  };

  // Volume slider sync
  const handleVolumeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVolume = parseFloat(e.target.value);
    onVolumeChange(nextVolume);
  };

  return (
    <div id="playback-suite" className="bg-[#0e0f14] border border-[#1d1f2b] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      
      {/* Name and Timer Header */}
      <div className="flex items-center justify-between font-mono mb-4 text-xs tracking-wider">
        <span className="text-gray-400 uppercase font-semibold">MASTER PLAYBACK SUITE</span>
        <span className="text-cyan-400 font-bold bg-[#14161f] px-2.5 py-1 rounded border border-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
          {formatTime(currentTime)} / {formatTime(trackDuration)}
        </span>
      </div>

      {/* Progress Timeline seek-bar (Cyan visual trail line) */}
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="relative w-full h-2 bg-gray-800 rounded-full mb-6 group cursor-pointer overflow-hidden flex items-center"
      >
        <div
          className="absolute left-0 top-0 h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.85)] transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 bg-transparent" />
      </div>

      {/* Playback Buttons control core */}
      <div className="flex items-center justify-between px-3 mb-6">
        {/* Shuffle Button */}
        <button
          onClick={() => setShuffleActive(!shuffleActive)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            shuffleActive ? "text-cyan-400 bg-cyan-400/10" : "text-gray-400 hover:text-white"
          }`}
          title="Toggle Shuffle"
        >
          <Shuffle size={16} />
        </button>

        {/* Previous Track Button */}
        <button
          onClick={onPrevTrack}
          className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95"
          title="Previous Track"
        >
          <SkipBack size={20} />
        </button>

        {/* PLAY / PAUSE CENTRAL GLOW BALL */}
        <button
          onClick={onPlayPauseToggle}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform active:scale-90 hover:scale-105 transition-all cursor-pointer border border-[#fff]/40"
          title={isPlaying ? "Pause Matrix" : "Play Matrix"}
        >
          {isPlaying ? (
            <Pause size={24} className="fill-black stroke-black" />
          ) : (
            <Play size={24} className="fill-black stroke-black ml-1" />
          )}
        </button>

        {/* Next Track Button */}
        <button
          onClick={onNextTrack}
          className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95"
          title="Next Track"
        >
          <SkipForward size={20} />
        </button>

        {/* Repeat Button */}
        <button
          onClick={() => setRepeatActive(!repeatActive)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            repeatActive ? "text-pink-500 bg-pink-500/10" : "text-gray-400 hover:text-white"
          }`}
          title="Toggle Repeat"
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Volume Control Suite on the Bottom (Pink visual track line bar) */}
      <div className="flex items-center gap-3">
        <Volume2 size={15} className="text-pink-400" />
        <div className="relative flex-1 group">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeInput}
            className="w-full accent-pink-500 bg-gray-800 rounded-lg h-1.5 appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${volume * 100}%, #1e293b ${volume * 100}%, #1e293b 100%)`
            }}
          />
        </div>
      </div>

    </div>
  );
};
