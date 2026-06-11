export interface Track {
  id: string;
  title: string;
  artist: string;
  sourceUrl: string;
  isFavorite: boolean;
  playCount: number;
  duration: number; // in seconds
  style: string; // e.g. "Synthwave", "Ambient", "Cyberpunk"
  imageUrl: string; // base64, url, or special visual style
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  spotifyEnabled: boolean;
  spotifyConfigured: boolean;
  spotifyClientID?: string;
  spotifyClientSecret?: string;
  logs: string[];
}

export interface MoodRecord {
  id: string;
  timestamp: string;
  faceMood: string; // e.g., "Focused", "Relaxed", "Energetic", "Tired", "Pensive"
  energy: number; // 0 to 100
  confidence: number; // 0 to 100
  explanation: string;
  recommendedTrackId: string;
}

export interface DbSchema {
  tracks: Track[];
  apiConfig: ApiConfig;
  moodHistory: MoodRecord[];
}
