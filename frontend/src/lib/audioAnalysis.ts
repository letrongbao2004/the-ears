// Audio feature extraction and genre classification
export class AudioAnalyzer {
  // Audio context will be created when needed

  constructor() {
    // Audio context will be created when needed
  }

  // Extract audio features for genre classification
  extractFeatures(audioBuffer: AudioBuffer): AudioFeatures {
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const duration = length / sampleRate;

    // Get audio data (use left channel for analysis)
    const leftChannel = audioBuffer.getChannelData(0);

    // Calculate features
    const tempo = this.calculateTempo(leftChannel, sampleRate);
    const spectralCentroid = this.calculateSpectralCentroid(leftChannel, sampleRate);
    const zeroCrossingRate = this.calculateZeroCrossingRate(leftChannel);
    const mfcc = this.calculateMFCC(leftChannel, sampleRate);
    const spectralRolloff = this.calculateSpectralRolloff(leftChannel, sampleRate);
    const spectralBandwidth = this.calculateSpectralBandwidth(leftChannel, sampleRate);
    const rms = this.calculateRMS(leftChannel);
    const spectralFlux = this.calculateSpectralFlux(leftChannel);

    return {
      tempo,
      spectralCentroid,
      zeroCrossingRate,
      mfcc,
      spectralRolloff,
      spectralBandwidth,
      rms,
      spectralFlux,
      duration
    };
  }

  // Calculate tempo using beat detection
  private calculateTempo(audioData: Float32Array, sampleRate: number): number {
    const windowSize = 1024;
    const hopSize = 512;
    const onsets = [];

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const energy = this.calculateEnergy(window);
      
      if (i > 0) {
        const prevWindow = audioData.slice(i - hopSize, i - hopSize + windowSize);
        const prevEnergy = this.calculateEnergy(prevWindow);
        
        if (energy > prevEnergy * 1.3) {
          onsets.push(i / sampleRate);
        }
      }
    }

    if (onsets.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return 60 / avgInterval;
  }

  // Calculate spectral centroid
  private calculateSpectralCentroid(audioData: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    const hopSize = 1024;
    let totalCentroid = 0;
    let count = 0;

    for (let i = 0; i < audioData.length - fftSize; i += hopSize) {
      const window = audioData.slice(i, i + fftSize);
      const fft = this.fft(window);
      
      let numerator = 0;
      let denominator = 0;
      
      for (let j = 0; j < fft.length / 2; j++) {
        const magnitude = Math.sqrt(fft[j] * fft[j] + fft[j + fft.length / 2] * fft[j + fft.length / 2]);
        const frequency = (j * sampleRate) / fftSize;
        numerator += frequency * magnitude;
        denominator += magnitude;
      }
      
      if (denominator > 0) {
        totalCentroid += numerator / denominator;
        count++;
      }
    }

    return count > 0 ? totalCentroid / count : 0;
  }

