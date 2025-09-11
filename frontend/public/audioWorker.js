// Improved Audio Analysis Web Worker
class AudioAnalyzer {

  // Fast tempo detection using simplified autocorrelation
  calculateTempoAutocorrelation(audioData, sampleRate) {
    const windowSize = 1024; // Reduced from 4096
    const maxLag = Math.floor(sampleRate * 0.5); // Reduced from 2 seconds to 0.5
    const minTempo = 80; // BPM
    const maxTempo = 180; // BPM
    const stepSize = 8; // Skip samples for speed
    
    // Use smaller sample for analysis
    const sampleLength = Math.min(audioData.length, sampleRate * 10); // Max 10 seconds
    const analysisData = audioData.slice(0, sampleLength);
    
    const autocorr = new Array(maxLag).fill(0);
    
    for (let lag = Math.floor(sampleRate * 60 / maxTempo); lag < Math.floor(sampleRate * 60 / minTempo) && lag < maxLag; lag += stepSize) {
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < analysisData.length - lag - windowSize; i += windowSize * 2) {
        for (let j = 0; j < windowSize; j += 4) { // Skip samples
          sum += analysisData[i + j] * analysisData[i + j + lag];
          count++;
        }
      }
      
      autocorr[lag] = count > 0 ? sum / count : 0;
    }
    
    // Find peak in autocorrelation
    let maxCorr = 0;
    let bestLag = 0;
    
    for (let lag = Math.floor(sampleRate * 60 / maxTempo); lag < Math.floor(sampleRate * 60 / minTempo) && lag < maxLag; lag += stepSize) {
      if (autocorr[lag] > maxCorr) {
        maxCorr = autocorr[lag];
        bestLag = lag;
      }
    }
    
