1. Right now I have a ui right after the smart search that shows Genesis and sometimes it shows slected slide. That ui is not needed. I need to remove it and all of the codes related to it.

4. Add search online tab for scriptures where I can search for a scripture using vage references or paraphrases.


lets improve the app media handling better. I need to update the current feature where the user directly uploads media on the live presentation slide formating toolbar or settings to update the background to that toolbar and setting making use of the media uploaded from the media page. also the media uploaded from the media page do not currently get displayed on the live screen clicking on the icon it just breaks with the message:
✅ LiveDisplayManager: Live display created successfully and synced to Redux
MediaPage.tsx:127 Sent to live display: image_1761458771896
LiveDisplayManager.tsx:207 📤 LiveDisplayManager: Sending media to live display: image_1761458771896
MediaPage.tsx:127 Sent to live display: image_1761458771896
LiveDisplayManager.tsx:207 📤 LiveDisplayManager: Sending media to live display: image_1761458771896
MediaPage.tsx:127 Sent to live display: image_1761458771896


Remember to add the size limitations to the readme.

All future slides use video background
Video persists across page refreshes and verse changes ✓
📏 File Size Limits:
Images: 2MB (unchanged)
Videos: 50MB (new)
Base64 encoding adds ~33% overhead
Consider external URLs for larger videos
🌐 Browser Compatibility:
MP4: All modern browsers ✓ (recommended)
WebM: Chrome, Firefox, Edge
OGG: Firefox only
MOV: Limited support
📝 Documentation:
Updated ACTIVITIES.md with complete implementation details, technical notes, and persistence architecture. The implementation is complete and ready for testing! Videos will work in preview, live display, and presentation modes, just like images.