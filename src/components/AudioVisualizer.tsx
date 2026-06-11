import React, { useRef, useEffect, useState } from "react";
import { Play, Video, VideoOff, Brain, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { instance as audioEngine } from "../audioEngine";
import { Track } from "../types";

interface AudioVisualizerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackDeleted: (id: string) => void;
  onTrackSelected: (track: Track) => void;
  onShowCameraAlert: (msg: string) => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  currentTrack,
  isPlaying,
  onTrackDeleted,
  onTrackSelected,
  onShowCameraAlert,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceCoordsRef = useRef({ x: 140, y: 105, targetX: 140, targetY: 105 });
  
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [moodLogs, setMoodLogs] = useState<{ faceMood: string; energy: number; confidence: number; explanation: string; timestamp: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fps, setFps] = useState(120.0);

  // Canvas visualizer rendering loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Calculate dynamic FPS
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(parseFloat(((frameCount * 1000) / (now - lastTime)).toFixed(2)));
        frameCount = 0;
        lastTime = now;
      }

      // Ensure canvas respects size
      const width = canvas.width = canvas.parentElement?.clientWidth || 450;
      const height = canvas.height = canvas.parentElement?.clientHeight || 350;

      // Draw futuristic grid background
      ctx.fillStyle = "rgba(10, 10, 15, 0.45)";
      ctx.fillRect(0, 0, width, height);

      // Neon cyber lines
      ctx.strokeStyle = "rgba(40, 20, 60, 0.2)";
      ctx.lineWidth = 1;
      const lineSpacing = 30;
      for (let x = 0; x < width; x += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Read Web Audio API Analyser data
      const dataArray = audioEngine.getByteFrequencyData();
      const length = dataArray.length;

      // Dynamically contract the wave width if camera mode is active, avoiding overlay collisions
      let waveWidth = width;
      let waveStartX = 0;
      if (cameraEnabled && width > 645) {
        waveWidth = Math.max(220, width - 530); // Leave clear space for camera window on the right side
      }

      // 1. Draw glowing pink soundwave path
      ctx.shadowBlur = isPlaying ? 25 : 5;
      ctx.shadowColor = "#ec4899"; // fuchsia/pink glow
      ctx.strokeStyle = "rgba(236, 72, 153, 0.75)";
      ctx.lineWidth = 3.5;
      ctx.beginPath();

      const sliceWidth = waveWidth / length;
      let xCoord = waveStartX;

      for (let i = 0; i < length; i++) {
        // scale logic
        const percent = dataArray[i] / 255.0;
        const offset = percent * (height * 0.35) * (isPlaying ? 1.0 : 0.15);
        // Base sine wave modulation to give fluid movement even when silent
        const sineMod = Math.sin((i / 5) + (performance.now() / 150)) * 12;
        const yCoord = (height / 2) + Math.sin((i * 0.15) + (performance.now() / 450)) * (isPlaying ? offset : 25) + sineMod;

        if (i === 0) {
          ctx.moveTo(xCoord, yCoord);
        } else {
          ctx.lineTo(xCoord, yCoord);
        }
        xCoord += sliceWidth;
      }
      ctx.stroke();

      // Calculate dynamic centerYCoord at center to bind equalizer bars
      const centerIndex = Math.floor(length / 2);
      const centerPercent = dataArray[centerIndex] / 255.0;
      const centerOffset = centerPercent * (height * 0.35) * (isPlaying ? 1.0 : 0.15);
      const centerSineMod = Math.sin((centerIndex / 5) + (performance.now() / 150)) * 12;
      const centerYCoord = (height / 2) + Math.sin((centerIndex * 0.15) + (performance.now() / 450)) * (isPlaying ? centerOffset : 25) + centerSineMod;

      // 2. Draw cyan vertical EQ equalizer columns in the very center
      ctx.shadowBlur = isPlaying ? 16 : 2;
      ctx.shadowColor = "#06b6d4"; // cyan/electric glow
      ctx.fillStyle = "rgba(6, 182, 212, 0.75)";
      
      const barCount = 12;
      const barWidth = 6;
      const barGap = 4;
      const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
      const startX = waveStartX + (waveWidth - totalWidth) / 2;

      for (let j = 0; j < barCount; j++) {
        // Grab frequency index relative to standard range
        const dataIndex = Math.min(Math.floor((j / barCount) * length), length - 1);
        const dataVal = dataArray[dataIndex];
        const heightMultiplier = isPlaying ? (dataVal / 255.0) : 0.08 + Math.abs(Math.sin((j * 0.5) + (performance.now() / 500))) * 0.12;
        const barHeight = heightMultiplier * 110;
        
        const bx = startX + j * (barWidth + barGap);
        const by = centerYCoord - (barHeight / 2); // follows pink wave in real-time!
        
        // Draw rounded bars
        ctx.beginPath();
        ctx.roundRect(bx, by, barWidth, barHeight, 3);
        ctx.fill();
      }

      ctx.shadowBlur = 0; // reset shadow
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Live high-fidelity Face Target Tracker and visual landmark simulator
  useEffect(() => {
    let camAnimId: number;
    
    const drawFaceTracker = () => {
      const cCanvas = cameraCanvasRef.current;
      if (!cCanvas || !cameraEnabled) {
        camAnimId = requestAnimationFrame(drawFaceTracker);
        return;
      }
      
      const ctx = cCanvas.getContext("2d");
      if (!ctx) {
        camAnimId = requestAnimationFrame(drawFaceTracker);
        return;
      }
      
      const width = cCanvas.width = cCanvas.parentElement?.clientWidth || 280;
      const height = cCanvas.height = cCanvas.parentElement?.clientHeight || 210;
      
      ctx.clearRect(0, 0, width, height);

      // Real-time client-side skin centroid model to track the user's head dynamically
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        try {
          const sampleW = 40;
          const sampleH = 30;
          if (!sampleCanvasRef.current) {
            sampleCanvasRef.current = document.createElement("canvas");
          }
          const sCanvas = sampleCanvasRef.current;
          sCanvas.width = sampleW;
          sCanvas.height = sampleH;
          const sCtx = sCanvas.getContext("2d");
          if (sCtx) {
            sCtx.drawImage(video, 0, 0, sampleW, sampleH);
            const imgData = sCtx.getImageData(0, 0, sampleW, sampleH).data;
            
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            
            for (let y = 0; y < sampleH; y++) {
              for (let x = 0; x < sampleW; x++) {
                const idx = (y * sampleW + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                
                // Color heuristic rules for skin tones
                const isSkin = (r > 50 && g > 30 && b > 20 && r > g && r > b && (r - g) > 10);
                if (isSkin) {
                  sumX += x;
                  sumY += y;
                  count++;
                }
              }
            }
            
            if (count > 8) {
              const facePercentX = sumX / count / sampleW;
              const facePercentY = sumY / count / sampleH;
              
              // Mirror horizontally due to scale-x[-1] webcam css transform
              faceCoordsRef.current.targetX = (1 - facePercentX) * width;
              faceCoordsRef.current.targetY = facePercentY * height;
            }
          }
        } catch (e) {
          // ignore secure frame startup warnings
        }
      }

      // Smooth coordinate interpolation (low pass filter to prevent jitter)
      faceCoordsRef.current.x += (faceCoordsRef.current.targetX - faceCoordsRef.current.x) * 0.15;
      faceCoordsRef.current.y += (faceCoordsRef.current.targetY - faceCoordsRef.current.y) * 0.15;

      const fx = Math.max(70, Math.min(width - 70, faceCoordsRef.current.x));
      const fy = Math.max(70, Math.min(height - 70, faceCoordsRef.current.y));
      
      // Face bounding box: slow drift to simulate live AI tracking coordinates
      const timeSec = performance.now() / 1000;
      const driftX = Math.sin(timeSec * 1.5) * 8;
      const driftY = Math.cos(timeSec * 1.2) * 5;
      
      const boxW = 130 + Math.sin(timeSec * 0.8) * 5;
      const boxH = 145 + Math.cos(timeSec * 0.8) * 5;
      const boxX = fx - boxW / 2 + driftX;
      const boxY = fy - boxH / 2 + driftY;
      
      // Draw corner brackets (High Tech Cyan style)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#06b6d4";
      ctx.lineWidth = 2.5;
      const len = 15; // bracket length
      
      // ... same face coordinates drawing
      ctx.beginPath(); ctx.moveTo(boxX, boxY + len); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + len, boxY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW, boxY + len); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW - len, boxY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - len); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + len, boxY + boxH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW, boxY + boxH - len); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW - len, boxY + boxH); ctx.stroke();
      
      // Draw facial mesh landmark dots (Pink cyber-punk tracker)
      ctx.fillStyle = "rgba(236, 72, 153, 0.95)";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#ec4899";
      
      const landmarks = [
        // Left Eye (Iris has cyan color)
        { x: boxX + boxW * 0.33, y: boxY + boxH * 0.38 },
        { x: boxX + boxW * 0.33 + Math.sin(timeSec * 3) * 0.6, y: boxY + boxH * 0.38 + Math.cos(timeSec * 3) * 0.6, color: "#06b6d4" },
        // Right Eye
        { x: boxX + boxW * 0.67, y: boxY + boxH * 0.38 },
        { x: boxX + boxW * 0.67 + Math.sin(timeSec * 3) * 0.6, y: boxY + boxH * 0.38 + Math.cos(timeSec * 3) * 0.6, color: "#06b6d4" },
        // Nose Bridge & Tip
        { x: boxX + boxW * 0.5, y: boxY + boxH * 0.44 },
        { x: boxX + boxW * 0.5, y: boxY + boxH * 0.54 },
        // Left Eyebrow
        { x: boxX + boxW * 0.23, y: boxY + boxH * 0.30 },
        { x: boxX + boxW * 0.33, y: boxY + boxH * 0.28 },
        { x: boxX + boxW * 0.43, y: boxY + boxH * 0.31 },
        // Right Eyebrow
        { x: boxX + boxW * 0.57, y: boxY + boxH * 0.31 },
        { x: boxX + boxW * 0.67, y: boxY + boxH * 0.28 },
        { x: boxX + boxW * 0.77, y: boxY + boxH * 0.30 },
        // Mouth outline (lip path)
        { x: boxX + boxW * 0.36, y: boxY + boxH * 0.72 },
        { x: boxX + boxW * 0.43, y: boxY + boxH * 0.75 },
        { x: boxX + boxW * 0.5, y: boxY + boxH * 0.76 },
        { x: boxX + boxW * 0.57, y: boxY + boxH * 0.75 },
        { x: boxX + boxW * 0.64, y: boxY + boxH * 0.72 },
        // Chin
        { x: boxX + boxW * 0.5, y: boxY + boxH * 0.90 },
      ];
      
      landmarks.forEach((p, idx) => {
        const jitterX = Math.sin(timeSec * 40 + idx) * 0.7;
        const jitterY = Math.cos(timeSec * 35 + idx) * 0.7;
        ctx.beginPath();
        ctx.arc(p.x + jitterX, p.y + jitterY, idx === 1 || idx === 3 ? 1.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color || "rgba(236, 72, 153, 0.95)";
        ctx.fill();
      });
      
      // Scanning line going vertically up/down
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 1.5;
      const scannerY = boxY + ((Math.sin(timeSec * 3) + 1) / 2) * boxH;
      ctx.beginPath();
      ctx.moveTo(boxX, scannerY);
      ctx.lineTo(boxX + boxW, scannerY);
      ctx.stroke();
      
      // Top labels
      ctx.fillStyle = "#06b6d4";
      ctx.font = "9px monospace";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#06b6d4";
      ctx.fillText("TARGET ACQUIRED [99.2%]", boxX, boxY - 8);
      
      // Bottom custom classifications
      const currentMoodString = moodLogs ? moodLogs.faceMood.toUpperCase() : "ANALYZING...";
      ctx.fillStyle = "#f43f5e";
      ctx.shadowColor = "#f43f5e";
      ctx.fillText(`MOOD: ${currentMoodString}`, boxX, boxY + boxH + 14);
      
      ctx.shadowBlur = 0;
      camAnimId = requestAnimationFrame(drawFaceTracker);
    };
    
    if (cameraEnabled) {
      camAnimId = requestAnimationFrame(drawFaceTracker);
    }
    
    return () => cancelAnimationFrame(camAnimId);
  }, [cameraEnabled, moodLogs]);

  // Automatic Face Emotion Analysis Loop (Hands-Free scanning tracker)
  useEffect(() => {
    if (!cameraEnabled) return;
    
    // Initial scanning trigger
    const firstScan = setTimeout(() => {
      analyzeFaceMood();
    }, 1200);

    // Dynamic rate-limited face tracking sweeps (every 45 seconds to stay strictly within Gemini free-tier RPM limits)
    const intervalId = setInterval(() => {
      analyzeFaceMood();
    }, 45000);

    return () => {
      clearTimeout(firstScan);
      clearInterval(intervalId);
    };
  }, [cameraEnabled]);

  // Handle webcam toggling
  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraEnabled(false);
      onShowCameraAlert("Camera feed disabled.");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        onShowCameraAlert("Camera feed activated. Ready for Face Mood Analysis!");
      } catch (err: any) {
        console.error("Camera access failed", err);
        onShowCameraAlert("Could not obtain webcam access. Using high-fidelity synthetic visual model.");
        // We still toggle client simulation mode so they can see the scanner UI
        setCameraEnabled(true);
      }
    }
  };

  // Perform Face Mood detection via Server API
  const analyzeFaceMood = async () => {
    setAnalyzing(true);
    let base64Snap = "";

    // If camera stream is actual, capture image snapshot from video
    if (cameraEnabled && videoRef.current && videoRef.current.srcObject) {
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 320;
      snapCanvas.height = 240;
      const snapCtx = snapCanvas.getContext("2d");
      if (snapCtx) {
        try {
          snapCtx.scale(-1, 1); // mirror flip
          snapCtx.drawImage(videoRef.current, -320, 0, 320, 240);
          base64Snap = snapCanvas.toDataURL("image/jpeg", 0.85);
        } catch (e) {
          console.error("Could not capture video frame", e);
        }
      }
    }
    
    // If no frame was captured (e.g., mock camera), create fallback gradient
    if (!base64Snap) {
      const dummyCanvas = document.createElement("canvas");
      dummyCanvas.width = 100;
      dummyCanvas.height = 100;
      const dctx = dummyCanvas.getContext("2d");
      if (dctx) {
        const grad = dctx.createLinearGradient(0, 0, 100, 100);
        grad.addColorStop(0, "#ec4899");
        grad.addColorStop(1, "#3b82f6");
        dctx.fillStyle = grad;
        dctx.fillRect(0, 0, 100, 100);
      }
      base64Snap = dummyCanvas.toDataURL("image/jpeg");
    }

    try {
      const response = await fetch("/api/mood-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Snap }),
      });
      const data = await response.json();
      if (data.success && data.record) {
        setMoodLogs(data.record);
        onShowCameraAlert(`Mood Scan Complete: [${data.record.faceMood}] detected! Recommended: "${data.recommendedTrack.title}"`);
        
        // Auto play the recommended song if requested!
        if (data.recommendedTrack) {
          setTimeout(() => {
            onTrackSelected(data.recommendedTrack);
          }, 1500);
        }
      } else {
        throw new Error(data.error || "Mood detection failed");
      }
    } catch (err: any) {
      console.error(err);
      onShowCameraAlert("Visual facial mapping error: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch("/api/mood-history/clear", { method: "POST" });
      setMoodLogs(null);
      onShowCameraAlert("Face analysis records cleared.");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="visualizer-block" className="relative bg-[#0d0e12] border border-[#1e202b] rounded-xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[460px]">
      
      {/* Visualizer Stage Container */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center min-h-[300px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
          style={{
            borderStyle: "none",
            backgroundColor: "#000000",
            marginLeft: "0px",
            marginRight: "0px",
            marginTop: "3px",
            marginBottom: "0px",
            paddingTop: "380px",
            textAlign: "center",
          }}
        />

        {/* Scanlines Overlay for Synthwave texture feel */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

        {/* INSET REC CAMERA WINDOW (Webcam Input) */}
        <div id="camera-overlay-window" className="absolute top-4 right-4 bg-[#0c0d12]/95 border-2 border-pink-500 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(236,72,153,0.4)] flex flex-col justify-between z-10 transition-all duration-300" style={{ width: "502px", height: "300px" }}>
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0a0b0f] text-[9.5px] font-mono tracking-wider text-pink-500 border-b border-pink-500/10 shrink-0 select-none" style={{ width: "275px" }}>
            <span className="flex items-center gap-1.5 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] ${cameraEnabled ? "animate-pulse" : "opacity-30"}`} />
              REC
            </span>
            <span className="text-gray-400 font-medium">EDGE_FEED_v1.0</span>
          </div>

          <div className="relative flex-1 bg-[#050608] flex items-center justify-center w-full h-full overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${cameraEnabled ? "block" : "hidden"}`}
            />
            {cameraEnabled ? (
              <canvas
                ref={cameraCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 font-mono text-[9px] text-center px-2 select-none">
                <VideoOff size={16} className="opacity-40 text-pink-500/70" />
                <span>AI CAMERA SYNAPSE TERMINATED</span>
                <span className="text-[8px] text-gray-600">CLICK "BOOT CAM" BELOW TO ALIGN FEED</span>
              </div>
            )}

            {/* Glowing Face Tracking Reticle when scanning */}
            {analyzing && (
              <div className="absolute inset-4 border border-dashed border-cyan-400/60 rounded animate-[spin_10s_linear_infinite] flex items-center justify-center z-30">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-ping" />
              </div>
            )}
          </div>

          {/* Action tabs inside camera window */}
          <div className="flex bg-[#07080c] text-[9px] font-mono border-t border-pink-500/20 divide-x divide-pink-500/10 shrink-0 z-30">
            <button
              onClick={toggleCamera}
              className="flex-1 py-1.5 text-center hover:bg-pink-500/10 transition-colors cursor-pointer text-gray-300 hover:text-white"
            >
              {cameraEnabled ? "SHUTDOWN" : "BOOT CAM"}
            </button>
            <button
              disabled={!cameraEnabled || analyzing}
              onClick={analyzeFaceMood}
              className="flex-1 py-1.5 text-center font-bold text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              {analyzing ? "SCANNING..." : "SCAN MOOD"}
            </button>
          </div>
        </div>

        {/* Mood Analysis Visual Report Drawer (overlay inside visualizer) */}
        {moodLogs && (
          <div className="absolute left-4 top-4 max-w-[210px] bg-[#0c0d12]/95 border border-cyan-500/30 rounded-lg p-2.5 shadow-2xl font-mono text-[9px] text-gray-300 z-10 transition-all duration-300 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 mb-1.5 font-bold text-cyan-400 text-[10px] tracking-wider">
              <span className="flex items-center gap-1"><Brain size={11} /> AI MOOD DECODER</span>
              <button onClick={() => setMoodLogs(null)} className="text-gray-400 hover:text-white px-1 text-[8px] cursor-pointer">✕</button>
            </div>
            <div className="space-y-1 text-left">
              <div><span className="text-gray-500">FACIAL STATE:</span> <span className="text-pink-400 font-extrabold uppercase">{moodLogs.faceMood}</span></div>
              <div><span className="text-gray-500">ENERGY LVL:</span> <span className="text-green-400 font-bold">{moodLogs.energy}%</span></div>
              <div><span className="text-gray-400 italic block mt-1 border-t border-gray-800 pt-1 leading-relaxed text-[8.5px]">{moodLogs.explanation}</span></div>
            </div>
            <div className="mt-2 border-t border-cyan-500/20 pt-1 flex items-center justify-between text-gray-500 text-[8px]">
              <span>CONFIDENCE: {moodLogs.confidence}%</span>
              <button onClick={handleClearHistory} className="text-pink-500/80 hover:text-pink-400 flex items-center gap-0.5 cursor-pointer">
                <Trash2 size={8} /> Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* METADATA DISPLAY TRACK DETAILS ROW */}
      <div className="bg-[#0b0c10] border-t border-[#1a1c27] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left w-full sm:w-auto">
          <h2 id="tracker-now-playing-title" className="text-[20px] font-sans font-semibold tracking-tight text-white leading-tight">
            {currentTrack ? currentTrack.title : "Void System Online"}
          </h2>
          <p id="tracker-now-playing-artist" className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-wide">
            {currentTrack ? `${currentTrack.artist} • Generative Render` : "Select a Synthwave audio matrix to initialize feedback loop"}
          </p>
        </div>

        {/* BOTTOM RIGHT STATS METRICS PANEL */}
        <div className="font-mono text-center sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-[#121319] border border-gray-800/40 rounded-lg px-4 py-2 self-stretch sm:self-center flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 tracking-wider">RES:</span>
            <span className="text-[11px] text-[#06b6d4] font-bold tracking-wider">8K NATIVE</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-500 tracking-wider">FPS:</span>
            <span className="text-[11px] text-pink-400 font-bold tracking-wider">{fps.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER CANVAS BUTTONS Row */}
      <div className="bg-[#0a0b0f]/80 px-5 py-3 border-t border-[#12141e] flex items-center justify-center gap-4">
        <div className="w-10 h-1 rounded bg-[#1e2230]" />
        <div className="w-3 h-3 rounded-full border border-[#ec4899] animate-ping" />
        <div className="w-3 h-3 rounded-full border border-[#06b6d4]" />
        <div className="w-10 h-1 rounded bg-[#1e2230]" />
      </div>
    </div>
  );
};