    return bestLag > 0 ? Math.round(60 * sampleRate / bestLag) : 120;
  }

  // Optimized spectral features for faster processing
  calculateSpectralFeatures(audioData, sampleRate) {
    const fftSize = 256; // Further reduced for speed
    const hopSize = 2048; // Increased for speed
    const maxFrames = 20; // Limit number of frames analyzed
    const numFrames = Math.min(maxFrames, Math.floor((audioData.length - fftSize) / hopSize));
    
    let spectralCentroid = 0;
    let spectralRolloff = 0;
    let spectralBandwidth = 0;
    let zeroCrossingRate = 0;
    let rms = 0;
    let spectralFlux = 0;
    let prevSpectrum = null;
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      
      // Apply Hamming window
      const windowedData = this.applyHammingWindow(window);
      
      // Calculate FFT
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Calculate spectral centroid
      let centroidNum = 0, centroidDen = 0;
      let rolloffEnergy = 0, totalEnergy = 0;
      
      for (let bin = 0; bin < powerSpectrum.length; bin++) {
        const frequency = (bin * sampleRate) / fftSize;
        const magnitude = powerSpectrum[bin];
        
        centroidNum += frequency * magnitude;
        centroidDen += magnitude;
        totalEnergy += magnitude;
      }
      
      if (centroidDen > 0) {
        spectralCentroid += centroidNum / centroidDen;
        
        // Calculate spectral rolloff (85% energy point)
        const targetEnergy = totalEnergy * 0.85;
        let cumulativeEnergy = 0;
        for (let bin = 0; bin < powerSpectrum.length; bin++) {
          cumulativeEnergy += powerSpectrum[bin];
          if (cumulativeEnergy >= targetEnergy) {
            spectralRolloff += (bin * sampleRate) / fftSize;
            break;
          }
        }
        
        // Calculate spectral bandwidth
        const centroid = centroidNum / centroidDen;
        let bandwidthSum = 0;
        for (let bin = 0; bin < powerSpectrum.length; bin++) {
          const frequency = (bin * sampleRate) / fftSize;
          bandwidthSum += Math.pow(frequency - centroid, 2) * powerSpectrum[bin];
        }
        spectralBandwidth += Math.sqrt(bandwidthSum / centroidDen);
      }
      
      // Calculate RMS for this frame
      let frameRMS = 0;
      for (let i = 0; i < window.length; i++) {
        frameRMS += window[i] * window[i];
      }
      rms += Math.sqrt(frameRMS / window.length);
      
      // Calculate zero crossing rate for this frame
      let crossings = 0;
      for (let i = 1; i < window.length; i++) {
        if ((window[i] >= 0) !== (window[i-1] >= 0)) crossings++;
      }
      zeroCrossingRate += crossings / (window.length - 1);
      
      // Calculate spectral flux
      if (prevSpectrum) {
        let flux = 0;
        for (let bin = 0; bin < Math.min(powerSpectrum.length, prevSpectrum.length); bin++) {
          const diff = powerSpectrum[bin] - prevSpectrum[bin];
          flux += diff > 0 ? diff : 0;
        }
        spectralFlux += flux;
      }
      prevSpectrum = [...powerSpectrum];
    }
    
    return {
      spectralCentroid: spectralCentroid / maxFrames,
      spectralRolloff: spectralRolloff / maxFrames,
      spectralBandwidth: spectralBandwidth / maxFrames,
      zeroCrossingRate: zeroCrossingRate / maxFrames,
      rms: rms / maxFrames,
      spectralFlux: spectralFlux / (maxFrames - 1)
    };
  }
  
  // Apply Hamming window to reduce spectral leakage
  applyHammingWindow(data) {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (data.length - 1));
      windowed[i] = data[i] * w;
    }
    return windowed;
  }
  
  // Calculate FFT using optimized algorithm
  calculateFFT(data) {
    const N = data.length;
    const output = new Float32Array(N * 2);
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += data[n] * Math.cos(angle);
        imag += data[n] * Math.sin(angle);
      }
      output[k] = real;
      output[k + N / 2] = imag;
    }
    return output;
  }
  
  // Get power spectrum from FFT
  getPowerSpectrum(fft) {
    const N = fft.length / 2;
    const power = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const real = fft[i];
      const imag = fft[i + N];
      power[i] = real * real + imag * imag;
    }
    return power;
  }

  // Optimized MFCC calculation for faster processing
  calculateImprovedMFCC(audioData, sampleRate) {
    const fftSize = 512; // Reduced from 1024
    const numCoeffs = 13;
    const numFilters = 20; // Reduced from 26
    const mfccs = new Array(numCoeffs).fill(0);
    const hopSize = 1024; // Increased for speed
    const numFrames = Math.min(15, Math.floor((audioData.length - fftSize) / hopSize)); // Reduced from 50
    
    // Create mel filter bank
    const melFilters = this.createMelFilterBank(numFilters, fftSize, sampleRate);
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      
      // Apply window and FFT
      const windowedData = this.applyHammingWindow(window);
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Apply mel filters
      const melEnergies = new Array(numFilters).fill(0);
      for (let f = 0; f < numFilters; f++) {
        for (let bin = 0; bin < powerSpectrum.length; bin++) {
          melEnergies[f] += powerSpectrum[bin] * melFilters[f][bin];
        }
        melEnergies[f] = Math.log(Math.max(melEnergies[f], 1e-10));
      }
      
      // Apply DCT to get MFCC coefficients
      for (let c = 0; c < numCoeffs; c++) {
        let sum = 0;
        for (let f = 0; f < numFilters; f++) {
          sum += melEnergies[f] * Math.cos(Math.PI * c * (f + 0.5) / numFilters);
        }
        mfccs[c] += sum;
      }
    }
    
    return mfccs.map(val => val / numFrames);
  }
  
  // Create mel-scale filter bank
  createMelFilterBank(numFilters, fftSize, sampleRate) {
    const melFilters = [];
    const nyquist = sampleRate / 2;
    const melMax = this.hzToMel(nyquist);
    const melPoints = [];
    
    // Create mel-spaced points
    for (let i = 0; i <= numFilters + 1; i++) {
      melPoints.push(this.melToHz(i * melMax / (numFilters + 1)));
    }
    
    // Convert to FFT bin indices
    const binPoints = melPoints.map(freq => Math.floor((fftSize + 1) * freq / sampleRate));
    
    // Create triangular filters
    for (let f = 0; f < numFilters; f++) {
      const filter = new Array(fftSize / 2).fill(0);
      const left = binPoints[f];
      const center = binPoints[f + 1];
      const right = binPoints[f + 2];
      
      for (let bin = left; bin < center; bin++) {
        if (bin < filter.length) {
          filter[bin] = (bin - left) / (center - left);
        }
      }
      
      for (let bin = center; bin < right; bin++) {
        if (bin < filter.length) {
          filter[bin] = (right - bin) / (right - center);
        }
      }
      
      melFilters.push(filter);
    }
    
    return melFilters;
  }
  
  // Optimized chroma features for faster processing
  calculateChromaFeatures(audioData, sampleRate) {
    const chromaBins = 12; // 12 semitones
    const chroma = new Array(chromaBins).fill(0);
    const fftSize = 256; // Further reduced for speed
    const hopSize = 2048; // Increased for speed
    const numFrames = Math.min(5, Math.floor((audioData.length - fftSize) / hopSize)); // Further reduced
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      const windowedData = this.applyHammingWindow(window);
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Map frequency bins to chroma bins
      for (let bin = 1; bin < powerSpectrum.length; bin++) {
        const frequency = (bin * sampleRate) / fftSize;
        if (frequency > 80 && frequency < 5000) { // Focus on musical range
          const pitch = 12 * Math.log2(frequency / 440) + 69; // MIDI note number
          const chromaIndex = Math.round(pitch) % 12;
          if (chromaIndex >= 0 && chromaIndex < 12) {
            chroma[chromaIndex] += powerSpectrum[bin];
          }
        }
      }
    }
    
    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    return sum > 0 ? chroma.map(val => val / sum) : chroma;
  }
  
  // Optimized rhythm and beat features
  calculateRhythmFeatures(audioData, sampleRate) {
    const hopSize = 1024; // Increased for speed
    const numFrames = Math.floor(audioData.length / hopSize);
    const onsetStrength = [];
    
    // Calculate onset strength function (simplified)
    let prevEnergy = 0;
    for (let frame = 0; frame < Math.min(numFrames, 30); frame++) { // Reduced from 100
      const start = frame * hopSize;
      const window = audioData.slice(start, start + hopSize);
      if (window.length < hopSize) break;
      
      // Simplified energy calculation instead of full FFT
      let energy = 0;
      for (let i = 0; i < window.length; i++) {
        energy += window[i] * window[i];
      }
      energy = Math.sqrt(energy / window.length);
      
      if (frame > 0) {
        const onset = Math.max(0, energy - prevEnergy * 1.1);
        onsetStrength.push(onset);
      }
      prevEnergy = energy;
    }
    
    // Calculate rhythm regularity
    const rhythmRegularity = this.calculateRhythmRegularity(onsetStrength);
    const beatStrength = onsetStrength.reduce((a, b) => a + b, 0) / onsetStrength.length;
    
    return {
      rhythmRegularity,
      beatStrength,
      onsetDensity: onsetStrength.filter(x => x > beatStrength * 1.5).length / onsetStrength.length
    };
  }
  
  // Calculate rhythm regularity using autocorrelation
  calculateRhythmRegularity(onsetStrength) {
    if (onsetStrength.length < 10) return 0;
    
    const maxLag = Math.min(20, Math.floor(onsetStrength.length / 2));
    let maxCorr = 0;
    
    for (let lag = 1; lag < maxLag; lag++) {
      let corr = 0;
      let count = 0;
      
      for (let i = 0; i < onsetStrength.length - lag; i++) {
        corr += onsetStrength[i] * onsetStrength[i + lag];
        count++;
      }
      
      if (count > 0) {
        corr /= count;
        maxCorr = Math.max(maxCorr, corr);
      }
    }
    
    return maxCorr;
  }
  
  // Calculate harmonic features for genre classification
  calculateHarmonicFeatures(audioData, sampleRate) {
    const fftSize = 256;
    const hopSize = 2048;
    const numFrames = Math.min(8, Math.floor((audioData.length - fftSize) / hopSize));
    
    let harmonicity = 0;
    let spectralCentroidMean = 0;
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      const windowedData = this.applyHammingWindow(window);
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Find fundamental frequency
      const f0 = this.estimateFundamentalFreq(powerSpectrum, sampleRate, fftSize);
      
      if (f0 > 0) {
        // Calculate harmonicity
        let harmonicEnergy = 0;
        let totalEnergy = 0;
        
        for (let harmonic = 1; harmonic <= 5; harmonic++) {
          const harmonicFreq = f0 * harmonic;
          const bin = Math.round(harmonicFreq * fftSize / sampleRate);
          
          if (bin < powerSpectrum.length) {
            harmonicEnergy += powerSpectrum[bin];
          }
        }
        
        totalEnergy = powerSpectrum.reduce((a, b) => a + b, 0);
        harmonicity += totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
      }
      
      // Calculate spectral centroid for this frame
      let centroidNum = 0, centroidDen = 0;
      for (let bin = 0; bin < powerSpectrum.length; bin++) {
        const frequency = (bin * sampleRate) / fftSize;
        centroidNum += frequency * powerSpectrum[bin];
        centroidDen += powerSpectrum[bin];
      }
      spectralCentroidMean += centroidDen > 0 ? centroidNum / centroidDen : 0;
    }
    
    return {
      harmonicity: numFrames > 0 ? harmonicity / numFrames : 0,
      spectralCentroid: numFrames > 0 ? spectralCentroidMean / numFrames : 0
    };
  }

  // Calculate comprehensive MFCC coefficients
  calculateMFCC(audioData, sampleRate) {
    const numCoeffs = 8; // Reduced from 13
    const numFilters = 16; // Reduced from 26
    const fftSize = 256; // Reduced for speed
    const hopSize = 2048; // Increased for speed
    const numFrames = Math.min(8, Math.floor((audioData.length - fftSize) / hopSize)); // Further reduced // Reduced from 20
    
    let harmonicity = 0;
    let spectralCentroidMean = 0;
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      const windowedData = this.applyHammingWindow(window);
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Find fundamental frequency
      const f0 = this.estimateFundamentalFreq(powerSpectrum, sampleRate, fftSize);
      
      if (f0 > 0) {
        // Calculate harmonicity
        let harmonicEnergy = 0;
        let totalEnergy = 0;
        
        for (let harmonic = 1; harmonic <= 10; harmonic++) {
          const harmonicFreq = f0 * harmonic;
          const bin = Math.round(harmonicFreq * fftSize / sampleRate);
          
          if (bin < powerSpectrum.length) {
            harmonicEnergy += powerSpectrum[bin];
          }
        }
        
        totalEnergy = powerSpectrum.reduce((a, b) => a + b, 0);
        harmonicity += totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
      }
      
      // Calculate spectral centroid for this frame
      let centroidNum = 0, centroidDen = 0;
      for (let bin = 0; bin < powerSpectrum.length; bin++) {
        const frequency = (bin * sampleRate) / fftSize;
        centroidNum += frequency * powerSpectrum[bin];
        centroidDen += powerSpectrum[bin];
      }
      
      if (centroidDen > 0) {
        spectralCentroidMean += centroidNum / centroidDen;
      }
    }
    
    return {
      harmonicity: harmonicity / numFrames,
      spectralCentroidMean: spectralCentroidMean / numFrames
    };
  }
  
  // Estimate fundamental frequency using harmonic product spectrum
  estimateFundamentalFreq(powerSpectrum, sampleRate, fftSize) {
    const minF0 = 80; // Hz
    const maxF0 = 800; // Hz
    const minBin = Math.floor(minF0 * fftSize / sampleRate);
    const maxBin = Math.floor(maxF0 * fftSize / sampleRate);
    
    let maxProduct = 0;
    let bestF0 = 0;
    
    for (let bin = minBin; bin < maxBin && bin < powerSpectrum.length; bin++) {
      let product = powerSpectrum[bin];
      
      // Multiply with harmonics
      for (let harmonic = 2; harmonic <= 5; harmonic++) {
        const harmonicBin = bin * harmonic;
        if (harmonicBin < powerSpectrum.length) {
          product *= Math.pow(powerSpectrum[harmonicBin], 1.0 / harmonic);
        }
      }
      
      if (product > maxProduct) {
        maxProduct = product;
        bestF0 = (bin * sampleRate) / fftSize;
      }
    }
    
    return bestF0;
  }
  
  melToHz(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }
  
  hzToMel(hz) {
    return 2595 * Math.log10(1 + hz / 700);
  }
  
  // Optimized tempo detection for faster performance
  calculateImprovedTempo(audioData, sampleRate) {
    const windowSize = 1024; // Reduced from 2048
    const hopSize = 1024; // Increased from 512 for faster processing
    const minTempo = 60;
    const maxTempo = 200;
    const maxFrames = 30; // Limit frames for speed
    
    // Calculate onset strength function (simplified)
    const onsetStrength = [];
    let prevEnergy = 0;
    
    for (let i = 0; i < audioData.length - windowSize && onsetStrength.length < maxFrames; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      
      // Calculate energy (simpler than full FFT)
      let energy = 0;
      for (let j = 0; j < window.length; j++) {
        energy += window[j] * window[j];
      }
      energy = Math.sqrt(energy / window.length);
      
      if (i > 0) {
        const onset = Math.max(0, energy - prevEnergy * 1.1);
        onsetStrength.push(onset);
      }
      prevEnergy = energy;
    }
    
    if (onsetStrength.length < 5) return 120;
    
    // Simplified peak detection
    const intervals = [];
    for (let i = 1; i < onsetStrength.length - 1; i++) {
      if (onsetStrength[i] > onsetStrength[i-1] && onsetStrength[i] > onsetStrength[i+1] && onsetStrength[i] > 0.1) {
        intervals.push(i);
      }
    }
    
    if (intervals.length < 2) return 120;
    
    // Calculate average interval
    const diffs = [];
    for (let i = 1; i < intervals.length; i++) {
      diffs.push(intervals[i] - intervals[i-1]);
    }
    
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const tempo = Math.round(60 * sampleRate / (avgDiff * hopSize));
    
    return Math.max(minTempo, Math.min(maxTempo, tempo));
  }

  // Extract all features using improved algorithms
  extractFeatures(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const duration = length / sampleRate;

    // Get audio data (use left channel for analysis)
    const leftChannel = audioBuffer.getChannelData(0);

    // Limit analysis to first 30 seconds for performance
    const maxSamples = Math.min(leftChannel.length, sampleRate * 30);
    const analysisData = leftChannel.slice(0, maxSamples);

    // Calculate improved features using autocorrelation-based tempo
    const tempo = this.calculateTempoAutocorrelation(analysisData, sampleRate);
    const spectralFeatures = this.calculateSpectralFeatures(analysisData, sampleRate);
    const mfcc = this.calculateImprovedMFCC(analysisData, sampleRate);
    const chroma = this.calculateChromaFeatures(analysisData, sampleRate);
    const rhythmFeatures = this.calculateRhythmFeatures(analysisData, sampleRate);
    const harmonicFeatures = this.calculateHarmonicFeatures(analysisData, sampleRate);

    return {
      tempo,
      spectralCentroid: spectralFeatures.spectralCentroid,
      spectralRolloff: spectralFeatures.spectralRolloff,
      spectralBandwidth: spectralFeatures.spectralBandwidth,
      zeroCrossingRate: spectralFeatures.zeroCrossingRate,
      rms: spectralFeatures.rms,
      spectralFlux: spectralFeatures.spectralFlux,
      mfcc,
      chroma,
      rhythmRegularity: rhythmFeatures.rhythmRegularity,
      beatStrength: rhythmFeatures.beatStrength,
      onsetDensity: rhythmFeatures.onsetDensity,
      harmonicity: harmonicFeatures.harmonicity,
      spectralCentroidMean: harmonicFeatures.spectralCentroidMean,
      duration: Math.min(duration, 30)
    };
  }

}

