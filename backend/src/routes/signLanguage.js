import express from 'express';
import signLanguageService from '../services/signLanguageService.js';

const router = express.Router();

// Translate lyrics to sign language
router.post('/translate', async (req, res) => {
  try {
    const { lyrics, duration } = req.body;
    
    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }
    
    const result = signLanguageService.translateLyrics(lyrics, duration);
    res.json(result);
    
  } catch (error) {
    console.error('Sign language error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;