import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, Layers, Radio, Save } from "lucide-react";
import { ApiConfig } from "../types";

interface ApiControllerProps {
  logs: string[];
  config: ApiConfig | null;
  onConfigSaved: (config: Partial<ApiConfig>) => void;
  onShowAlert: (msg: string) => void;
}

export const ApiController: React.FC<ApiControllerProps> = ({
  logs,
  config,
  onConfigSaved,
  onShowAlert,
}) => {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [spotifyClientID, setSpotifyClientID] = useState("");
  const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
  const [spotifyEnabled, setSpotifyEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync inputs
  useEffect(() => {
    if (config) {
      setEndpoint(config.endpoint || "https://api.spotify.com/v1");
      setApiKey(config.apiKey || "");
      setSpotifyClientID(config.spotifyClientID || "");
      setSpotifyClientSecret(config.spotifyClientSecret || "");
      setSpotifyEnabled(config.spotifyEnabled || false);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: Partial<ApiConfig> = {
        endpoint,
        apiKey,
        spotifyClientID,
        spotifyClientSecret,
        spotifyEnabled,
        spotifyConfigured: !!(spotifyClientID && spotifyClientSecret),
      };

      const resp = await fetch("/api/api-config", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (data.success && data.apiConfig) {
        onConfigSaved(data.apiConfig);
        onShowAlert("API integrations updated successfully. System synchronized!");
      } else {
        throw new Error(data.error || "Save rejected");
      }
    } catch (err: any) {
      console.error(err);
      onShowAlert("API configuration failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="api-controller-card" className="bg-[#0e0f14] border border-[#1d1f2b] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      
      {/* Box Header */}
      <div className="flex items-center gap-2 font-mono text-xs tracking-wider mb-4 border-b border-gray-800/40 pb-2.5">
        <Radio size={15} className="text-[#06b6d4] animate-pulse" />
        <span className="text-gray-400 font-bold uppercase">EXTERNAL LIBRARY API</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Terminal Textarea Code Style */}
        <div className="relative font-mono text-[10px] bg-[#050608] border border-gray-800 rounded-lg p-3 overflow-hidden text-cyan-400/90 shadow-inner">
          <div className="absolute top-1 right-2 text-[8px] text-gray-600">CONSOLE_API</div>
          <div className="text-gray-500 mb-1">// Enter API endpoints or keys here...</div>
          <div className="flex items-center gap-1.5 text-pink-500/80 mb-2">
            <span>&gt; GET</span>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/v1/audio/stream"
              className="bg-transparent border-b border-cyan-500/10 focus:border-cyan-500/30 text-cyan-400 placeholder-gray-700 outline-none w-full text-[10px]"
            />
          </div>

          {/* Credentials Inputs stacked nicely inside Terminal box */}
          <div className="space-y-2.5 mt-2 border-t border-gray-900 pt-2.5 text-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">SPOTIFY_AUTH_MODE:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={spotifyEnabled}
                  onChange={(e) => setSpotifyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-950 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:peer-checked:after:bg-cyan-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-500/20 border border-gray-800" />
                <span className="ml-1.5 text-[8.5px] uppercase tracking-wide font-bold peer-checked:text-cyan-400 text-gray-500">
                  {spotifyEnabled ? "ACTIVE" : "STANDBY"}
                </span>
              </label>
            </div>

            {spotifyEnabled && (
              <div className="space-y-2 animate-fadeIn">
                <div>
                  <span className="text-gray-500 block mb-0.5">SPOTIFY_CLIENT_ID:</span>
                  <input
                    type="text"
                    value={spotifyClientID}
                    onChange={(e) => setSpotifyClientID(e.target.value)}
                    placeholder="e.g. 5f7bc746..."
                    className="w-full bg-[#08090d] border border-gray-800/80 rounded px-2 py-1 text-cyan-300 placeholder-cyan-900/40 outline-none text-[9.5px]"
                  />
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">SPOTIFY_SECRET:</span>
                  <input
                    type="password"
                    value={spotifyClientSecret}
                    onChange={(e) => setSpotifyClientSecret(e.target.value)}
                    placeholder="●●●●●●●●●●●●●●●●"
                    className="w-full bg-[#08090d] border border-gray-800/80 rounded px-2 py-1 text-pink-300 placeholder-pink-900/40 outline-none text-[9.5px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Console logs output buffer inside API editor */}
        <div className="bg-[#050608]/60 border border-gray-900/60 rounded-lg p-3 font-mono text-[9px] text-gray-500 max-h-[85px] overflow-y-auto space-y-1.5 text-left custom-scrollbar">
          {logs.slice(-3).map((log, index) => (
            <div key={index} className="flex gap-1.5 leading-relaxed">
              <span className="text-cyan-600 select-none">▮</span>
              <span>{log}</span>
            </div>
          ))}
        </div>

        {/* Submit Form Save Panel */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-400 border border-cyan-400/20 hover:border-cyan-400/40 font-mono text-[10px] tracking-widest py-2 rounded-lg transition-all duration-300 cursor-pointer uppercase flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          {isSaving ? (
            <RefreshCw size={11} className="animate-spin" />
          ) : (
            <Save size={11} />
          )}
          {isSaving ? "SYNCING..." : "COMMIT EXT CREDENTIALS"}
        </button>
      </form>

    </div>
  );
};
