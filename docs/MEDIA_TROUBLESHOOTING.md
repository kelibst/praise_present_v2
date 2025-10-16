# Media Troubleshooting Guide

This guide helps troubleshoot common issues with media (images and videos) in PraisePresent.

## Video Won't Play / Loads Forever

### Common Causes

1. **Base64 Encoding Size Limit**
   - Videos stored as base64 (< 2MB threshold) become ~33% larger
   - A 3.2MB video becomes ~4.3MB as base64
   - Large base64 videos can cause browser memory issues
   - **Solution**: Use filesystem storage for videos > 2MB

2. **Video Codec Compatibility**
   - Not all video codecs work in all browsers
   - **Recommended**: MP4 with H.264 codec
   - **Avoid**: Some MOV/QuickTime formats, exotic codecs
   - **Solution**: Re-encode video to MP4 H.264

3. **File Path Issues**
   - Electron file paths need proper protocol handling
   - Base64 data URLs work but have size limits
   - **Check**: Console logs for video errors

### Debugging Steps

1. **Check Console Logs**
   ```
   Look for:
   🎥 Video loading started: [filename]
   ✅ Video can play: [filename]
   ❌ Video error: [error details]
   ⏳ Video buffering: [filename]
   ⚠️ Video stalled: [filename]
   ```

2. **Check Video Properties**
   - Open browser DevTools (F12)
   - Look for error messages
   - Check `networkState` and `readyState` values
   - Error codes:
     - `MEDIA_ERR_ABORTED (1)`: User aborted
     - `MEDIA_ERR_NETWORK (2)`: Network error
     - `MEDIA_ERR_DECODE (3)`: Decoding error (codec issue)
     - `MEDIA_ERR_SRC_NOT_SUPPORTED (4)`: Format not supported

3. **Check File Size**
   - Videos > 2MB should be stored in filesystem, not base64
   - Current implementation stores all as base64 (temporary)
   - **Future**: Implement proper filesystem storage

### Solutions

#### Solution 1: Re-encode Video (Recommended)
```bash
# Using ffmpeg, convert to H.264 MP4
ffmpeg -i input.mov -c:v libx264 -c:a aac -movflags +faststart output.mp4

# Or reduce file size
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4
```

#### Solution 2: Use Smaller Videos
- Keep videos under 10MB for base64 storage
- Use lower resolution (720p instead of 1080p)
- Reduce bitrate during export

#### Solution 3: Test Video Format
```javascript
// Test if video format is supported
const video = document.createElement('video');
const canPlayMP4 = video.canPlayType('video/mp4; codecs="avc1.42E01E"');
const canPlayWebM = video.canPlayType('video/webm; codecs="vp8, vorbis"');

console.log('MP4 support:', canPlayMP4); // "probably" or "maybe"
console.log('WebM support:', canPlayWebM);
```

## Image Won't Display

### Common Causes

1. **File Path Issues**
   - Invalid base64 encoding
   - Missing file protocol
   - Incorrect path format

2. **Image Format**
   - Unsupported format (HEIC, some TIFF variants)
   - Corrupted file
   - **Supported**: JPG, PNG, WebP, GIF, SVG

3. **File Size**
   - Images > 2MB should use filesystem storage
   - Very large images (> 10MB) may cause memory issues

### Solutions

1. **Check Console for Errors**
   - Look for "Failed to load image" messages
   - Check path preview in logs

2. **Convert to Supported Format**
   ```bash
   # Convert HEIC to JPG
   convert image.heic image.jpg

   # Or use online converters
   ```

3. **Optimize Image Size**
   ```bash
   # Resize large images
   convert input.jpg -resize 1920x1080 output.jpg

   # Reduce quality
   convert input.jpg -quality 85 output.jpg
   ```

## Storage Strategy

### Current Implementation
- All media stored as base64 data URLs
- Embedded directly in database
- No external file dependencies

### Recommended (Future)
```
Small files (< 2MB):  Store as base64 in database
Large files (≥ 2MB):  Store in filesystem
  - Images: {userData}/media/images/
  - Videos: {userData}/media/videos/
```

## Browser Support

### Video Formats
| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| MP4    | ✅     | ✅      | ✅     | ✅   |
| WebM   | ✅     | ✅      | ❌     | ✅   |
| OGG    | ❌     | ✅      | ❌     | ❌   |

### Image Formats
| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| JPG    | ✅     | ✅      | ✅     | ✅   |
| PNG    | ✅     | ✅      | ✅     | ✅   |
| WebP   | ✅     | ✅      | ✅     | ✅   |
| GIF    | ✅     | ✅      | ✅     | ✅   |
| SVG    | ✅     | ✅      | ✅     | ✅   |

## Getting Help

1. **Check ACTIVITIES.md** for recent changes
2. **Review console logs** for specific error messages
3. **Test with different files** to isolate the issue
4. **Try different formats** (MP4 for video, JPG for images)
5. **Check file sizes** - keep under limits

## Performance Tips

1. **Optimize Before Upload**
   - Compress videos before uploading
   - Resize images to presentation resolution
   - Use appropriate quality settings

2. **Use Recommended Formats**
   - Videos: MP4 with H.264
   - Images: JPG or PNG

3. **Keep File Sizes Reasonable**
   - Videos: < 50MB
   - Images: < 5MB
   - Smaller files = faster loading = better performance

4. **Clear Cache**
   - Sometimes browser cache causes issues
   - Restart the app if media doesn't update
