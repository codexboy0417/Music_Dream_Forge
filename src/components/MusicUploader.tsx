import React, { useState, useRef } from "react";
import { UploadCloud, Music, ArrowUpCircle } from "lucide-react";
import { Track } from "../types";

interface MusicUploaderProps {
  onUploadSuccess: (track: Track) => void;
  onShowAlert: (msg: string) => void;
}

export const MusicUploader: React.FC<MusicUploaderProps> = ({
  onUploadSuccess,
  onShowAlert,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const clickInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload file logic calling Express server standard multipart
  const uploadFile = async (file: File) => {
    // Validate if audio format roughly
    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3") && !file.name.endsWith(".wav") && !file.name.endsWith(".ogg") && !file.name.endsWith(".m4a")) {
      onShowAlert("Invalid file format. Please upload standard audio soundware.");
      return;
    }

    setUploading(true);
    onShowAlert(`Uploading track: "${file.name}"...`);

    const formData = new FormData();
    formData.append("audioFile", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("artist", "Local User");
    
    // Attempt to parse duration approximately (default metadata mockup or audio context reads)
    // We'll let the server default to 240 or read it
    formData.append("duration", "205"); 
    formData.append("style", "User Upload");

    try {
      const resp = await fetch("/api/tracks/upload", {
        method: "POST",
        body: formData,
      });

      const data = await resp.json();
      if (data.success && data.track) {
        onUploadSuccess(data.track);
        onShowAlert(`Successfully stored and integrated track: "${data.track.title}"!`);
      } else {
        throw new Error(data.error || "Upload connection refused");
      }
    } catch (err: any) {
      console.error(err);
      onShowAlert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div id="music-uploader-card" className="bg-[#0e0f14] border border-[#1d1f2b] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      
      {/* Box Header */}
      <div className="flex items-center gap-2 font-mono text-xs tracking-wider mb-4 border-b border-gray-800/40 pb-2.5">
        <UploadCloud size={15} className="text-pink-500" />
        <span className="text-gray-400 font-bold uppercase">MUSIC UPLOAD</span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={clickInput}
        className={`relative flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] group transition-all duration-300 ${
          isDragActive
            ? "border-pink-500 bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
            : "border-gray-800 hover:border-pink-500/50 hover:bg-[#121319]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2.5 font-mono text-xs">
            <RefreshSpinner />
            <span className="text-pink-500 animate-pulse font-bold">WRITING WAV METRIC...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#111219] border border-gray-800 flex items-center justify-center text-gray-400 group-hover:text-pink-500 group-hover:border-pink-500/30 transition-all duration-300 shadow-inner">
              <Music size={18} />
            </div>
            <div className="font-mono text-[11px] text-gray-400 tracking-wide leading-relaxed">
              <span className="block font-bold text-white mb-0.5 group-hover:text-pink-400 transition-colors">Drop 8K audio files here</span>
              or click to browse local files
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const RefreshSpinner = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <div className="absolute w-full h-full border-2 border-pink-500/10 rounded-full" />
    <div className="absolute w-full h-full border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    <ArrowUpCircle size={14} className="text-pink-500 animate-bounce" />
  </div>
);
