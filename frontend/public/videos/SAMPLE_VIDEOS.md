# Sample Video Files

This directory contains music video files that sync with audio playback.

## Adding Videos to Songs

To add a video to a song in your database:

1. Place video file in this directory (e.g., `song1.mp4`)
2. Update the song record in your database with `videoUrl: "/videos/song1.mp4"`
3. The video will automatically appear in the player when the song is played

## Example Database Update

```javascript
// Update song with video URL
db.songs.updateOne(
  { _id: "song_id" },
  { $set: { videoUrl: "/videos/song1.mp4" } }
);
```

## Video Requirements

- **Format**: MP4, WebM, or OGG
- **Sync**: Video duration should match audio duration
- **Quality**: Recommended 720p or higher
- **Size**: Keep file sizes reasonable for web streaming

