import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lightbulb, Settings, Power, Palette } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';

interface AmbientLightingProps {
  className?: string;
}

interface LightingSettings {
  intensity: number;
  speed: number;
  smoothness: number;
  roomMode: 'immersive' | 'subtle' | 'party' | 'focus';
  syncWithBeats: boolean;
  colorBlending: boolean;
  enabled: boolean;
}

const AmbientLighting: React.FC<AmbientLightingProps> = ({ className = '' }) => {
  const { isPlaying, updateAmbientLightingSettings } = usePlayerStore();
  const { emotionResult, isAnalyzing } = useEmotionAnalysis();
  
  const [settings, setSettings] = useState<LightingSettings>({
    intensity: 0.8,
    speed: 0.6,
    smoothness: 0.7,
    roomMode: 'immersive',
    syncWithBeats: true,
    colorBlending: true,
    enabled: true
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Room lighting effect modes
  const roomModes = {
    immersive: {
      name: 'Immersive',
      description: 'Full room lighting that surrounds you',
      intensity: 1.0,
      coverage: 'full'
    },
    subtle: {
      name: 'Subtle',
      description: 'Gentle ambient glow',
      intensity: 0.4,
      coverage: 'edges'
    },
    party: {
      name: 'Party',
      description: 'Dynamic, energetic lighting',
      intensity: 1.2,
      coverage: 'dynamic'
    },
    focus: {
      name: 'Focus',
      description: 'Calm lighting for concentration',
      intensity: 0.3,
      coverage: 'minimal'
    }
  };

  // Start ambient lighting animation
  const startLightingAnimation = useCallback(() => {
    if (!canvasRef.current || !settings.enabled || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.016 * settings.speed; // 60fps base

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create ambient lighting based on emotion and settings
      const defaultEmotion = {
        colorPalette: {
          primary: '#4A90E2',
          secondary: '#7B68EE',
          accent: '#9370DB'
        },
        intensity: 0.6,
        energyLevel: 'medium',
        primaryEmotion: 'calm'
      };
      
      createAmbientEffect(ctx, canvas, emotionResult || defaultEmotion, timeRef.current, settings);

      if (settings.enabled && (isPlaying || isAnalyzing)) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  }, [emotionResult, settings, isPlaying, isAnalyzing]);

  // Create ambient lighting effects
  const createAmbientEffect = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    emotion: any,
    time: number,
    lightSettings: LightingSettings
  ) => {
    const { colorPalette, intensity, energyLevel, primaryEmotion } = emotion;
    const mode = roomModes[lightSettings.roomMode];

    // Base intensity calculation
    const baseIntensity = mode.intensity * lightSettings.intensity * intensity;
    
    // Create room lighting effect based on mode
    switch (lightSettings.roomMode) {
      case 'immersive':
        createImmersiveLighting(ctx, canvas, colorPalette, time, baseIntensity, lightSettings);
        break;
      case 'subtle':
        createSubtleLighting(ctx, canvas, colorPalette, time, baseIntensity, lightSettings);
        break;
      case 'party':
        createPartyLighting(ctx, canvas, colorPalette, time, baseIntensity, lightSettings, energyLevel);
        break;
      case 'focus':
        createFocusLighting(ctx, canvas, colorPalette, time, baseIntensity, lightSettings);
        break;
    }

    // Add beat synchronization if enabled
    if (lightSettings.syncWithBeats && energyLevel === 'high') {
      addBeatSync(ctx, canvas, colorPalette.accent, time, baseIntensity);
    }

    // Add emotion-specific effects
    addEmotionEffects(ctx, canvas, primaryEmotion, colorPalette, time, baseIntensity);
  };

  const createImmersiveLighting = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorPalette: any,
    time: number,
    intensity: number,
    _settings: LightingSettings
  ) => {
    // Create multiple light sources around the room
    const lightSources = [
      { x: 0.1, y: 0.1, color: colorPalette.primary },
      { x: 0.9, y: 0.1, color: colorPalette.secondary },
      { x: 0.1, y: 0.9, color: colorPalette.accent },
      { x: 0.9, y: 0.9, color: colorPalette.primary },
      { x: 0.5, y: 0.5, color: colorPalette.secondary }
    ];

    lightSources.forEach((source, index) => {
      const x = source.x * canvas.width;
      const y = source.y * canvas.height;
      const radius = Math.sin(time + index) * 50 + 150;
      const alpha = intensity * (0.3 + Math.sin(time * 0.5 + index) * 0.2);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, hexToRgba(source.color, alpha));
      gradient.addColorStop(0.7, hexToRgba(source.color, alpha * 0.5));
      gradient.addColorStop(1, hexToRgba(source.color, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  };

  const createSubtleLighting = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorPalette: any,
    _time: number,
    intensity: number,
    _settings: LightingSettings
  ) => {
    // Gentle edge lighting
    const edgeGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    edgeGradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.2));
    edgeGradient.addColorStop(0.5, hexToRgba(colorPalette.secondary, intensity * 0.1));
    edgeGradient.addColorStop(1, hexToRgba(colorPalette.accent, intensity * 0.2));

    ctx.fillStyle = edgeGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft center glow
    const centerGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3
    );
    centerGradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * 0.15));
    centerGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = centerGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const createPartyLighting = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorPalette: any,
    time: number,
    intensity: number,
    _settings: LightingSettings,
    energyLevel: string
  ) => {
    // Dynamic strobing effects
    const strobeIntensity = energyLevel === 'high' ? 
      Math.sin(time * 8) * 0.5 + 0.5 : 
      Math.sin(time * 2) * 0.3 + 0.7;

    // Rotating color spots
    const spotCount = 6;
    for (let i = 0; i < spotCount; i++) {
      const angle = (time + i * Math.PI * 2 / spotCount) * 0.5;
      const x = canvas.width / 2 + Math.cos(angle) * 100;
      const y = canvas.height / 2 + Math.sin(angle) * 60;
      const radius = 80 + Math.sin(time * 3 + i) * 20;
      
      const colors = [colorPalette.primary, colorPalette.secondary, colorPalette.accent];
      const color = colors[i % colors.length];
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, hexToRgba(color, intensity * strobeIntensity));
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const createFocusLighting = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    colorPalette: any,
    time: number,
    intensity: number,
    _settings: LightingSettings
  ) => {
    // Calm, steady lighting for concentration
    const breathingEffect = Math.sin(time * 0.5) * 0.1 + 0.9;
    
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
    );
    
    gradient.addColorStop(0, hexToRgba(colorPalette.primary, intensity * breathingEffect * 0.3));
    gradient.addColorStop(0.8, hexToRgba(colorPalette.secondary, intensity * breathingEffect * 0.15));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const addBeatSync = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    accentColor: string,
    time: number,
    intensity: number
  ) => {
    // Simulate beat detection with sine wave
    const beatPulse = Math.max(0, Math.sin(time * 4)) * intensity;
    
    if (beatPulse > 0.5) {
      const flashGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 4
      );
      
      flashGradient.addColorStop(0, hexToRgba(accentColor, beatPulse * 0.4));
      flashGradient.addColorStop(1, 'transparent');

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = flashGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const addEmotionEffects = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    emotion: string,
    colorPalette: any,
    time: number,
    intensity: number
  ) => {
    switch (emotion) {
      case 'joy':
        // Sparkling effect
        addSparkles(ctx, canvas, colorPalette.accent, time, intensity);
        break;
      case 'excitement':
        // Energy waves
        addEnergyWaves(ctx, canvas, colorPalette.primary, time, intensity);
        break;
      case 'calm':
        // Gentle waves
        addGentleWaves(ctx, canvas, colorPalette.secondary, time, intensity);
        break;
      case 'mysterious':
        // Fog effect
        addFogEffect(ctx, canvas, colorPalette.primary, time, intensity);
        break;
    }
  };

  const addSparkles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string, time: number, intensity: number) => {
    for (let i = 0; i < 15; i++) {
      const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(time * 1.3 + i) * 0.5 + 0.5) * canvas.height;
      const size = Math.sin(time * 3 + i) * 2 + 1;
      const alpha = Math.sin(time * 2 + i) * 0.5 + 0.5;

      ctx.fillStyle = hexToRgba(color, alpha * intensity * 0.8);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const addEnergyWaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string, time: number, intensity: number) => {
    for (let i = 0; i < 3; i++) {
      const radius = (time * 50 + i * 100) % (Math.max(canvas.width, canvas.height));
      const alpha = 1 - (radius / Math.max(canvas.width, canvas.height));

      ctx.strokeStyle = hexToRgba(color, alpha * intensity * 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const addGentleWaves = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string, time: number, intensity: number) => {
    ctx.strokeStyle = hexToRgba(color, intensity * 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x <= canvas.width; x += 10) {
      const y = canvas.height / 2 + Math.sin((x + time * 30) * 0.01) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const addFogEffect = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: string, _time: number, intensity: number) => {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, hexToRgba(color, intensity * 0.1));
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  };

  // Start/stop animation based on state
  useEffect(() => {
    if (settings.enabled && isPlaying) {
      startLightingAnimation();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startLightingAnimation, settings.enabled, isPlaying]);

  const updateSetting = (key: keyof LightingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Update global settings for main screen effect
    if (key === 'intensity' || key === 'speed' || key === 'roomMode' || key === 'enabled') {
      updateAmbientLightingSettings({ [key]: value });
    }
  };

  return (
    <div className={`bg-zinc-900 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center space-x-2">
          <Lightbulb className={`w-5 h-5 ${settings.enabled ? 'text-yellow-400' : 'text-zinc-500'}`} />
          <h3 className="text-lg font-semibold text-white">Ambient Lighting</h3>
          <span className="text-xs text-zinc-400">
            {isPlaying ? (emotionResult ? `${emotionResult.primaryEmotion} mode` : 'Default lighting') : 'Waiting for music...'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateSetting('enabled', !settings.enabled)}
            className={`p-2 rounded-lg transition-colors ${
              settings.enabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lighting Preview */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-48 bg-black"
          style={{ 
            background: settings.enabled ? 'transparent' : '#000',
            opacity: settings.enabled ? 1 : 0.3
          }}
        />
        
        {/* Room Mode Indicator */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
          {roomModes[settings.roomMode].name} Mode
        </div>

        {/* Status Indicator */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {settings.enabled && isPlaying && (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-white">Active</span>
            </>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-t border-zinc-700 space-y-4">
          {/* Room Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Room Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(roomModes).map(([key, mode]) => (
                <button
                  key={key}
                  onClick={() => updateSetting('roomMode', key)}
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    settings.roomMode === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  }`}
                >
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-xs opacity-75">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity Control */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Intensity: {Math.round(settings.intensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.intensity}
              onChange={(e) => updateSetting('intensity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Animation Speed: {Math.round(settings.speed * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={settings.speed}
              onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Feature Toggles */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.syncWithBeats}
                onChange={(e) => updateSetting('syncWithBeats', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">Sync with beats</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.colorBlending}
                onChange={(e) => updateSetting('colorBlending', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-zinc-300">Color blending</span>
            </label>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isPlaying && (
        <div className="p-6 text-center">
          <Palette className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">
            Play music to see ambient lighting effects
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            Lighting adapts to the emotional content of your music
          </p>
        </div>
      )}
    </div>
  );
};

export default AmbientLighting;
