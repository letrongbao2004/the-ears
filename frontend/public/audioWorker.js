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

  // Enhanced spectral features for better genre detection
  calculateSpectralFeatures(audioData, sampleRate) {
    const fftSize = 512; // Increased for better frequency resolution
    const hopSize = 1024; // Balanced for accuracy and speed
    const maxFrames = 25; // More frames for better analysis
    const numFrames = Math.min(maxFrames, Math.floor((audioData.length - fftSize) / hopSize));
    
    let spectralCentroid = 0;
    let spectralRolloff = 0;
    let spectralBandwidth = 0;
    let zeroCrossingRate = 0;
    let rms = 0;
    let spectralFlux = 0;
    let spectralFlatness = 0; // Added for detecting synthetic vs. natural sounds
    let lowFreqEnergy = 0; // Added for bass detection
    let midFreqEnergy = 0; // Added for vocal range detection
    let highFreqEnergy = 0; // Added for brightness detection
    let prevSpectrum = null;
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const window = audioData.slice(start, start + fftSize);
      
      // Apply Hamming window
      const windowedData = this.applyHammingWindow(window);
      
      // Calculate FFT
      const spectrum = this.calculateFFT(windowedData);
      const powerSpectrum = this.getPowerSpectrum(spectrum);
      
      // Calculate spectral features with frequency band analysis
      let centroidNum = 0, centroidDen = 0;
      let rolloffEnergy = 0, totalEnergy = 0;
      let geoMean = 1, arithMean = 0; // For spectral flatness
      let validBins = 0;
      
      for (let bin = 1; bin < powerSpectrum.length; bin++) { // Skip DC component
        const frequency = (bin * sampleRate) / fftSize;
        const magnitude = powerSpectrum[bin];
        
        if (magnitude > 0) {
          centroidNum += frequency * magnitude;
          centroidDen += magnitude;
          totalEnergy += magnitude;
          
          // Frequency band energy analysis
          if (frequency <= 250) {
            lowFreqEnergy += magnitude; // Bass range
          } else if (frequency <= 4000) {
            midFreqEnergy += magnitude; // Vocal/instrument range
          } else {
            highFreqEnergy += magnitude; // Brightness range
          }
          
          // For spectral flatness calculation
          geoMean *= Math.pow(magnitude, 1.0 / (powerSpectrum.length - 1));
          arithMean += magnitude;
          validBins++;
        }
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
      
      // Calculate spectral flatness (measure of noisiness vs. tonality)
      if (validBins > 0 && arithMean > 0) {
        spectralFlatness += geoMean / (arithMean / validBins);
      }
      
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
    
    // Normalize frequency band energies
    const totalBandEnergy = lowFreqEnergy + midFreqEnergy + highFreqEnergy;
    if (totalBandEnergy > 0) {
      lowFreqEnergy /= totalBandEnergy;
      midFreqEnergy /= totalBandEnergy;
      highFreqEnergy /= totalBandEnergy;
    }
    
    return {
      spectralCentroid: spectralCentroid / numFrames,
      spectralRolloff: spectralRolloff / numFrames,
      spectralBandwidth: spectralBandwidth / numFrames,
      zeroCrossingRate: zeroCrossingRate / numFrames,
      rms: rms / numFrames,
      spectralFlux: spectralFlux / Math.max(1, numFrames - 1),
      spectralFlatness: spectralFlatness / numFrames,
      lowFreqEnergy: lowFreqEnergy,
      midFreqEnergy: midFreqEnergy,
      highFreqEnergy: highFreqEnergy
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
  
  // Enhanced tempo detection with better modern music support
  calculateImprovedTempo(audioData, sampleRate) {
    const windowSize = 1024;
    const hopSize = 512; // Reduced for better resolution
    const minTempo = 50; // Lower for ballads and trap
    const maxTempo = 200;
    const maxFrames = 40; // Increased for better analysis
    
    // Calculate onset strength function with improved detection
    const onsetStrength = [];
    let prevEnergy = 0;
    let prevSpectralFlux = 0;
    
    for (let i = 0; i < audioData.length - windowSize && onsetStrength.length < maxFrames; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      
      // Calculate both energy and spectral flux for better onset detection
      let energy = 0;
      let spectralFlux = 0;
      
      // Energy calculation
      for (let j = 0; j < window.length; j++) {
        energy += window[j] * window[j];
      }
      energy = Math.sqrt(energy / window.length);
      
      // Simple spectral flux (high frequency changes)
      for (let j = 1; j < window.length; j++) {
        const diff = Math.abs(window[j] - window[j-1]);
        spectralFlux += diff;
      }
      spectralFlux /= window.length;
      
      if (i > 0) {
        // Combine energy and spectral flux for better onset detection
        const energyOnset = Math.max(0, energy - prevEnergy * 1.05);
        const fluxOnset = Math.max(0, spectralFlux - prevSpectralFlux * 1.1);
        const combinedOnset = (energyOnset * 0.7) + (fluxOnset * 0.3);
        onsetStrength.push(combinedOnset);
      }
      prevEnergy = energy;
      prevSpectralFlux = spectralFlux;
    }
    
    if (onsetStrength.length < 5) return 120;
    
    // Improved peak detection with adaptive threshold
    const avgOnset = onsetStrength.reduce((a, b) => a + b, 0) / onsetStrength.length;
    const threshold = Math.max(0.05, avgOnset * 0.3);
    
    const intervals = [];
    for (let i = 2; i < onsetStrength.length - 2; i++) {
      if (onsetStrength[i] > onsetStrength[i-1] && 
          onsetStrength[i] > onsetStrength[i+1] && 
          onsetStrength[i] > threshold &&
          onsetStrength[i] > onsetStrength[i-2] &&
          onsetStrength[i] > onsetStrength[i+2]) {
        intervals.push(i);
      }
    }
    
    if (intervals.length < 2) return 120;
    
    // Calculate multiple tempo candidates
    const tempoCandidates = [];
    for (let i = 1; i < intervals.length; i++) {
      const diff = intervals[i] - intervals[i-1];
      const tempo = Math.round(60 * sampleRate / (diff * hopSize));
      if (tempo >= minTempo && tempo <= maxTempo) {
        tempoCandidates.push(tempo);
      }
    }
    
    if (tempoCandidates.length === 0) return 120;
    
    // Find most common tempo (mode)
    const tempoCount = {};
    tempoCandidates.forEach(tempo => {
      const rounded = Math.round(tempo / 5) * 5; // Round to nearest 5 BPM
      tempoCount[rounded] = (tempoCount[rounded] || 0) + 1;
    });
    
    const mostCommonTempo = Object.keys(tempoCount).reduce((a, b) => 
      tempoCount[a] > tempoCount[b] ? a : b
    );
    
    return parseInt(mostCommonTempo);
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
      spectralFlatness: spectralFeatures.spectralFlatness,
      lowFreqEnergy: spectralFeatures.lowFreqEnergy,
      midFreqEnergy: spectralFeatures.midFreqEnergy,
      highFreqEnergy: spectralFeatures.highFreqEnergy,
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

// Emotion analyzer for music visualization
class EmotionAnalyzer {
  analyzeEmotion(features) {
    const emotions = this.calculateEmotionScores(features);
    const primaryEmotion = this.getPrimaryEmotion(emotions);
    const colorPalette = this.getEmotionColors(primaryEmotion, emotions);
    const intensity = this.calculateEmotionIntensity(features);
    
    return {
      primaryEmotion,
      emotions,
      colorPalette,
      intensity,
      musicSection: this.detectMusicSection(features),
      energyLevel: this.calculateEnergyLevel(features)
    };
  }

  calculateEmotionScores(features) {
    const emotions = {};
    
    // Joy/Happiness - bright, fast, major key characteristics
    emotions.joy = this.calculateJoyScore(features);
    
    // Sadness - slow, minor key, low energy
    emotions.sadness = this.calculateSadnessScore(features);
    
    // Anger/Intensity - loud, aggressive, high energy
    emotions.anger = this.calculateAngerScore(features);
    
    // Calm/Peace - moderate tempo, balanced, stable
    emotions.calm = this.calculateCalmScore(features);
    
    // Excitement/Energy - fast, dynamic, high energy
    emotions.excitement = this.calculateExcitementScore(features);
    
    // Melancholy - slow, contemplative, minor characteristics
    emotions.melancholy = this.calculateMelancholyScore(features);
    
    // Romantic/Tender - moderate, warm, harmonic
    emotions.romantic = this.calculateRomanticScore(features);
    
    // Mysterious/Dark - low frequencies, irregular rhythms
    emotions.mysterious = this.calculateMysteriousScore(features);
    
    return emotions;
  }

  calculateJoyScore(features) {
    let score = 0;
    
    // Fast, upbeat tempo (more flexible range)
    if (features.tempo >= 110 && features.tempo <= 170) {
      score += features.tempo >= 130 && features.tempo <= 150 ? 0.4 : 0.25;
    }
    
    // Bright spectral characteristics (adjusted thresholds)
    if (features.spectralCentroid >= 1800) score += 0.25;
    if (features.highFreqEnergy && features.highFreqEnergy >= 0.25) score += 0.2;
    
    // High energy and dynamics (more sensitive)
    if (features.rms >= 0.15) score += 0.2;
    if (features.beatStrength && features.beatStrength >= 0.35) score += 0.15;
    
    // Regular, danceable rhythm (more forgiving)
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.6) score += 0.15;
    
    // Major key characteristics
    if (features.harmonicity && features.harmonicity >= 0.5) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateSadnessScore(features) {
    let score = 0;
    
    // Slow tempo (expanded range)
    if (features.tempo <= 90) {
      score += features.tempo <= 70 ? 0.4 : 0.25;
    }
    
    // Lower spectral characteristics (more sensitive)
    if (features.spectralCentroid <= 1800) score += 0.25;
    if (features.lowFreqEnergy && features.lowFreqEnergy >= 0.3) score += 0.2;
    
    // Low energy (more forgiving threshold)
    if (features.rms <= 0.18) score += 0.2;
    
    // Smooth, less dynamic (adjusted)
    if (features.spectralFlux <= 0.25) score += 0.15;
    
    // Rich harmonics but lower energy (emotional depth)
    if (features.harmonicity && features.harmonicity >= 0.5) score += 0.15;
    
    // Minor key characteristics
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.4) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateAngerScore(features) {
    let score = 0;
    
    // Fast, aggressive tempo (broader range)
    if (features.tempo >= 130) {
      score += features.tempo >= 160 ? 0.35 : 0.25;
    }
    
    // High energy and loudness
    if (features.rms >= 0.25) score += 0.3;
    
    // Sharp, harsh spectral characteristics
    if (features.spectralFlux >= 0.4) score += 0.25;
    if (features.highFreqEnergy && features.highFreqEnergy >= 0.4) score += 0.2;
    
    // Irregular, aggressive rhythm
    if (features.beatStrength && features.beatStrength >= 0.5) score += 0.15;
    
    // Distorted or harsh harmonics
    if (features.spectralFlatness && features.spectralFlatness <= 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateExcitementScore(features) {
    let score = 0;
    
    // Fast tempo
    if (features.tempo >= 120) {
      score += features.tempo >= 140 ? 0.35 : 0.25;
    }
    
    // High energy
    if (features.rms >= 0.2) score += 0.25;
    
    // Dynamic and changing
    if (features.spectralFlux >= 0.3) score += 0.2;
    
    // Strong beat
    if (features.beatStrength && features.beatStrength >= 0.4) score += 0.2;
    
    // Bright and energetic
    if (features.highFreqEnergy && features.highFreqEnergy >= 0.3) score += 0.15;
    
    // Regular rhythm for danceability
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.6) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateCalmScore(features) {
    let score = 0;
    
    // Moderate tempo
    if (features.tempo >= 80 && features.tempo <= 120) score += 0.3;
    
    // Balanced energy
    if (features.rms >= 0.1 && features.rms <= 0.25) score += 0.25;
    
    // Stable spectral characteristics
    if (features.spectralFlux <= 0.3) score += 0.2;
    
    // Harmonic content
    if (features.harmonicity && features.harmonicity >= 0.6) score += 0.2;
    
    // Balanced frequency distribution
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.4) score += 0.15;
    
    // Regular but not too strong rhythm
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.5 && features.rhythmRegularity <= 0.8) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateMelancholyScore(features) {
    let score = 0;
    
    // Slow to moderate tempo
    if (features.tempo >= 60 && features.tempo <= 100) score += 0.3;
    
    // Lower spectral centroid but not too low
    if (features.spectralCentroid >= 1200 && features.spectralCentroid <= 2000) score += 0.25;
    
    // Moderate energy with emotional depth
    if (features.rms >= 0.12 && features.rms <= 0.22) score += 0.2;
    
    // Rich harmonics
    if (features.harmonicity && features.harmonicity >= 0.6) score += 0.2;
    
    // Contemplative rhythm
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.4 && features.rhythmRegularity <= 0.7) score += 0.15;
    
    return Math.min(score, 1);
  }

  calculateRomanticScore(features) {
    let score = 0;
    
    // Moderate, flowing tempo
    if (features.tempo >= 70 && features.tempo <= 110) score += 0.3;
    
    // Warm spectral characteristics
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.4) score += 0.25;
    
    // Smooth and flowing
    if (features.spectralFlux <= 0.25) score += 0.2;
    
    // Rich harmonics
    if (features.harmonicity && features.harmonicity >= 0.7) score += 0.2;
    
    // Gentle energy
    if (features.rms >= 0.1 && features.rms <= 0.2) score += 0.15;
    
    return Math.min(score, 1);
  }

  calculateMysteriousScore(features) {
    let score = 0;
    
    // Variable tempo or very slow
    if (features.tempo <= 80 || (features.tempo >= 100 && features.tempo <= 130)) score += 0.25;
    
    // Dark spectral characteristics
    if (features.lowFreqEnergy && features.lowFreqEnergy >= 0.4) score += 0.3;
    if (features.spectralCentroid <= 1500) score += 0.2;
    
    // Irregular or weak rhythm
    if (features.rhythmRegularity && features.rhythmRegularity <= 0.5) score += 0.2;
    
    // Complex harmonics
    if (features.spectralFlatness && features.spectralFlatness >= 0.4) score += 0.15;
    
    return Math.min(score, 1);
  }

  getPrimaryEmotion(emotions) {
    let maxScore = 0;
    let primaryEmotion = 'calm';
    
    for (const [emotion, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion;
      }
    }
    
    return primaryEmotion;
  }

  calculateEmotionIntensity(features) {
    // Combine multiple factors for overall intensity
    let intensity = 0;
    
    // Energy contribution
    intensity += (features.rms || 0) * 0.4;
    
    // Tempo contribution (normalized)
    const tempoIntensity = Math.min((features.tempo || 120) / 160, 1);
    intensity += tempoIntensity * 0.3;
    
    // Spectral flux (dynamics)
    intensity += (features.spectralFlux || 0) * 0.3;
    
    return Math.min(intensity, 1);
  }

  calculateEnergyLevel(features) {
    const energy = (features.rms || 0) + (features.spectralFlux || 0) * 0.5;
    
    if (energy >= 0.4) return 'high';
    if (energy >= 0.2) return 'medium';
    return 'low';
  }

  detectMusicSection(features) {
    // Simple heuristic based on energy and dynamics
    const energy = features.rms || 0;
    const dynamics = features.spectralFlux || 0;
    
    if (energy < 0.15 && dynamics < 0.2) return 'intro';
    if (energy >= 0.3 && dynamics >= 0.3) return 'chorus';
    if (energy >= 0.2 && dynamics >= 0.25) return 'bridge';
    if (energy < 0.2) return 'outro';
    return 'verse';
  }

  getEmotionColors(primaryEmotion, emotions) {
    const colorMaps = {
      joy: {
        primary: '#FFD700',
        secondary: '#FFA500',
        accent: '#FF6347',
        gradient: ['#FFD700', '#FFA500', '#FF6347']
      },
      sadness: {
        primary: '#4682B4',
        secondary: '#6495ED',
        accent: '#87CEEB',
        gradient: ['#4682B4', '#6495ED', '#87CEEB']
      },
      anger: {
        primary: '#DC143C',
        secondary: '#B22222',
        accent: '#FF4500',
        gradient: ['#DC143C', '#B22222', '#FF4500']
      },
      calm: {
        primary: '#98FB98',
        secondary: '#90EE90',
        accent: '#00FA9A',
        gradient: ['#98FB98', '#90EE90', '#00FA9A']
      },
      excitement: {
        primary: '#FF1493',
        secondary: '#FF69B4',
        accent: '#FFB6C1',
        gradient: ['#FF1493', '#FF69B4', '#FFB6C1']
      },
      melancholy: {
        primary: '#9370DB',
        secondary: '#8A2BE2',
        accent: '#DDA0DD',
        gradient: ['#9370DB', '#8A2BE2', '#DDA0DD']
      },
      romantic: {
        primary: '#FF69B4',
        secondary: '#FFB6C1',
        accent: '#FFC0CB',
        gradient: ['#FF69B4', '#FFB6C1', '#FFC0CB']
      },
      mysterious: {
        primary: '#2F4F4F',
        secondary: '#696969',
        accent: '#708090',
        gradient: ['#2F4F4F', '#696969', '#708090']
      }
    };

    const baseColors = colorMaps[primaryEmotion] || colorMaps.calm;
    const intensity = this.calculateEmotionIntensity({ rms: emotions[primaryEmotion] || 0.5 });

    return {
      ...baseColors,
      blendedGradient: this.createBlendedGradient(emotions, colorMaps),
      intensity
    };
  }

  createBlendedGradient(emotions, colorMaps) {
    const sortedEmotions = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return sortedEmotions.map(([emotion, weight]) => ({
      color: colorMaps[emotion]?.primary || '#888888',
      weight
    }));
  }

  calculateExcitementScore(features) {
    let score = 0;
    
    // Fast tempo
    if (features.tempo >= 130) score += 0.3;
    
    // High energy
    if (features.rms >= 0.25) score += 0.2;
    if (features.beatStrength && features.beatStrength >= 0.5) score += 0.15;
    
    // Dynamic changes
    if (features.spectralFlux >= 0.35) score += 0.15;
    if (features.onsetDensity && features.onsetDensity >= 0.4) score += 0.1;
    
    // Bright characteristics
    if (features.spectralCentroid >= 1800) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateMelancholyScore(features) {
    let score = 0;
    
    // Slow to moderate tempo
    if (features.tempo >= 60 && features.tempo <= 100) score += 0.25;
    
    // Mid-range spectral characteristics
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.5) score += 0.2;
    if (features.spectralCentroid >= 1200 && features.spectralCentroid <= 1800) score += 0.15;
    
    // Moderate energy with emotional depth
    if (features.rms >= 0.12 && features.rms <= 0.22) score += 0.15;
    if (features.harmonicity && features.harmonicity >= 0.5) score += 0.15;
    
    // Gentle dynamics
    if (features.spectralFlux >= 0.15 && features.spectralFlux <= 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateRomanticScore(features) {
    let score = 0;
    
    // Moderate, intimate tempo
    if (features.tempo >= 70 && features.tempo <= 110) score += 0.25;
    
    // Warm, mid-range frequencies
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.45) score += 0.2;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2200) score += 0.15;
    
    // Rich harmonic content
    if (features.harmonicity && features.harmonicity >= 0.6) score += 0.2;
    
    // Smooth, controlled dynamics
    if (features.spectralFlux <= 0.25) score += 0.1;
    if (features.rms >= 0.15 && features.rms <= 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateMysteriousScore(features) {
    let score = 0;
    
    // Slow to moderate tempo
    if (features.tempo <= 100) score += 0.2;
    
    // Dark, low-frequency emphasis
    if (features.lowFreqEnergy && features.lowFreqEnergy >= 0.4) score += 0.25;
    if (features.spectralCentroid <= 1200) score += 0.2;
    
    // Irregular or complex rhythms
    if (features.rhythmRegularity && features.rhythmRegularity <= 0.5) score += 0.15;
    
    // Moderate to low energy
    if (features.rms <= 0.2) score += 0.1;
    
    // Complex spectral characteristics
    if (features.spectralFlatness && features.spectralFlatness <= 0.3) score += 0.1;
    
    return Math.min(score, 1);
  }

  getPrimaryEmotion(emotions) {
    return Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
  }

  getEmotionColors(primaryEmotion, emotions) {
    const colorMaps = {
      joy: {
        primary: '#FFD700', // Gold
        secondary: '#FFA500', // Orange
        accent: '#FFFF00', // Yellow
        gradient: ['#FFD700', '#FFA500', '#FF6347']
      },
      sadness: {
        primary: '#4169E1', // Royal Blue
        secondary: '#708090', // Slate Gray
        accent: '#191970', // Midnight Blue
        gradient: ['#4169E1', '#708090', '#2F4F4F']
      },
      anger: {
        primary: '#DC143C', // Crimson
        secondary: '#FF4500', // Orange Red
        accent: '#8B0000', // Dark Red
        gradient: ['#DC143C', '#FF4500', '#B22222']
      },
      calm: {
        primary: '#87CEEB', // Sky Blue
        secondary: '#98FB98', // Pale Green
        accent: '#F0F8FF', // Alice Blue
        gradient: ['#87CEEB', '#98FB98', '#E0FFFF']
      },
      excitement: {
        primary: '#FF1493', // Deep Pink
        secondary: '#FF69B4', // Hot Pink
        accent: '#FFB6C1', // Light Pink
        gradient: ['#FF1493', '#FF69B4', '#FFA500']
      },
      melancholy: {
        primary: '#9370DB', // Medium Purple
        secondary: '#8A2BE2', // Blue Violet
        accent: '#483D8B', // Dark Slate Blue
        gradient: ['#9370DB', '#8A2BE2', '#6A5ACD']
      },
      romantic: {
        primary: '#FF69B4', // Hot Pink
        secondary: '#FFB6C1', // Light Pink
        accent: '#FFC0CB', // Pink
        gradient: ['#FF69B4', '#FFB6C1', '#DDA0DD']
      },
      mysterious: {
        primary: '#2F4F4F', // Dark Slate Gray
        secondary: '#696969', // Dim Gray
        accent: '#000000', // Black
        gradient: ['#2F4F4F', '#696969', '#4B0082']
      }
    };

    const baseColors = colorMaps[primaryEmotion] || colorMaps.calm;
    
    // Blend colors based on secondary emotions
    const sortedEmotions = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return {
      ...baseColors,
      blendedGradient: this.createBlendedGradient(sortedEmotions, colorMaps),
      intensity: Math.max(...Object.values(emotions))
    };
  }

  createBlendedGradient(sortedEmotions, colorMaps) {
    const gradient = [];
    
    sortedEmotions.forEach(([emotion, score], index) => {
      if (score > 0.1 && colorMaps[emotion]) {
        const colors = colorMaps[emotion].gradient;
        const weight = score * (1 - index * 0.3); // Reduce influence of secondary emotions
        gradient.push(...colors.map(color => ({ color, weight })));
      }
    });
    
    return gradient.slice(0, 5); // Limit to 5 colors for performance
  }

  calculateEmotionIntensity(features) {
    // Combine multiple factors to determine overall emotional intensity
    let intensity = 0;
    
    // Energy contribution
    intensity += (features.rms || 0) * 0.3;
    
    // Dynamic contribution
    intensity += (features.spectralFlux || 0) * 0.25;
    
    // Rhythmic contribution
    intensity += (features.beatStrength || 0) * 0.2;
    
    // Harmonic contribution
    intensity += (features.harmonicity || 0) * 0.15;
    
    // Tempo contribution (normalized)
    intensity += Math.min((features.tempo || 120) / 160, 1) * 0.1;
    
    return Math.min(intensity, 1);
  }

  detectMusicSection(features) {
    // Simple heuristic to detect music sections
    const energy = features.rms || 0;
    const dynamics = features.spectralFlux || 0;
    const beat = features.beatStrength || 0;
    
    if (energy < 0.1 && dynamics < 0.15) {
      return 'intro';
    } else if (energy >= 0.25 && dynamics >= 0.3 && beat >= 0.4) {
      return 'chorus';
    } else if (energy >= 0.15 && energy < 0.25) {
      return 'verse';
    } else if (dynamics >= 0.2 && beat < 0.3) {
      return 'bridge';
    } else if (energy < 0.15 && dynamics < 0.2) {
      return 'outro';
    }
    
    return 'verse'; // Default
  }

  calculateEnergyLevel(features) {
    const energy = (features.rms || 0) * 0.4 + 
                  (features.spectralFlux || 0) * 0.3 + 
                  (features.beatStrength || 0) * 0.3;
    
    if (energy >= 0.7) return 'high';
    if (energy >= 0.4) return 'medium';
    return 'low';
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
    scores.Trap = this.calculateTrapScore(features);
    scores.Ballad = this.calculateBalladScore(features);
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
    
    // Modern pop tempo range (expanded)
    if (features.tempo >= 90 && features.tempo <= 140) {
      if (features.tempo >= 100 && features.tempo <= 130) score += 0.25; // Sweet spot
      else score += 0.2;
    }
    
    // Balanced spectral characteristics
    if (features.spectralCentroid >= 1200 && features.spectralCentroid <= 2800) score += 0.2;
    if (features.spectralBandwidth >= 800 && features.spectralBandwidth <= 1600) score += 0.15;
    
    // Moderate energy with good dynamics
    if (features.rms >= 0.12 && features.rms <= 0.35) score += 0.15;
    if (features.beatStrength && features.beatStrength >= 0.35) score += 0.1;
    
    // Good harmonic content (catchy melodies)
    if (features.harmonicity && features.harmonicity >= 0.4) score += 0.1;
    
    // Regular but not overly rigid rhythm
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.5 && features.rhythmRegularity <= 0.85) score += 0.05;
    
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
    
    // Modern hip-hop tempo range (expanded for different sub-genres)
    if (features.tempo >= 70 && features.tempo <= 140) {
      if (features.tempo >= 80 && features.tempo <= 120) score += 0.25; // Classic range
      else score += 0.15; // Extended range for modern styles
    }
    
    // Strong rhythmic elements (key for hip-hop)
    if (features.beatStrength && features.beatStrength >= 0.4) score += 0.2;
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.6) score += 0.15;
    
    // Percussive and dynamic characteristics
    if (features.onsetDensity && features.onsetDensity >= 0.3) score += 0.15;
    if (features.spectralFlux >= 0.25) score += 0.1; // Dynamic changes from samples/beats
    
    // Energy characteristics (modern hip-hop can be high energy)
    if (features.rms >= 0.15) score += 0.1;
    
    // Bass emphasis (important for hip-hop)
    if (features.lowFreqEnergy && features.lowFreqEnergy >= 0.3) score += 0.1;
    
    // Vocal characteristics
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.4) score += 0.05;
    if (features.zeroCrossingRate >= 0.06) score += 0.05; // Vocal elements
    
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
    
    // R&B tempo characteristics (groove-oriented)
    if (features.tempo >= 70 && features.tempo <= 120) {
      if (features.tempo >= 80 && features.tempo <= 100) score += 0.25; // Classic R&B range
      else score += 0.2;
    }
    
    // Smooth, warm spectral characteristics
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2200) score += 0.2;
    if (features.rms >= 0.12 && features.rms <= 0.28) score += 0.15;
    
    // Controlled dynamics with groove
    if (features.spectralFlux >= 0.15 && features.spectralFlux <= 0.35) score += 0.15;
    if (features.beatStrength && features.beatStrength >= 0.4) score += 0.1;
    
    // Rich harmonic content (soulful vocals)
    if (features.harmonicity && features.harmonicity >= 0.5) score += 0.1;
    
    // Smooth rhythm patterns
    if (features.zeroCrossingRate >= 0.04 && features.zeroCrossingRate <= 0.08) score += 0.05;
    
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

  calculateTrapScore(features) {
    let score = 0;
    
    // Trap tempo characteristics (slower than traditional hip-hop)
    if (features.tempo >= 60 && features.tempo <= 90) score += 0.25;
    
    // Heavy bass and sub-bass emphasis
    if (features.lowFreqEnergy && features.lowFreqEnergy >= 0.4) score += 0.2;
    if (features.spectralCentroid <= 1200) score += 0.15;
    
    // High energy with strong dynamics
    if (features.rms >= 0.2) score += 0.15;
    if (features.spectralFlux >= 0.3) score += 0.1;
    
    // Strong, programmed beats
    if (features.beatStrength && features.beatStrength >= 0.5) score += 0.1;
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.7) score += 0.05;
    
    return Math.min(score, 1);
  }

  calculateBalladScore(features) {
    let score = 0;
    
    // Ballad tempo characteristics (slow to moderate)
    if (features.tempo >= 50 && features.tempo <= 90) score += 0.25;
    
    // Smooth, controlled dynamics
    if (features.spectralFlux <= 0.25) score += 0.2;
    if (features.rms >= 0.1 && features.rms <= 0.25) score += 0.15;
    
    // Rich harmonic content (emotional vocals/instruments)
    if (features.harmonicity && features.harmonicity >= 0.5) score += 0.15;
    
    // Vocal-centric frequency distribution
    if (features.midFreqEnergy && features.midFreqEnergy >= 0.5) score += 0.1;
    if (features.spectralCentroid >= 1000 && features.spectralCentroid <= 2500) score += 0.05;
    
    // Gentle rhythm patterns
    if (features.rhythmRegularity && features.rhythmRegularity >= 0.4 && features.rhythmRegularity <= 0.8) score += 0.1;
    
    return Math.min(score, 1);
  }

  calculateMetalScore(features) {
    let score = 0;
    
    // Metal tempo range (fast and aggressive)
    if (features.tempo >= 120 && features.tempo <= 200) score += 0.25;
    
    // Bright, aggressive spectral characteristics
    if (features.spectralCentroid >= 2500) score += 0.2;
    if (features.spectralBandwidth >= 1500) score += 0.15;
    
    // High energy and dynamics
    if (features.rms >= 0.25) score += 0.15;
    if (features.spectralFlux >= 0.4) score += 0.15;
    
    // High zero crossing (distorted guitars)
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
  const { audioData, sampleRate, length, id, analysisType } = e.data;
  
  try {
    const analyzer = new AudioAnalyzer();
    const classifier = new GenreClassifier();
    const emotionAnalyzer = new EmotionAnalyzer();
    
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
    
    let result = {};
    
    if (analysisType === 'emotion' || analysisType === 'both') {
      // Analyze emotions and generate color palette
      const emotionResult = emotionAnalyzer.analyzeEmotion(features);
      result.emotion = emotionResult;
    }
    
    if (analysisType === 'genre' || analysisType === 'both' || !analysisType) {
      // Classify genre with improved scoring
      const genreResult = classifier.classify(features);
      result.genre = genreResult;
    }
    
    // Send result back with detailed analysis
    self.postMessage({
      id,
      success: true,
      result: {
        ...result,
        features: features,
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