  // Calculate zero crossing rate
  private calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (audioData.length - 1);
  }

  // Calculate MFCC (simplified version)
  private calculateMFCC(audioData: Float32Array, sampleRate: number): number[] {
    const fftSize = 2048;
    const numCoeffs = 13;
    const mfccs = new Array(numCoeffs).fill(0);
    
    // Simplified MFCC calculation
    for (let i = 0; i < audioData.length - fftSize; i += fftSize) {
      const window = audioData.slice(i, i + fftSize);
      const fft = this.fft(window);
      
      // Calculate power spectrum
      const powerSpectrum = [];
      for (let j = 0; j < fftSize / 2; j++) {
        const real = fft[j];
        const imag = fft[j + fftSize / 2];
        powerSpectrum.push(real * real + imag * imag);
      }
      
      // Apply mel filter bank (simplified)
      for (let k = 0; k < numCoeffs; k++) {
        let sum = 0;
        for (let j = 0; j < powerSpectrum.length; j++) {
          const mel = this.hzToMel((j * sampleRate) / fftSize);
          const filterValue = this.melFilter(mel, k, numCoeffs);
          sum += powerSpectrum[j] * filterValue;
        }
        mfccs[k] += Math.log(Math.max(sum, 1e-10));
      }
    }
    
    return mfccs.map(val => val / Math.floor(audioData.length / fftSize));
  }

  // Calculate spectral rolloff
  private calculateSpectralRolloff(audioData: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    const threshold = 0.85;
    let totalRolloff = 0;
    let count = 0;

    for (let i = 0; i < audioData.length - fftSize; i += fftSize) {
      const window = audioData.slice(i, i + fftSize);
      const fft = this.fft(window);
      
      const powerSpectrum = [];
      for (let j = 0; j < fftSize / 2; j++) {
        const real = fft[j];
        const imag = fft[j + fftSize / 2];
        powerSpectrum.push(real * real + imag * imag);
      }
      
      const totalEnergy = powerSpectrum.reduce((a, b) => a + b, 0);
      const targetEnergy = totalEnergy * threshold;
      
      let cumulativeEnergy = 0;
      for (let j = 0; j < powerSpectrum.length; j++) {
        cumulativeEnergy += powerSpectrum[j];
        if (cumulativeEnergy >= targetEnergy) {
          totalRolloff += (j * sampleRate) / fftSize;
          count++;
          break;
        }
      }
    }

    return count > 0 ? totalRolloff / count : 0;
  }

  // Calculate spectral bandwidth
  private calculateSpectralBandwidth(audioData: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    let totalBandwidth = 0;
    let count = 0;

    for (let i = 0; i < audioData.length - fftSize; i += fftSize) {
      const window = audioData.slice(i, i + fftSize);
      const fft = this.fft(window);
      
      let numerator = 0;
      let denominator = 0;
      
      for (let j = 0; j < fftSize / 2; j++) {
        const real = fft[j];
        const imag = fft[j + fftSize / 2];
        const magnitude = Math.sqrt(real * real + imag * imag);
        const frequency = (j * sampleRate) / fftSize;
        
        numerator += frequency * magnitude;
        denominator += magnitude;
      }
      
      if (denominator > 0) {
        const centroid = numerator / denominator;
        let bandwidth = 0;
        
        for (let j = 0; j < fftSize / 2; j++) {
          const real = fft[j];
          const imag = fft[j + fftSize / 2];
          const magnitude = Math.sqrt(real * real + imag * imag);
          const frequency = (j * sampleRate) / fftSize;
          bandwidth += Math.pow(frequency - centroid, 2) * magnitude;
        }
        
        totalBandwidth += Math.sqrt(bandwidth / denominator);
        count++;
      }
    }

    return count > 0 ? totalBandwidth / count : 0;
  }

  // Calculate RMS (Root Mean Square)
  private calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  // Calculate spectral flux
  private calculateSpectralFlux(audioData: Float32Array): number {
    const fftSize = 2048;
    const hopSize = 1024;
    let totalFlux = 0;
    let count = 0;
    let prevSpectrum: number[] = [];

    for (let i = 0; i < audioData.length - fftSize; i += hopSize) {
      const window = audioData.slice(i, i + fftSize);
      const fft = this.fft(window);
      
      const powerSpectrum = [];
      for (let j = 0; j < fftSize / 2; j++) {
        const real = fft[j];
        const imag = fft[j + fftSize / 2];
        powerSpectrum.push(real * real + imag * imag);
      }
      
      if (prevSpectrum.length > 0) {
        let flux = 0;
        for (let j = 0; j < Math.min(powerSpectrum.length, prevSpectrum.length); j++) {
          const diff = powerSpectrum[j] - prevSpectrum[j];
          flux += diff > 0 ? diff : 0;
        }
        totalFlux += flux;
        count++;
      }
      
      prevSpectrum = [...powerSpectrum];
    }

    return count > 0 ? totalFlux / count : 0;
  }

  // Helper methods
  private calculateEnergy(audioData: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    return energy / audioData.length;
  }

  private fft(input: Float32Array): Float32Array {
    const N = input.length;
    const output = new Float32Array(N * 2);
    
    // Simple FFT implementation (for demo purposes)
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += input[n] * Math.cos(angle);
        imag += input[n] * Math.sin(angle);
      }
      
      output[k] = real;
      output[k + N] = imag;
    }
    
    return output;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melFilter(mel: number, filterIndex: number, numFilters: number): number {
    const centerMel = (filterIndex + 1) * 7000 / (numFilters + 1);
    const width = 7000 / (numFilters + 1);
    
    if (Math.abs(mel - centerMel) < width) {
      return 1 - Math.abs(mel - centerMel) / width;
    }
    return 0;
  }
}

// Genre classification using feature-based approach
export class GenreClassifier {
  // Genre classification using feature-based approach

  classify(features: AudioFeatures): GenreResult {
    const scores = this.calculateGenreScores(features);
    const sortedGenres = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .map(([genre, score]) => ({ genre, confidence: score }));

    return {
      primary: sortedGenres[0],
      secondary: sortedGenres[1],
      all: sortedGenres,
      features: this.describeFeatures(features)
    };
  }

