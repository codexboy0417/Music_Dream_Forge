// Web Audio API procedural synthesizer and playbacks manager
import { Track } from "./types";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  
  // Procedural synth states
  private synthInterval: any = null;
  private isPlayingProcedural = false;
  private currentStep = 0;
  private tempo = 120; // BPM
  private synthTime = 0;
  
  // HTML5 audio elements for uploaded tracks
  private audioNode: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  
  // Observers for real-time visualization data
  private onTimeUpdateCallback: ((currentTime: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {}

  init() {
    if (this.ctx) return;
    try {
      // Create audio context
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.connect(this.ctx.destination);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  getAnalyser(): AnalyserNode | null {
    this.init();
    return this.analyserNode;
  }

  getByteFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(128).map(() => Math.floor(Math.random() * 20));
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  playTrack(track: Track, onTimeUpdate: (current: number) => void, onEnded: () => void) {
    this.init();
    this.stop();

    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndCallback = onEnded;

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (track.sourceUrl.startsWith("/api/synth/")) {
      // Play procedurally generated synth-wave
      this.isPlayingProcedural = true;
      this.startProceduralSynth(track.id);
    } else {
      // Play standard HTML5 audio file uploaded locally
      this.isPlayingProcedural = false;
      this.playLocalFile(track.sourceUrl);
    }
  }

  setVolume(volume: number) {
    // volume is 0 to 1
    if (this.audioNode) {
      this.audioNode.volume = volume;
    }
  }

  seek(time: number) {
    if (this.audioNode) {
      this.audioNode.currentTime = time;
    } else if (this.isPlayingProcedural) {
      this.synthTime = time;
      const stepDuration = (60 / this.tempo) / 4;
      this.currentStep = Math.floor(time / stepDuration) % 16;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthTime);
      }
    }
  }

  stop() {
    this.stopProceduralSynth();
    if (this.audioNode) {
      this.audioNode.pause();
      this.audioNode.src = "";
      this.audioNode = null;
    }
  }

  pause() {
    if (this.isPlayingProcedural) {
      this.isPlayingProcedural = false;
      this.stopProceduralSynth();
    } else if (this.audioNode) {
      this.audioNode.pause();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    
    // Resume depends on tracks
    if (this.audioNode) {
      this.audioNode.play().catch(e => console.error("Error resuming local file", e));
    } else {
      // Default fallback
      this.isPlayingProcedural = true;
      this.startProceduralSynth("quantum-pulse");
    }
  }

  // --- HTML5 Audio Files Player ---
  private playLocalFile(url: string) {
    try {
      this.audioNode = new Audio(url);
      this.audioNode.crossOrigin = "anonymous";
      
      if (this.ctx && this.analyserNode) {
        try {
          this.mediaSource = this.ctx.createMediaElementSource(this.audioNode);
          this.mediaSource.connect(this.analyserNode);
        } catch (e) {
          // If already connected or failed, connect directly fallback
          console.warn("Direct connection fallback required", e);
        }
      }

      this.audioNode.addEventListener("timeupdate", () => {
        if (this.audioNode && this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.audioNode.currentTime);
        }
      });

      this.audioNode.addEventListener("ended", () => {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      });

      this.audioNode.play().catch(e => {
        console.error("Audio playback failed, user interaction is required.", e);
      });
    } catch (e) {
      console.error("Failed to play audio source", e);
    }
  }

  // --- Procedural SynthWave Generator ---
  private startProceduralSynth(trackId: string) {
    if (!this.ctx || !this.analyserNode) return;
    
    this.isPlayingProcedural = true;
    this.currentStep = 0;
    this.synthTime = 0;
    
    const intervalMs = (60 / this.tempo) * 1000 / 4; // 16th notes

    // Trigger update ticker
    this.synthInterval = setInterval(() => {
      if (!this.isPlayingProcedural) return;
      
      this.synthTime += intervalMs / 1000;
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthTime);
      }

      // Procedural synthesizers
      try {
        this.synthStep(trackId);
      } catch (err) {
        console.error("Procedural synth error", err);
      }
      
      this.currentStep = (this.currentStep + 1) % 16;
    }, intervalMs);
  }

  private stopProceduralSynth() {
    this.isPlayingProcedural = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  // Synthesis steps generating retro soundware!
  private synthStep(trackId: string) {
    if (!this.ctx || !this.analyserNode) return;

    const t = this.ctx.currentTime;

    // 1. Cyber Kick Drum (on beats 0, 4, 8, 12)
    if (this.currentStep % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.analyserNode);

      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.start(t);
      osc.stop(t + 0.16);
    }

    // 2. High hat (shuffling)
    if (this.currentStep % 2 === 1) {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.currentStep % 4 === 2 ? 0.08 : 0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.analyserNode);

      noise.start(t);
      noise.stop(t + 0.04);
    }

    // 3. Ambient Arpeggiator & Retro Lead Synthesizer
    let notes = [55, 57, 60, 62, 64, 67, 69, 72]; // Pentatonic space scale
    if (trackId === "grid-runner") {
      notes = [50, 53, 55, 57, 60, 62, 65, 67]; // Synthwave minor scale
    } else if (trackId === "liquid-state") {
      notes = [48, 52, 55, 59, 60, 64, 67, 71]; // Chill Major7 scale
    } else if (trackId === "void-echoes") {
      notes = [40, 45, 47, 48, 52, 53, 57, 59]; // Dark gothic drone scale
    }

    const noteIndex = Math.floor(Math.sin(this.currentStep * 0.7) * 4 + 4) % notes.length;
    const midiNote = notes[noteIndex];
    const freq = Math.pow(2, (midiNote - 69) / 12) * 440;

    // Arp step trigger (different densities)
    let triggerArp = false;
    if (trackId === "quantum-pulse") {
      triggerArp = this.currentStep % 3 === 0 || this.currentStep % 7 === 1;
    } else if (trackId === "grid-runner") {
      triggerArp = this.currentStep % 2 === 0;
    } else if (trackId === "liquid-state") {
      triggerArp = this.currentStep % 8 === 0 || this.currentStep === 12;
    } else {
      // Void echoes is very slow
      triggerArp = this.currentStep === 0;
    }

    if (triggerArp) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Cyber oscillators!
      osc.type = trackId === "void-echoes" ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(freq, t);

      // Lowpass sweeps
      filter.type = "lowpass";
      if (trackId === "liquid-state") {
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
      } else {
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.25);
      }
      filter.Q.value = 5;

      gain.gain.setValueAtTime(trackId === "void-echoes" ? 0.35 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (trackId === "liquid-state" ? 0.8 : 0.35));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.analyserNode);

      osc.start(t);
      osc.stop(t + (trackId === "liquid-state" ? 0.9 : 0.4));
    }

    // 4. Heavy analog sub-bass sweep (on steps 0, 8)
    if (this.currentStep % 8 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = "sawtooth";
      const bassFreq = Math.pow(2, ((notes[0] - 12) - 69) / 12) * 440; // octave below
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassFilter.type = "lowpass";
      bassFilter.frequency.setValueAtTime(110, t);
      bassFilter.frequency.exponentialRampToValueAtTime(350, t + 0.4);

      bassGain.gain.setValueAtTime(0.25, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.analyserNode);

      bassOsc.start(t);
      bassOsc.stop(t + 1.0);
    }
  }
}

export const instance = new AudioEngine();
