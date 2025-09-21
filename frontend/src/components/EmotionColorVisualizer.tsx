import React, { useState, useEffect, useRef } from 'react';
import { Palette, Play, Pause } from 'lucide-react';

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

interface EmotionColorVisualizerProps {
  isAnalyzing: boolean;
  emotionResult?: EmotionResult;
  onToggleAnalysis: () => void;
  className?: string;
}

const EmotionColorVisualizer: React.FC<EmotionColorVisualizerProps> = ({
  isAnalyzing,
  emotionResult,
  onToggleAnalysis,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Emotion descriptions for better UX
  const emotionDescriptions: Record<string, string> = {
    joy: 'Bright, uplifting, energetic',
    sadness: 'Melancholic, introspective, gentle',
    anger: 'Intense, aggressive, powerful',
    calm: 'Peaceful, balanced, serene',
    excitement: 'Dynamic, thrilling, vibrant',
    melancholy: 'Contemplative, bittersweet, deep',
    romantic: 'Tender, warm, intimate',
    mysterious: 'Dark, enigmatic, complex',
    thoughtful: 'Reflective, deep, contemplative',
    youthful: 'Fresh, vibrant, energetic',
    sweet: 'Gentle, tender, loving',
    cute: 'Playful, charming, delightful',
    emotional: 'Intense, heartfelt, moving',
    sophisticated: 'Elegant, refined, mature',
    artistic: 'Creative, expressive, unique',
    dreamy: 'Ethereal, floating, imaginative',
    hopeful: 'Optimistic, bright, encouraging',
    pain: 'Raw, intense, cathartic',
    loneliness: 'Isolated, yearning, introspective',
    peaceful: 'Tranquil, harmonious, soothing',
    energetic: 'Dynamic, powerful, invigorating',
    melancholic: 'Wistful, nostalgic, bittersweet',
    uplifting: 'Inspiring, motivating, positive'
  };

  // Music section descriptions
  const sectionDescriptions = {
    intro: 'Gentle introduction, setting the mood',
    verse: 'Main narrative, steady progression',
    chorus: 'Emotional peak, most vibrant colors',
    bridge: 'Transitional, layered emotions',
    outro: 'Gentle conclusion, fading colors'
  };

  useEffect(() => {
    // Stop any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }

    if (emotionResult && !isAnalyzing) {
      console.log('Starting animation for emotion:', emotionResult.primaryEmotion);
      setIsAnimating(true);
      startColorAnimation();
    } else {
      setIsAnimating(false);
      // Clear canvas when no result
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const rect = canvasRef.current.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [emotionResult, isAnalyzing]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && isAnimating) {
        // Restart animation with new canvas size
        setIsAnimating(false);
        setTimeout(() => {
          if (emotionResult) {
            setIsAnimating(true);
            startColorAnimation();
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAnimating, emotionResult]);

  const startColorAnimation = () => {
    if (!emotionResult || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size properly with performance optimization
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2); // Cap DPR for performance
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Enable performance optimizations
    ctx.imageSmoothingEnabled = false; // Disable for better performance

    let time = 0;
    let lastFrameTime = 0;
    const { colorPalette, primaryEmotion, intensity, energyLevel } = emotionResult;

    // Pre-calculate values for better performance
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;
    const timeIncrement = energyLevel === 'high' ? 0.08 : energyLevel === 'low' ? 0.03 : 0.05;

    const animate = (currentTime: number) => {
      if (!isAnimating) {
        return;
      }

      // Throttle to 60fps max for smoother performance
      if (currentTime - lastFrameTime < 16.67) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      time += timeIncrement;

      // Use efficient clearing
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Create emotion-based animation patterns with performance optimization
      try {
        if (primaryEmotion === 'excitement' || primaryEmotion === 'joy') {
          createBurstPattern(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
        } else if (primaryEmotion === 'calm' || primaryEmotion === 'peaceful') {
          createWavePattern(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
        } else if (primaryEmotion === 'romantic' || primaryEmotion === 'sweet') {
          createHeartPattern(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
        } else if (primaryEmotion === 'sadness' || primaryEmotion === 'melancholy') {
          createRainPattern(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
        } else {
          createFlowingGradient(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
        }
      } catch (error) {
        // Fallback to simple gradient if complex animation fails
        createFlowingGradient(ctx, canvasWidth, canvasHeight, time, colorPalette, intensity);
      }

      // Continue animation
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation
    animate(0);
  };

  // Animation patterns for different emotions
  const createBurstPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colorPalette: any, intensity: number) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Reduce iterations for better performance
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + time;
      const radius = Math.sin(time * 2 + i) * 30 + 60; // Smaller radius
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25); // Smaller gradient
      gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.6));
      gradient.addColorStop(1, hexToRgba(colorPalette.secondary, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const createWavePattern = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colorPalette: any, intensity: number) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.7));
    gradient.addColorStop(0.5, hexToRgba(colorPalette.secondary, intensity * 0.5));
    gradient.addColorStop(1, hexToRgba(colorPalette.accent, intensity * 0.3));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add gentle wave overlay
    for (let i = 0; i < 3; i++) {
      const waveGradient = ctx.createLinearGradient(
        Math.sin(time + i) * width * 0.3 + width * 0.5, 0,
        Math.sin(time + i + Math.PI) * width * 0.3 + width * 0.5, height
      );
      waveGradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.2));
      waveGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = waveGradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const createHeartPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colorPalette: any, intensity: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) / 2 * pulse);
    gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * pulse));
    gradient.addColorStop(0.6, hexToRgba(colorPalette.secondary, intensity * 0.6));
    gradient.addColorStop(1, hexToRgba(colorPalette.accent, 0));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const createRainPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colorPalette: any, intensity: number) => {
    // Base gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.3));
    gradient.addColorStop(1, hexToRgba(colorPalette.secondary, intensity * 0.6));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Fewer rain drops for better performance
    for (let i = 0; i < 8; i++) {
      const x = (i * 40 + Math.sin(time + i) * 15) % width;
      const y = ((time * 80 + i * 60) % (height + 40)) - 40;

      ctx.fillStyle = hexToRgba(colorPalette.accent, intensity * 0.6);
      ctx.fillRect(x - 1, y, 2, 15); // Simpler rectangle instead of gradient
    }
  };

  const createFlowingGradient = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, colorPalette: any, intensity: number) => {
    const gradient = ctx.createLinearGradient(
      Math.sin(time) * width * 0.3 + width * 0.5,
      Math.cos(time * 0.7) * height * 0.3 + height * 0.5,
      Math.sin(time + Math.PI) * width * 0.3 + width * 0.5,
      Math.cos(time * 0.7 + Math.PI) * height * 0.3 + height * 0.5
    );

    gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.8));
    gradient.addColorStop(0.5, hexToRgba(colorPalette.secondary, intensity * 0.6));
    gradient.addColorStop(1, hexToRgba(colorPalette.accent, intensity * 0.4));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      return `rgba(38, 222, 129, ${Math.max(0, Math.min(1, alpha))})`;
    }

    const cleanHex = hex.slice(1);
    if (cleanHex.length !== 6) {
      return `rgba(38, 222, 129, ${Math.max(0, Math.min(1, alpha))})`;
    }

    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  };

  const getEmotionIntensityBar = () => {
    if (!emotionResult) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Emotion Intensity
        </h4>
        {Object.entries(emotionResult.emotions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([emotion, score]) => (
            <div key={emotion} className="flex items-center space-x-2">
              <span className="text-xs capitalize w-20 text-gray-600 dark:text-gray-400">
                {emotion}
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${score * 100}%`,
                    backgroundColor: emotionResult.colorPalette.primary
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">
                {Math.round(score * 100)}%
              </span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 music-container ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Emotion Color Visualizer
          </h3>
        </div>
        <button
          onClick={onToggleAnalysis}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${isAnalyzing
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : emotionResult
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
        >
          {isAnalyzing ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Analyzing...</span>
            </>
          ) : emotionResult ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Stop Visualization</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Analyze Emotions</span>
            </>
          )}
        </button>
      </div>

      {/* Canvas Visualization */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-900"
          style={{ minHeight: '200px', maxHeight: '300px' }}
        />

      </div>

      {/* Emotion Analysis Results */}
      {emotionResult && (
        <div className="space-y-6">
          {/* Primary Emotion */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-full"
              style={{ backgroundColor: emotionResult.colorPalette.primary + '20' }}>
              <div
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: emotionResult.colorPalette.primary }}
              />
              <span className="font-semibold capitalize text-gray-800 dark:text-white">
                {emotionResult.primaryEmotion}
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                {Math.round(emotionResult.intensity * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {emotionDescriptions[emotionResult.primaryEmotion] || 'Unique emotional expression'}
            </p>
          </div>

          {/* Color Palette */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Palette
            </h4>
            <div className="flex space-x-2">
              {[
                emotionResult.colorPalette.primary,
                emotionResult.colorPalette.secondary,
                emotionResult.colorPalette.accent
              ].map((color, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="w-full h-12 rounded-lg border border-gray-200 dark:border-gray-700"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-xs text-center mt-1 text-gray-500">
                    {color}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Music Section & Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Music Section
              </h4>
              <p className="text-sm capitalize font-medium text-purple-600">
                {emotionResult.musicSection}
              </p>
              <p className="text-xs text-gray-500">
                {sectionDescriptions[emotionResult.musicSection as keyof typeof sectionDescriptions]}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Energy Level
              </h4>
              <p className={`text-sm capitalize font-medium ${emotionResult.energyLevel === 'high' ? 'text-red-500' :
                emotionResult.energyLevel === 'medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                {emotionResult.energyLevel}
              </p>
            </div>
          </div>

          {/* Emotion Intensity Bars */}
          {getEmotionIntensityBar()}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Analyzing emotional patterns...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Processing melody, rhythm, and musical structure
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isAnalyzing && !emotionResult && (
        <div className="text-center py-8">
          <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Click "Analyze Emotions" to visualize the emotional colors of your music
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Colors will change dynamically based on rhythm, pitch, volume, and melody
          </p>
        </div>
      )}
    </div>
  );
};

export default EmotionColorVisualizer;