// Genre classifier
class GenreClassifier {
  classify(features) {
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

  calculateGenreScores(features) {
    const scores = {};

    // Enhanced scoring using all available features
    scores.Pop = this.calculatePopScore(features);
    scores.Rock = this.calculateRockScore(features);
    scores['Hip-Hop'] = this.calculateHipHopScore(features);
    scores.Electronic = this.calculateElectronicScore(features);
    scores.Jazz = this.calculateJazzScore(features);
    scores.Classical = this.calculateClassicalScore(features);
    scores.Country = this.calculateCountryScore(features);
    scores['R&B'] = this.calculateRBScore(features);
    scores.Blues = this.calculateBluesScore(features);
    scores.Folk = this.calculateFolkScore(features);
    scores.Reggae = this.calculateReggaeScore(features);
    scores.Metal = this.calculateMetalScore(features);

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      Object.keys(scores).forEach(genre => {
        scores[genre] = Math.min(1, scores[genre] / maxScore);
      });
    }

    return scores;
  }

  calculatePopScore(features) {
    let score = 0;
    
    // Tempo characteristics
    if (features.tempo >= 100 && features.tempo <= 140) score += 0.25;
    
    // Spectral characteristics
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 3000) score += 0.2;
    if (features.spectralBandwidth >= 800 && features.spectralBandwidth <= 1500) score += 0.15;
    