  private calculateGenreScores(features: AudioFeatures): Record<string, number> {
    const scores: Record<string, number> = {};

    // Pop: High tempo, moderate spectral centroid, balanced features
    scores.Pop = this.calculatePopScore(features);
    
    // Rock: High tempo, high spectral centroid, high energy
    scores.Rock = this.calculateRockScore(features);
    
    // Hip-Hop: Moderate tempo, low spectral centroid, high beat strength
    scores['Hip-Hop'] = this.calculateHipHopScore(features);
    
    // Electronic: High tempo, high spectral centroid, high spectral flux
    scores.Electronic = this.calculateElectronicScore(features);
    
    // Jazz: Moderate tempo, high spectral centroid, complex harmony
    scores.Jazz = this.calculateJazzScore(features);
    
    // Classical: Low to moderate tempo, high spectral centroid, low energy
    scores.Classical = this.calculateClassicalScore(features);
    
    // Country: Moderate tempo, moderate spectral centroid, acoustic features
    scores.Country = this.calculateCountryScore(features);
    
    // R&B: Moderate tempo, moderate spectral centroid, smooth features
    scores['R&B'] = this.calculateRBScore(features);
    
    // Blues: Moderate tempo, moderate spectral centroid, expressive features
    scores.Blues = this.calculateBluesScore(features);
    
    // Folk: Low to moderate tempo, low spectral centroid, acoustic features
    scores.Folk = this.calculateFolkScore(features);
    
    // Reggae: Moderate tempo, moderate spectral centroid, off-beat rhythm
    scores.Reggae = this.calculateReggaeScore(features);
    
    // Metal: High tempo, high spectral centroid, high energy, high distortion
    scores.Metal = this.calculateMetalScore(features);

    return scores;
  }

  private calculatePopScore(features: AudioFeatures): number {
    let score = 0;
    
    // Pop typically has tempo between 100-140 BPM
    if (features.tempo >= 100 && features.tempo <= 140) score += 0.3;
    
    // Moderate spectral centroid
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 3000) score += 0.2;
    
    // Moderate energy
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    
    // Moderate spectral flux
    if (features.spectralFlux >= 0.1 && features.spectralFlux <= 0.4) score += 0.2;
    
