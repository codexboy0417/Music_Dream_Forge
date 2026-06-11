import React, { useState, useEffect } from "react";
import { Sliders, Video, Settings, ShieldAlert, CheckCircle, Bell } from "lucide-react";
import { Track, ApiConfig } from "./types";
import { instance as audioEngine } from "./audioEngine";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { PlaybackSuite } from "./components/PlaybackSuite";
import { MusicUploader } from "./components/MusicUploader";
import { ApiController } from "./components/ApiController";
import { SongRegistry } from "./components/SongRegistry";

export default function App() {
  // State management
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<"info" | "success" | "error">("info");
  
  const [canvasModeActive, setCanvasModeActive] = useState(false);

  // Initialize and load tracks / config
  useEffect(() => {
    fetchTracks();
    fetchApiConfig();
    
    // Default system boot notifier
    triggerAlert("Welcome to DreamForge Core. Digital synth systems online.", "success");
    
    return () => {
      audioEngine.stop();
    };
  }, []);

  const fetchTracks = async () => {
    try {
      const resp = await fetch("/api/tracks");
      const data = await resp.json();
      setTracks(data);
      // set current track if none active
      if (data.length > 0 && !currentTrack) {
        setCurrentTrack(data[0]);
      }
    } catch (e) {
      console.error("Could not fetch tracks index", e);
      triggerAlert("Failed to synchronization track manifest with server db.", "error");
    }
  };

  const fetchApiConfig = async () => {
    try {
      const resp = await fetch("/api/api-config");
      const data = await resp.json();
      setApiConfig(data);
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Could not fetch API configuration block", e);
    }
  };

  const triggerAlert = (msg: string, type: "info" | "success" | "error" = "info") => {
    setAlertMessage(msg);
    setAlertType(type);
    
    // auto dismiss
    setTimeout(() => {
      setAlertMessage((current) => (current === msg ? null : current));
    }, 6000);
  };

  // Playback Operations
  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    audioEngine.playTrack(
      track,
      (time) => {
        setCurrentTime(time);
      },
      () => {
        // onEnd callback: auto transition to next song
        handleNextTrack();
      }
    );
    
    // Fetch logs to sync
    fetchApiConfig();
    
    // Call server to increment play
    fetch(`/api/tracks/${track.id}/increment-play`, { method: "POST" })
      .then(() => fetchTracks())
      .catch((e) => console.error(e));
  };

  const handlePlayPauseToggle = () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        handlePlayTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      triggerAlert("Sound output stream suspended.", "info");
    } else {
      audioEngine.resume();
      setIsPlaying(true);
      triggerAlert("Synth flow initialized.", "success");
    }
  };

  const handleNextTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    handlePlayTrack(tracks[prevIndex]);
  };

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
    audioEngine.setVolume(nextVolume);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const resp = await fetch(`/api/tracks/${id}/toggle-favorite`, {
        method: "PATCH",
      });
      const data = await resp.json();
      if (data.success) {
        // reload tracks
        fetchTracks();
        triggerAlert(
          data.track.isFavorite
            ? `Favorited: "${data.track.title}"`
            : `Removed Favourite: "${data.track.title}"`,
          "success"
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTrackDeleted = async (id: string) => {
    if (confirm("Are you sure you want to retire this track asset from the Cloud database?")) {
      try {
        const resp = await fetch(`/api/tracks/${id}`, { method: "DELETE" });
        const data = await resp.json();
        if (data.success) {
          triggerAlert("Removed song resource index successfully.", "success");
          
          // Re-evaluate current tracker
          if (currentTrack?.id === id) {
            audioEngine.stop();
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentTrack(null);
          }
          fetchTracks();
          fetchApiConfig();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUploadSuccess = (newTrack: Track) => {
    fetchTracks();
    fetchApiConfig();
    // Auto-select and play uploaded tracks
    handlePlayTrack(newTrack);
  };

  const handleConfigSaved = (updatedConfig: any) => {
    setApiConfig(updatedConfig);
    if (updatedConfig.logs) {
      setLogs(updatedConfig.logs);
    }
    fetchApiConfig();
  };

  return (
    <div id="dreamforge-root" className="min-h-screen w-full bg-[#07080c] text-white flex flex-col font-sans select-none overflow-x-hidden antialiased">
      
      {/* Alert Top-Floating Action Drawer */}
      {alertMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl bg-black/90 backdrop-blur-md animate-bounce font-mono text-[10.5px] max-w-[90vw]">
          {alertType === "success" ? (
            <CheckCircle size={15} className="text-green-400" />
          ) : alertType === "error" ? (
            <ShieldAlert size={15} className="text-red-400" />
          ) : (
            <Bell size={15} className="text-cyan-400" />
          )}
          <span className="text-gray-100 tracking-wide">{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-gray-500 hover:text-white px-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* HEADER SECTION BAR */}
      <header className="border-b border-[#141621] bg-[#07080c]/90 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        
        {/* LOGO TITLE WITH AUDIO PULSE */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <div className="w-full h-full bg-[#090b10] rounded-[10px] flex items-center justify-center">
              <Sliders size={18} className="text-pink-500" />
            </div>
          </div>
          <span className="text-[20px] font-sans font-extrabold tracking-tight text-white leading-none">
            DreamForge
          </span>
        </div>

        {/* MIDDLE ACTIONS: [🎬 CANVAS MODE] */}
        <button
          onClick={() => {
            setCanvasModeActive(!canvasModeActive);
            triggerAlert(
              canvasModeActive ? "Canvas Overlay Mode Inactivated." : "Canvas Overlay Mode Activated. Full screen visual spectrum aligned.",
              "info"
            );
          }}
          className={`px-5 py-2 rounded-lg border font-mono text-[11px] tracking-widest uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            canvasModeActive
              ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              : "border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 bg-[#0f111a]"
          }`}
        >
          <Video size={13} className={canvasModeActive ? "animate-pulse text-white" : "text-gray-400"} />
          CANVAS MODE
        </button>

        {/* RIGHT CAPABILITIES AND PROFILE */}
        <div className="flex items-center gap-4.5">
          <button onClick={() => triggerAlert("External Video Capture Device available for real-time mood scanning.", "info")} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <Video size={16} />
          </button>
          
          <button onClick={() => triggerAlert("Settings and credential sync is fully integrated inside left terminal panel panels.", "info")} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <Settings size={16} />
          </button>

          {/* Profiler avatar matching mock */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
              alt="DreamForge User Profile"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </header>

      {/* CORE DISPLAY MAIN BODY COMPLEMENTS */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN PANEL: UPLOADER, API, MASTER CONTROLS (cols 3) */}
        <div className="lg:col-span-3 flex flex-col gap-5 justify-between">
          <MusicUploader
            onUploadSuccess={handleUploadSuccess}
            onShowAlert={(msg) => triggerAlert(msg, "info")}
          />
          
          <ApiController
            logs={logs}
            config={apiConfig}
            onConfigSaved={handleConfigSaved}
            onShowAlert={(msg) => triggerAlert(msg, "success")}
          />

          <PlaybackSuite
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlayPauseToggle={handlePlayPauseToggle}
            onPrevTrack={handlePrevTrack}
            onNextTrack={handleNextTrack}
            onVolumeChange={handleVolumeChange}
            volume={volume}
            onSeek={handleSeek}
          />
        </div>

        {/* CENTER HIGH-SPEED AUDIO VISUALIZER GRAPHICS (cols 5) */}
        <div className={`${canvasModeActive ? "lg:col-span-9" : "lg:col-span-5"} flex flex-col`}>
          <AudioVisualizer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTrackDeleted={handleTrackDeleted}
            onTrackSelected={handlePlayTrack}
            onShowCameraAlert={(msg) => triggerAlert(msg, "info")}
          />
        </div>

        {/* RIGHT COLUMN LIST REGISTRY (cols 4, hidden or repositioned if canvas full mode active) */}
        {!canvasModeActive && (
          <div className="lg:col-span-4 flex flex-col">
            <SongRegistry
              tracks={tracks}
              currentTrack={currentTrack}
              onTrackSelected={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onTrackDeleted={handleTrackDeleted}
            />
          </div>
        )}

      </main>

    </div>
  );
}