    // Energy and dynamics
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.15;
    if (features.beatStrength && features.beatStrength >= 0.3) score += 0.1;
    
    // Harmonic content
    if (features.harmonicity && features.harmonicity >= 0.4) score += 0.1;
    
    // MFCC characteristics (pop tends to have balanced MFCC)
    if (features.mfcc && features.mfcc.length > 0) {
      const mfccVariance = this.calculateVariance(features.mfcc.slice(1, 6));
      if (mfccVariance >= 0.5 && mfccVariance <= 2.0) score += 0.05;
    }
    
    return Math.min(score, 1);
  }

  calculateRockScore(features) {
    let score = 0;
    
    // Rock tempo range
    if (features.tempo >= 120 && features.tempo <= 160) score += 0.25;
    
    // Bright, aggressive sound
    if (features.spectralCentroid >= 2000) score += 0.2;
    if (features.spectralBandwidth >= 1200) score += 0.15;
    
    // High energy and dynamics
    if (features.rms >= 0.2) score += 0.15;
    if (features.spectralFlux >= 0.3) score += 0.1;
    
    // Strong beat and rhythm
    if (features.beatStrength && features.beatStrength >= 0.4) score += 0.1;
    if (features.onsetDensity && features.onsetDensity >= 0.3) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateHipHopScore(features) {
    let score = 0;
    
    // Hip-hop tempo characteristics
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.25;
    
    // Bass-heavy characteristics
    if (features.spectralCentroid <= 1500) score += 0.2;
    if (features.rms >= 0.2) score += 0.15;
    
    // Strong, regular beat
    if (features.beatStrength && features.beatStrength >= 0.5) score += 0.15;
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.7) score += 0.1;
    
    // Percussive elements
    if (features.onsetDensity && features.onsetDensity >= 0.4) score += 0.1;
    if (features.zeroCrossingRate >= 0.08) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateElectronicScore(features) {
    let score = 0;
    
    // Electronic tempo characteristics
    if (features.tempo >= 120 && features.tempo <= 140) score += 0.2;
    
    // Synthetic/digital sound characteristics
    if (features.spectralCentroid >= 2000) score += 0.2;
    if (features.spectralBandwidth >= 1500) score += 0.15;
    if (features.spectralFlux >= 0.4) score += 0.15;
    
    // Regular, programmed rhythms
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.7) score += 0.15;
    if (features.beatStrength && features.beatStrength >= 0.5) score += 0.1;
    
    // Low harmonicity (synthetic sounds)
    if (features.harmonicity && features.harmonicity <= 0.3) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateJazzScore(features) {
    let score = 0;
    
    // Jazz tempo range (swing, bebop, etc.)
    if (features.tempo >= 100 && features.tempo <= 180) score += 0.2;
    
    // Complex harmonic content
    if (features.harmonicity && features.harmonicity >= 0.6) score += 0.2;
    if (features.spectralCentroid >= 1500) score += 0.15;
    if (features.spectralBandwidth >= 1000) score += 0.15;
    
    // Dynamic variations (improvisation)
    if (features.spectralFlux >= 0.3) score += 0.15;
    
    // Chroma complexity (jazz harmony)
    if (features.chroma && features.chroma.length > 0) {
      const chromaVariance = this.calculateVariance(features.chroma);
      if (chromaVariance >= 0.02) score += 0.1;
    }
    
    // Irregular rhythms
    if (features.rhythmRegularity && features.rhythmRegularity <= 0.6) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateClassicalScore(features) {
    let score = 0;
    
    // Classical tempo range
    if (features.tempo >= 60 && features.tempo <= 120) score += 0.25;
    
    // Rich harmonic content
    if (features.harmonicity && features.harmonicity >= 0.7) score += 0.2;
    if (features.spectralCentroid >= 1500 && features.spectralCentroid <= 3000) score += 0.15;
    
    // Controlled dynamics
    if (features.rms <= 0.25) score += 0.15;
    if (features.spectralFlux <= 0.25) score += 0.1;
    
    // Low zero crossing (smooth tones)
    if (features.zeroCrossingRate <= 0.05) score += 0.1;
    
    // Complex but structured rhythm
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.5 && features.rhythmRegularity <= 0.8) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateCountryScore(features) {
    let score = 0;
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    if (features.rms <= 0.2) score += 0.2;
    if (features.spectralFlux <= 0.3) score += 0.2;
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    return Math.min(score, 1);
  }

  calculateRBScore(features) {
    let score = 0;
    if (features.tempo >= 70 && features.tempo <= 110) score += 0.3;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    if (features.spectralFlux <= 0.3) score += 0.2;
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    return Math.min(score, 1);
  }

  calculateBluesScore(features) {
    let score = 0;
    if (features.tempo >= 60 && features.tempo <= 120) score += 0.3;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    if (features.spectralFlux >= 0.2 && features.spectralFlux <= 0.4) score += 0.2;
    if (features.zeroCrossingRate >= 0.05 && features.zeroCrossingRate <= 0.1) score += 0.1;
    return Math.min(score, 1);
  }

  calculateFolkScore(features) {
    let score = 0;
    if (features.tempo >= 60 && features.tempo <= 100) score += 0.3;
    if (features.spectralCentroid <= 2000) score += 0.2;
    if (features.rms <= 0.2) score += 0.2;
    if (features.spectralFlux <= 0.3) score += 0.2;
    if (features.zeroCrossingRate <= 0.08) score += 0.1;
    return Math.min(score, 1);
  }

  calculateReggaeScore(features) {
    let score = 0;
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.2;
    if (features.rms >= 0.1 && features.rms <= 0.3) score += 0.2;
    if (features.spectralFlux <= 0.3) score += 0.2;
    if (features.zeroCrossingRate >= 0.05 && features.zeroCrossingRate <= 0.1) score += 0.1;
    return Math.min(score, 1);
  }

  calculateMetalScore(features) {
    let score = 0;
    if (features.tempo >= 120 && features.tempo <= 200) score += 0.3;
    if (features.spectralCentroid >= 2000) score += 0.2;
    if (features.rms >= 0.2) score += 0.2;
    if (features.spectralFlux >= 0.4) score += 0.2;
    if (features.zeroCrossingRate >= 0.1) score += 0.1;
    return Math.min(score, 1);
  }

  describeFeatures(features) {
    const descriptions = [];
    
    // Tempo description
    if (features.tempo > 140) descriptions.push("fast tempo");
    else if (features.tempo < 80) descriptions.push("slow tempo");
    else descriptions.push("moderate tempo");
    
    // Spectral characteristics
    if (features.spectralCentroid > 2500) descriptions.push("very bright sound");
    else if (features.spectralCentroid > 2000) descriptions.push("bright sound");
    else if (features.spectralCentroid < 1000) descriptions.push("bass-heavy");
    else descriptions.push("balanced frequency");
    
    // Energy level
    if (features.rms > 0.3) descriptions.push("very high energy");
    else if (features.rms > 0.2) descriptions.push("high energy");
    else if (features.rms < 0.1) descriptions.push("low energy");
    else descriptions.push("moderate energy");
    
    // Dynamic characteristics
    if (features.spectralFlux > 0.5) descriptions.push("very dynamic");
    else if (features.spectralFlux > 0.4) descriptions.push("dynamic changes");
    else if (features.spectralFlux < 0.2) descriptions.push("steady rhythm");
    else descriptions.push("moderate dynamics");
    
    // Harmonic content
    if (features.harmonicity) {
      if (features.harmonicity > 0.7) descriptions.push("rich harmonics");
      else if (features.harmonicity < 0.3) descriptions.push("synthetic/percussive");
    }
    
    // Rhythm regularity
    if (features.rhythmRegularity) {
      if (features.rhythmRegularity > 0.8) descriptions.push("very regular rhythm");
      else if (features.rhythmRegularity < 0.4) descriptions.push("irregular rhythm");
    }
    
    return descriptions.join(", ");
  }
  
  // Helper method to calculate variance
  calculateVariance(array) {
    if (array.length === 0) return 0;
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
    return variance;
  }
}

// Worker message handler
self.onmessage = function(e) {
  const { audioData, sampleRate, length, id } = e.data;
  
  try {
    const analyzer = new AudioAnalyzer();
    const classifier = new GenreClassifier();
    
    // Convert ArrayBuffer back to Float32Array
    const audioArray = new Float32Array(audioData);
    
    // Create mock AudioBuffer-like object
    const mockAudioBuffer = {
      sampleRate: sampleRate,
      length: length || audioArray.length,
      getChannelData: function(channel) {
        return audioArray;
      }
    };
    
    // Extract comprehensive features
    const features = analyzer.extractFeatures(mockAudioBuffer);
    
    // Classify genre with improved scoring
    const result = classifier.classify(features);
    
    // Send result back with detailed analysis
    self.postMessage({
      id,
      success: true,
      result: {
        ...result,
        analysisTime: Date.now(),
        featureCount: Object.keys(features).length
      }
    });
  } catch (error) {
    console.error('Audio analysis error:', error);
    self.postMessage({
      id,
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
