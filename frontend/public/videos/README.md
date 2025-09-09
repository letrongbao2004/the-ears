# Music Video Feature

## How to Use Music Videos

1. **Add Video Files**: Place your video files in the `/public/videos/` directory
2. **Supported Formats**: MP4, WebM, OGG
3. **Video Sync**: Videos will automatically sync with the audio playback

## Adding Videos to Songs

To add a video to a song, you need to:

1. **Upload Video File**: Place the video file in `/public/videos/`
2. **Update Song Database**: Add the `videoUrl` field to the song in your database
3. **Example**: If you have a video file `song1.mp4` in `/public/videos/`, set `videoUrl: "/videos/song1.mp4"`

## Video Controls

- **Video Toggle Button**: Click the video icon in the player controls to show/hide video
- **Full Screen**: Videos play in full screen overlay
- **Auto Sync**: Video automatically syncs with audio timing
- **Muted**: Videos play muted (audio comes from the main audio player)

## Example Video URLs

```
/videos/song1.mp4
/videos/song2.webm
/videos/song3.ogg
```

## Technical Notes

- Videos are synchronized with audio using `timeupdate` events
- Video element is muted to avoid audio conflicts
- Videos automatically pause/play with audio
- Video overlay has z-index 50 to appear above all content