    // Low zero crossing rate (smooth)
    if (features.zeroCrossingRate <= 0.1) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateRockScore(features: AudioFeatures): number {
    let score = 0;
    
    // Rock typically has tempo between 120-160 BPM
    if (features.tempo >= 120 && features.tempo <= 160) score += 0.3;
    
    // High spectral centroid (bright sound)
    if (features.spectralCentroid >= 2000) score += 0.2;
    
    // High energy
    if (features.rms >= 0.2) score += 0.2;
    
    // High spectral flux (dynamic)
    if (features.spectralFlux >= 0.3) score += 0.2;
    
    // High spectral bandwidth (complex sound)
    if (features.spectralBandwidth >= 1000) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateHipHopScore(features: AudioFeatures): number {
    let score = 0;
    
    // Hip-hop typically has tempo between 80-120 BPM
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    
    // Low spectral centroid (bass-heavy)
    if (features.spectralCentroid <= 1500) score += 0.2;
    
    // High energy
    if (features.rms >= 0.2) score += 0.2;
    
    // Low spectral flux (steady beat)
    if (features.spectralFlux <= 0.2) score += 0.2;
    
    // High zero crossing rate (percussive)
    if (features.zeroCrossingRate >= 0.1) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateElectronicScore(features: AudioFeatures): number {
    let score = 0;
    
    // Electronic typically has tempo between 120-140 BPM
    if (features.tempo >= 120 && features.tempo <= 140) score += 0.3;
    
    // High spectral centroid (synthetic sounds)
    if (features.spectralCentroid >= 2000) score += 0.2;
    
    // High spectral flux (dynamic changes)
    if (features.spectralFlux >= 0.4) score += 0.2;
    
    // High spectral bandwidth (complex synthesis)
    if (features.spectralBandwidth >= 1500) score += 0.2;
    
    // Moderate energy
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateJazzScore(features: AudioFeatures): number {
    let score = 0;
    
    // Jazz typically has tempo between 100-180 BPM
    if (features.tempo >= 100 && features.tempo <= 180) score += 0.2;
    
    // High spectral centroid (bright instruments)
    if (features.spectralCentroid >= 2000) score += 0.3;
    
    // High spectral bandwidth (complex harmony)
    if (features.spectralBandwidth >= 1000) score += 0.3;
    
    // High spectral flux (improvisation)
    if (features.spectralFlux >= 0.3) score += 0.2;
    
    return Math.min(score, 1);
  }

  private calculateClassicalScore(features: AudioFeatures): number {
    let score = 0;
    
    // Classical typically has tempo between 60-120 BPM
    if (features.tempo >= 60 && features.tempo <= 120) score += 0.3;
    
    // High spectral centroid (orchestral instruments)
    if (features.spectralCentroid >= 1500) score += 0.2;
    
    // Low energy (acoustic)
    if (features.rms <= 0.2) score += 0.2;
    
    // Low spectral flux (smooth)
    if (features.spectralFlux <= 0.2) score += 0.2;
    
    // Low zero crossing rate (smooth)
    if (features.zeroCrossingRate <= 0.05) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateCountryScore(features: AudioFeatures): number {
    let score = 0;
    
    // Country typically has tempo between 80-120 BPM
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    
    // Moderate spectral centroid
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    
    // Low energy (acoustic)
    if (features.rms <= 0.2) score += 0.2;
    
    // Low spectral flux (steady)
    if (features.spectralFlux <= 0.3) score += 0.2;
    
    // Low zero crossing rate (smooth)
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateRBScore(features: AudioFeatures): number {
    let score = 0;
    
    // R&B typically has tempo between 70-110 BPM
    if (features.tempo >= 70 && features.tempo <= 110) score += 0.3;
    
    // Moderate spectral centroid
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    
    // Moderate energy
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    
    // Low spectral flux (smooth)
    if (features.spectralFlux <= 0.3) score += 0.2;
    
    // Low zero crossing rate (smooth)
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateBluesScore(features: AudioFeatures): number {
    let score = 0;
    
    // Blues typically has tempo between 60-120 BPM
    if (features.tempo >= 60 && features.tempo <= 120) score += 0.3;
    
    // Moderate spectral centroid
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    
    // Moderate energy
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    
    // Moderate spectral flux (expressive)
    if (features.spectralFlux >= 0.2 && features.spectralFlux <= 0.4) score += 0.2;
    
    // Moderate zero crossing rate
    if (features.zeroCrossingRate >= 0.05 && features.zeroCrossingRate <= 0.1) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateFolkScore(features: AudioFeatures): number {
    let score = 0;
    
    // Folk typically has tempo between 60-100 BPM
    if (features.tempo >= 60 && features.tempo <= 100) score += 0.3;
    
    // Low spectral centroid (acoustic)
    if (features.spectralCentroid <= 2000) score += 0.2;
    
    // Low energy (acoustic)
    if (features.rms <= 0.2) score += 0.2;
    
    // Low spectral flux (steady)
    if (features.spectralFlux <= 0.3) score += 0.2;
    
    // Low zero crossing rate (smooth)
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateReggaeScore(features: AudioFeatures): number {
    let score = 0;
    
    // Reggae typically has tempo between 80-120 BPM
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    
    // Moderate spectral centroid
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    
    // Moderate energy
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    
    // Low spectral flux (steady rhythm)
    if (features.spectralFlux <= 0.3) score += 0.2;
    
    // Moderate zero crossing rate
    if (features.zeroCrossingRate >= 0.05 && features.zeroCrossingRate <= 0.1) score += 0.1;
    
    return Math.min(score, 1);
  }

  private calculateMetalScore(features: AudioFeatures): number {
    let score = 0;
    
    // Metal typically has tempo between 120-200 BPM
    if (features.tempo >= 120 && features.tempo <= 200) score += 0.3;
    
    // High spectral centroid (distorted guitars)
    if (features.spectralCentroid >= 2000) score += 0.2;
    
    // High energy
    if (features.rms >= 0.2) score += 0.2;
    
    // High spectral flux (aggressive)
    if (features.spectralFlux >= 0.4) score += 0.2;
    
    // High zero crossing rate (distorted)
    if (features.zeroCrossingRate >= 0.1) score += 0.1;
    
    return Math.min(score, 1);
  }

  private describeFeatures(features: AudioFeatures): string {
    const descriptions = [];
    
    if (features.tempo > 140) descriptions.push("fast tempo");
    else if (features.tempo < 80) descriptions.push("slow tempo");
    else descriptions.push("moderate tempo");
    
    if (features.spectralCentroid > 2000) descriptions.push("bright sound");
    else if (features.spectralCentroid < 1000) descriptions.push("bass-heavy");
    else descriptions.push("balanced frequency");
    
    if (features.rms > 0.2) descriptions.push("high energy");
    else if (features.rms < 0.1) descriptions.push("low energy");
    else descriptions.push("moderate energy");
    
    if (features.spectralFlux > 0.4) descriptions.push("dynamic changes");
    else if (features.spectralFlux < 0.2) descriptions.push("steady rhythm");
    else descriptions.push("moderate dynamics");
    
    return descriptions.join(", ");
  }
}

// Types
export interface AudioFeatures {
  tempo: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: number[];
  spectralRolloff: number;
  spectralBandwidth: number;
  rms: number;
  spectralFlux: number;
  duration: number;
}

export interface GenreResult {
  primary: { genre: string; confidence: number };
  secondary: { genre: string; confidence: number };
  all: { genre: string; confidence: number }[];
  features: string;
  analysisTime?: number;
  featureCount?: number;
}
