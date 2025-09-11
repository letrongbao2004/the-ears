import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type GenreResult } from '@/lib/audioAnalysis';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { Music, Zap, Volume2, Activity, Clock, BarChart3 } from 'lucide-react';

interface GenreClassifierProps {
  className?: string;
}

const GenreClassifierComponent = ({ className = '' }: GenreClassifierProps) => {
  const { currentSong } = usePlayerStore();
  const [genreResult, setGenreResult] = useState<GenreResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const analysisIdRef = useRef<number>(0);

  useEffect(() => {
    // Initialize Web Worker for non-blocking audio analysis
    try {
      workerRef.current = new Worker('/audioWorker.js');
      
      workerRef.current.onmessage = (e) => {
        const { id, success, result, error, stack } = e.data;
        
        if (id === analysisIdRef.current) {
          setIsAnalyzing(false);
          
          if (success) {
            console.log('Genre analysis completed:', result);
            setGenreResult(result);
            setError(null);
          } else {
            console.error('Analysis failed:', error, stack);
            setError(`Analysis failed: ${error}`);
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setIsAnalyzing(false);
        setError('Audio analysis worker failed to load');
      };
    } catch (error) {
      console.error('Failed to create Web Worker:', error);
      setError('Web Worker not supported in this browser');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const analyzeSong = useCallback(async () => {
    if (!currentSong?.audioUrl || !workerRef.current) {
      console.log('Missing requirements for analysis:', {
        hasSong: !!currentSong?.audioUrl,
        hasWorker: !!workerRef.current
      });
      return;
    }

    console.log('Starting genre analysis for:', currentSong.title);
    setIsAnalyzing(true);
    setError(null);

    let audioContext: AudioContext | null = null;
    let abortController: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Create abort controller for cancellation
      abortController = new AbortController();
      
      // Set timeout for analysis (30 seconds max)
      timeoutId = setTimeout(() => {
        if (abortController) {
          abortController.abort();
        }
        setIsAnalyzing(false);
        setError('Analysis timed out. Please try again with a shorter audio file.');
      }, 30000);
      
      // Create audio context and load the audio
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Fetching audio from:', currentSong.audioUrl);
      
      const response = await fetch(currentSong.audioUrl, {
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('Audio buffer size:', arrayBuffer.byteLength);
      
      // Check file size (limit to 50MB)
      if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
        throw new Error('Audio file too large (maximum 50MB)');
      }
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio buffer decoded:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });
      
      // Validate audio buffer
      if (audioBuffer.duration < 5) {
        throw new Error('Audio too short for reliable analysis (minimum 5 seconds)');
      }

      // Send to Web Worker for non-blocking processing
      analysisIdRef.current = Date.now();
      console.log('Sending to Web Worker for analysis...');
      
      // Convert AudioBuffer to transferable data
      const channelData = audioBuffer.getChannelData(0);
      
      // Limit analysis to first 15 seconds for faster performance
      const maxSamples = Math.min(channelData.length, audioBuffer.sampleRate * 15);
      const limitedData = channelData.slice(0, maxSamples);
      
      // Use transferable objects for better performance
      const transferableData = new Float32Array(limitedData);
      
      workerRef.current.postMessage({
        audioData: transferableData.buffer,
        sampleRate: audioBuffer.sampleRate,
        length: transferableData.length,
        id: analysisIdRef.current
      }, [transferableData.buffer]);

    } catch (err) {
      // Handle AbortError gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Audio analysis was cancelled');
        setError(null);
      } else {
        console.error('Genre analysis error:', err);
        setError(`Failed to analyze music genre: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      setIsAnalyzing(false);
    } finally {
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Clean up resources
      if (audioContext && audioContext.state !== 'closed') {
        try {
          await audioContext.close();
        } catch (e) {
          console.warn('Failed to close audio context:', e);
        }
      }
    }
  }, [currentSong?.audioUrl, currentSong?.title]);

  // Clear previous results when song changes
  useEffect(() => {
    if (currentSong) {
      setGenreResult(null);
      setError(null);
    }
  }, [currentSong?._id]);

  // Removed automatic analysis to prevent website overload
  // Analysis now only happens when user clicks the "Analyze" button

  const getGenreColor = (genre: string): string => {
    const colors: Record<string, string> = {
      'Pop': 'bg-pink-500',
      'Rock': 'bg-red-500',
      'Hip-Hop': 'bg-purple-500',
      'Electronic': 'bg-cyan-500',
      'Jazz': 'bg-yellow-500',
      'Classical': 'bg-blue-500',
      'Country': 'bg-green-500',
      'R&B': 'bg-orange-500',
      'Blues': 'bg-indigo-500',
      'Folk': 'bg-emerald-500',
      'Reggae': 'bg-lime-500',
      'Metal': 'bg-gray-500'
    };
    return colors[genre] || 'bg-gray-400';
  };

  const getGenreIcon = (genre: string) => {
    const icons: Record<string, React.ReactElement> = {
      'Pop': <Music className="w-4 h-4" />,
      'Rock': <Zap className="w-4 h-4" />,
      'Hip-Hop': <Volume2 className="w-4 h-4" />,
      'Electronic': <Activity className="w-4 h-4" />,
      'Jazz': <BarChart3 className="w-4 h-4" />,
      'Classical': <Clock className="w-4 h-4" />,
      'Country': <Music className="w-4 h-4" />,
      'R&B': <Volume2 className="w-4 h-4" />,
      'Blues': <Music className="w-4 h-4" />,
      'Folk': <Music className="w-4 h-4" />,
      'Reggae': <Music className="w-4 h-4" />,
      'Metal': <Zap className="w-4 h-4" />
    };
    return icons[genre] || <Music className="w-4 h-4" />;
  };

  if (!currentSong) {
    return (
      <div className={`p-4 bg-zinc-800 rounded-lg ${className}`}>
        <p className="text-zinc-400 text-sm">No song playing</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-zinc-800 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Music Analysis</h3>
        <button
          onClick={analyzeSong}
          disabled={isAnalyzing}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            <div className="flex-1">
              <p className="text-blue-400 text-sm">Analyzing audio features...</p>
              <p className="text-blue-300 text-xs mt-1">This may take 10-20 seconds</p>
            </div>
          </div>
        </div>
      )}

      {genreResult && (
        <div className="space-y-4">
          {/* Primary Genre */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getGenreIcon(genreResult.primary.genre)}
              <span className="text-2xl font-bold text-white">
                {genreResult.primary.genre}
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getGenreColor(genreResult.primary.genre)}`}
                style={{ width: `${genreResult.primary.confidence * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {Math.round(genreResult.primary.confidence * 100)}% confidence
            </p>
          </div>

          {/* Secondary Genre */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getGenreIcon(genreResult.secondary.genre)}
              <span className="text-lg font-semibold text-zinc-300">
                {genreResult.secondary.genre}
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getGenreColor(genreResult.secondary.genre)}`}
                style={{ width: `${genreResult.secondary.confidence * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {Math.round(genreResult.secondary.confidence * 100)}% confidence
            </p>
          </div>

          {/* All Genres */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-300">All Genres</h4>
            <div className="grid grid-cols-2 gap-2">
              {genreResult.all.slice(0, 6).map(({ genre, confidence }) => (
                <div
                  key={genre}
                  className="flex items-center justify-between p-2 bg-zinc-700 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    {getGenreIcon(genre)}
                    <span className="text-sm text-white">{genre}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Feature Description */}
          <div className="p-3 bg-zinc-700 rounded-md">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Audio Features</h4>
            <p className="text-sm text-zinc-400 mb-3">{genreResult.features}</p>
            
            {/* Additional Analysis Info */}
            {genreResult.analysisTime && (
              <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-600 pt-2">
                <span>Features analyzed: {genreResult.featureCount || 'N/A'}</span>
                <span>Analysis completed</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!genreResult && !isAnalyzing && !error && (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Click "Analyze" to detect music genre</p>
        </div>
      )}
    </div>
  );
};

export default GenreClassifierComponent;
