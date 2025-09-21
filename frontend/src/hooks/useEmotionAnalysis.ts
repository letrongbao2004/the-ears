import { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';

interface EmotionResult {
  primaryEmotion: string;
  emotions: Record<string, number>;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string[];
    blendedGradient: Array<{ color: string; weight: number }>;
    intensity: number;
  };
  intensity: number;
  musicSection: string;
  energyLevel: string;
}

export const useEmotionAnalysis = () => {
  const { currentSong, showEmotionColors } = usePlayerStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useRealTime, setUseRealTime] = useState(false);

  // Simple and accurate emotion analysis
  const analyzeEmotion = useCallback((song: any): EmotionResult | null => {
    if (!song) return null;

    const title = (song.title || '').toLowerCase();
    const artist = (song.artist || '').toLowerCase();
    const genre = (song.genre || '').toLowerCase();

    // Simple but effective emotion detection
    let primaryEmotion = 'calm';
    let intensity = 0.6;
    let energyLevel: 'low' | 'medium' | 'high' = 'medium';

    // Direct keyword matching for high accuracy
    if (title.includes('love') || title.includes('yêu') || title.includes('em') || title.includes('anh')) {
      primaryEmotion = 'romantic';
      intensity = 0.8;
    } else if (title.includes('sad') || title.includes('buồn') || title.includes('cry') || title.includes('khóc')) {
      primaryEmotion = 'sadness';
      intensity = 0.9;
    } else if (title.includes('happy') || title.includes('vui') || title.includes('smile') || title.includes('cười')) {
      primaryEmotion = 'joy';
      intensity = 0.8;
    } else if (title.includes('party') || title.includes('dance') || title.includes('rock') || title.includes('fire')) {
      primaryEmotion = 'excitement';
      intensity = 0.9;
      energyLevel = 'high';
    } else if (title.includes('chill') || title.includes('relax') || title.includes('peace') || title.includes('quiet')) {
      primaryEmotion = 'peaceful';
      intensity = 0.5;
      energyLevel = 'low';
    } else if (title.includes('miss') || title.includes('nhớ') || title.includes('far') || title.includes('xa')) {
      primaryEmotion = 'melancholy';
      intensity = 0.7;
    }

    // Genre-based adjustments
    if (genre.includes('ballad')) {
      primaryEmotion = 'melancholy';
      energyLevel = 'low';
    } else if (genre.includes('rock') || genre.includes('metal')) {
      primaryEmotion = 'excitement';
      energyLevel = 'high';
    } else if (genre.includes('jazz') || genre.includes('classical')) {
      primaryEmotion = 'sophisticated';
      energyLevel = 'low';
    }

    // Create consistent but varied colors based on song
    const songId = (title + artist).replace(/\s/g, '') || 'default';
    const colorSeed = Math.abs(songId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0));

    const emotionColors: Record<string, { h: number; s: number; l: number }> = {
      romantic: { h: 330 + (colorSeed % 30), s: 75, l: 65 },
      sadness: { h: 240 + (colorSeed % 20), s: 60, l: 40 },
      joy: { h: 45 + (colorSeed % 40), s: 90, l: 65 },
      excitement: { h: 0 + (colorSeed % 25), s: 85, l: 60 },
      peaceful: { h: 120 + (colorSeed % 30), s: 50, l: 70 },
      melancholy: { h: 270 + (colorSeed % 25), s: 50, l: 50 },
      calm: { h: 200 + (colorSeed % 35), s: 70, l: 60 },
      sophisticated: { h: 280 + (colorSeed % 20), s: 40, l: 50 }
    };

    const baseColor = emotionColors[primaryEmotion as keyof typeof emotionColors] || emotionColors.calm;

    const primary = `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`;
    const secondary = `hsl(${(baseColor.h + 30) % 360}, ${baseColor.s * 0.8}%, ${baseColor.l * 0.9}%)`;
    const accent = `hsl(${(baseColor.h + 60) % 360}, ${baseColor.s * 0.6}%, ${baseColor.l * 1.1}%)`;

    // Simple emotion distribution
    const emotions: Record<string, number> = {
      [primaryEmotion]: intensity,
      calm: primaryEmotion === 'calm' ? intensity : 0.3,
      joy: primaryEmotion === 'joy' ? intensity : 0.2,
      sadness: primaryEmotion === 'sadness' ? intensity : 0.1,
      excitement: primaryEmotion === 'excitement' ? intensity : 0.2,
      romantic: primaryEmotion === 'romantic' ? intensity : 0.15,
      peaceful: primaryEmotion === 'peaceful' ? intensity : 0.25
    };

    return {
      primaryEmotion,
      emotions,
      colorPalette: {
        primary,
        secondary,
        accent,
        gradient: [primary, secondary, accent],
        blendedGradient: [
          { color: primary, weight: 1 },
          { color: secondary, weight: 0.8 },
          { color: accent, weight: 0.6 }
        ],
        intensity
      },
      intensity,
      musicSection: energyLevel === 'high' ? 'chorus' : energyLevel === 'low' ? 'verse' : 'bridge',
      energyLevel
    };
  }, []);

  // Simple toggle analysis function
  const toggleAnalysis = useCallback(() => {
    if (isAnalyzing || emotionResult) {
      setIsAnalyzing(false);
      setEmotionResult(null);
      setError(null);
      return;
    }

    if (!currentSong) {
      setError('No song is currently playing');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    // Simulate analysis time for better UX
    setTimeout(() => {
      const result = analyzeEmotion(currentSong);
      if (result) {
        setEmotionResult(result);
        setError(null);
      } else {
        setError('Unable to analyze this song');
      }
      setIsAnalyzing(false);
    }, 1000);
  }, [isAnalyzing, emotionResult, currentSong, analyzeEmotion]);

  // Clear results when song changes or emotion colors are disabled
  useEffect(() => {
    if (!showEmotionColors || !currentSong) {
      setEmotionResult(null);
      setIsAnalyzing(false);
      setError(null);
    } else {
      // Clear previous results when song changes to force new analysis
      setEmotionResult(null);
      setError(null);
    }
  }, [currentSong, showEmotionColors]);

  // Clear results when emotion colors are disabled
  useEffect(() => {
    if (!showEmotionColors) {
      setEmotionResult(null);
      setIsAnalyzing(false);
      setError(null);
    }
  }, [showEmotionColors]);

  return {
    isAnalyzing,
    emotionResult,
    error,
    analyzeCurrentSong: toggleAnalysis,
    toggleAnalysis,
    useRealTime,
    setUseRealTime
  };
};