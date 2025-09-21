// Simple sign language translation service
class SignLanguageService {
  constructor() {
    // Basic sign language dictionary
    this.signDictionary = {
      // Emotions
      'love': { gesture: 'cross_arms_heart', duration: 2, description: 'Cross arms over heart' },
      'happy': { gesture: 'smile_hands_up', duration: 1.5, description: 'Smile and raise hands' },
      'sad': { gesture: 'wipe_eyes', duration: 2, description: 'Wipe eyes gesture' },
      
      // Actions
      'sing': { gesture: 'hand_to_mouth', duration: 1.5, description: 'Hand near mouth' },
      'dance': { gesture: 'sway_arms', duration: 2, description: 'Sway with arms moving' },
      'music': { gesture: 'wave_hands', duration: 1.5, description: 'Wave hands rhythmically' },
      
      // Common words
      'you': { gesture: 'point_forward', duration: 0.5, description: 'Point forward' },
      'me': { gesture: 'point_self', duration: 0.5, description: 'Point to self' },
      'heart': { gesture: 'touch_heart', duration: 1, description: 'Touch heart' },
      'beautiful': { gesture: 'circle_face', duration: 2, description: 'Circle face with hand' },
      'together': { gesture: 'hands_together', duration: 1.5, description: 'Bring hands together' },
      'forever': { gesture: 'circle_motion', duration: 2, description: 'Circular motion' }
    };
  }

  // Main translation function
  translateLyrics(lyrics, songDuration = 180) {
    try {
      const words = this.cleanLyrics(lyrics);
      const signSequence = this.createSignSequence(words, songDuration);
      
      return {
        success: true,
        signs: signSequence,
        totalWords: words.length,
        duration: songDuration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean and split lyrics
  cleanLyrics(lyrics) {
    return lyrics
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Create timed sign sequence
  createSignSequence(words, songDuration) {
    const sequence = [];
    const timePerWord = songDuration / words.length;
    
    words.forEach((word, index) => {
      const startTime = index * timePerWord;
      const sign = this.signDictionary[word] || this.getDefaultSign(word);
      const endTime = startTime + sign.duration;
      
      sequence.push({
        word,
        startTime: Math.round(startTime * 10) / 10,
        endTime: Math.round(endTime * 10) / 10,
        gesture: sign.gesture,
        description: sign.description,
        // Simple animation data
        animation: this.getAnimationData(sign.gesture)
      });
    });
    
    return sequence;
  }

  // Default sign for unknown words
  getDefaultSign(word) {
    return {
      gesture: 'fingerspell',
      duration: word.length * 0.3,
      description: `Spell "${word}" with fingers`
    };
  }

  // Get animation data for gestures
  getAnimationData(gesture) {
    const animations = {
      'cross_arms_heart': { leftArm: [0.5, 0, 0.5], rightArm: [0.5, 0, -0.5], body: [0, 0, 0] },
      'smile_hands_up': { leftArm: [1, 0, 0.3], rightArm: [1, 0, -0.3], body: [0, 0, 0] },
      'point_forward': { leftArm: [0, 0, 0], rightArm: [0, 0, 1.5], body: [0, 0, 0] },
      'point_self': { leftArm: [0, 0, 0], rightArm: [0, 3.14, -0.5], body: [0, 0, 0] },
      'wave_hands': { leftArm: [0.3, 0, 0.5], rightArm: [0.3, 0, -0.5], body: [0, 0, 0] },
      'default': { leftArm: [0, 0, 0], rightArm: [0, 0, 0], body: [0, 0, 0] }
    };
    
    return animations[gesture] || animations.default;
  }
}

export default new SignLanguageService();