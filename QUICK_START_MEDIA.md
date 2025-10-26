# Quick Start: Media System

## 🚀 Getting Started

### Step 1: Restart the Application

**IMPORTANT:** Close all running instances of PraisePresent and restart fresh:

```bash
npm start
```

The database schema has been updated and new handlers have been registered.

---

## ✨ New Features You Can Use Right Now

### 1. Automatic Duplicate Detection

**What it does:** Prevents uploading the same file twice

**How to test:**
1. Open the app
2. Go to **Media Library** page
3. Upload any image (e.g., a photo from your computer)
4. Try uploading the **exact same file** again
5. 🎯 **Result:** Yellow warning banner appears: "Duplicate File Detected"

---

### 2. Reference Tracking

**What it does:** Shows which media is in use and prevents deletion

**How to test:**
1. Upload a few images to Media Library
2. Look at the media thumbnails
3. 🎯 **New:** Blue badge with number appears on items being used
4. Try to delete a media item with a badge
5. 🎯 **Result:** Error message prevents deletion and shows where it's used

---

### 3. MediaPicker Component

**What it does:** Easy way to select media from library in any form

**Example usage in your code:**

```typescript
import MediaPicker from './components/media/MediaPicker';
import { useState } from 'react';

function MyComponent() {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div>
      <MediaPicker
        type="image"
        selectedMedia={selectedImage}
        onMediaSelect={setSelectedImage}
        onMediaClear={() => setSelectedImage(null)}
        label="Choose Background Image"
      />

      {selectedImage && (
        <p>Selected: {selectedImage.originalName}</p>
      )}
    </div>
  );
}
```

**Features:**
- Shows selected image thumbnail
- "Upload New" button for quick upload
- "Browse Library" button opens full dialog
- Search and filter in dialog
- Click any image to select it

---

### 4. Background Preset System

**What it does:** Create reusable background presets

**Test in browser console:**

```javascript
// Create a background preset
const bg = await window.electronAPI.invoke('background:create', {
  name: 'Sunday Morning',
  type: 'color',
  settings: JSON.stringify({ color: '#1e3a5f' }),
  category: 'worship',
  isDefault: true
});

console.log('Created background:', bg);

// List all backgrounds
const list = await window.electronAPI.invoke('background:list');
console.log('All backgrounds:', list.data);

// Get default background
const defaultBg = await window.electronAPI.invoke('background:getDefault', 'color');
console.log('Default color background:', defaultBg);
```

---

## 🎯 Quick Test Checklist

- [ ] Restart app with `npm start`
- [ ] Upload an image to Media Library
- [ ] Try uploading same image again → See duplicate warning
- [ ] Check for blue reference badges on thumbnails
- [ ] Try to delete in-use media → See protection message
- [ ] Open browser DevTools console
- [ ] Test background creation (see code above)
- [ ] Verify no errors in console

---

## 📖 Full Documentation

For complete details, see:
- **MEDIA_SYSTEM_SUMMARY.md** - Complete feature overview
- **ACTIVITIES.md** - Technical implementation details

---

## ❓ Troubleshooting

### Database Schema Error

If you see errors about missing columns:

```bash
# Push schema changes
npx prisma db push --skip-generate
```

### Prisma Client Lock

If you see "EPERM: operation not permitted" errors:

1. **Close the app completely**
2. Wait 5 seconds
3. Run: `npx prisma generate`
4. Restart app: `npm start`

### Reference Count Not Showing

1. Refresh the Media Library page
2. Make sure you're fetching with `includeReferences: true`
3. Check console for errors

---

## 🎉 What's New - Summary

### For Users
- ✅ No more duplicate files clogging storage
- ✅ See which media is being used before deleting
- ✅ Cannot accidentally delete in-use media
- ✅ Easy media selection with MediaPicker
- ✅ Create reusable background presets

### For Developers
- ✅ Complete API with 16 IPC handlers
- ✅ Reusable MediaPicker components
- ✅ Service layer architecture (MediaService, BackgroundService)
- ✅ Full TypeScript support
- ✅ Reference tracking infrastructure
- ✅ Delete protection built-in

---

**Ready to go!** Start the app and test the features. 🚀
