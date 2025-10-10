# Song-to-Plan Debug Guide & Solutions

## 🚨 Issue Summary
You encountered errors when trying to add songs to plans in the Live Presentation window. I've created comprehensive debugging tools and fixes to identify and resolve the issue.

## 🛠️ Debugging Tools Created

### 1. **Browser Console Debug Script** (`debug-song-to-plan.js`)
**Usage**: Open browser DevTools (F12) and paste this script into the console.

**Features**:
- Tests song database access
- Validates service/plan access
- Checks IPC handler availability
- Tests plan item creation
- Quick end-to-end test function

**Available Functions**:
```javascript
// Run full diagnostic
debugSongToPlan()

// Test specific plan item creation
testCreatePlanItem(planId, songId)

// Quick end-to-end test
quickFixTest()
```

### 2. **Enhanced Error Handling** (Updated `planService.ts`)
**Improvements**:
- Detailed console logging for all operations
- Specific error messages for different failure types
- Validation of required fields before API calls
- Better error reporting with context

**Now Logs**:
- ✅ Successful operations with details
- ❌ Failed operations with specific reasons
- 🔍 Validation steps and results
- 📋 Data being processed

### 3. **Plan Helper Utilities** (`src/utils/planHelpers.ts`)
**Purpose**: Programmatic functions to add songs to plans with proper error handling.

**Available Functions**:
```typescript
// Add song to plan with validation
addSongToPlan({
  planId: 'plan-id',
  songId: 'song-id',
  title: 'Optional custom title',
  order: 0, // Optional
  duration: 240, // Optional (4 minutes)
  notes: 'Optional notes'
})

// List available songs
getAvailableSongs(limit)

// List available plans
getAvailablePlans()

// Test the functionality
testSongToPlanFunctionality()
```

### 4. **UI Component for Testing** (`src/components/plans/AddSongToPlan.tsx`)
**Purpose**: Ready-to-use React component for adding songs to plans.

**Features**:
- Dropdown list of available songs
- Automatic validation and error handling
- Loading states and success feedback
- Easy integration into existing plan management

## 🔍 How to Debug the Issue

### Step 1: **Run Basic Diagnostic**
1. Open your application
2. Navigate to Live Presentation page
3. Open DevTools (F12)
4. Paste the contents of `debug-song-to-plan.js` into console
5. The script will auto-run and show you what's working/broken

### Step 2: **Check Common Issues**
The diagnostic will check for:

**✅ Database Access**
- Can access songs database
- Can access services/plans database
- IPC handlers are working

**✅ Data Integrity**
- Songs exist in database
- Plans exist and are properly created
- Service ID is valid

**✅ Validation Pipeline**
- Song validation works
- Plan validation works
- Content references are valid

### Step 3: **Use Quick Fix Test**
If basic diagnostic passes, run:
```javascript
quickFixTest()
```
This will attempt to add a real song to a real plan and show exactly where it fails.

## 🎯 Most Likely Issues & Solutions

### Issue 1: **No Songs in Database**
**Symptom**: "No songs available for testing"
**Solution**: Add songs to your database first through the Songs page

### Issue 2: **Invalid Service/Plan ID**
**Symptom**: "Plan with ID ... not found"
**Solution**: Ensure you have created a plan in the Plans tab first

### Issue 3: **IPC Handler Missing**
**Symptom**: "Handler 'db:getSong' not found"
**Solution**: Restart the application - the handlers should be registered

### Issue 4: **Database Schema Mismatch**
**Symptom**: Database errors about missing fields
**Solution**: Run `npm run db:push` to update the database schema

### Issue 5: **Permission/Context Issues**
**Symptom**: "Electron API not available"
**Solution**: Ensure you're running in the Electron context, not a web browser

## 🧪 Testing Workflow

### Option A: **Use the UI Component**
1. Add the `AddSongToPlan` component to your plan management interface
2. Select a plan
3. Choose a song from the dropdown
4. Click "Add Song to Plan"
5. Check console for detailed logs

### Option B: **Use Console Functions**
1. Open DevTools
2. Load the helper utilities
3. Run commands manually:
```javascript
// Get available data
const songs = await getAvailableSongs(10)
const plans = await getAvailablePlans()

// Add song to plan
const result = await addSongToPlan({
  planId: plans[0].id,
  songId: songs[0].id
})

console.log(result)
```

### Option C: **Use the Debug Script**
1. Load `debug-song-to-plan.js` in console
2. Run `quickFixTest()`
3. Follow the detailed console output

## 📋 Next Steps

1. **Run the diagnostic script** to identify the exact issue
2. **Check the console logs** for specific error messages
3. **Use the provided tools** to test individual components
4. **Report back** with the specific error messages from the console

## 🔧 Quick Fixes Applied

- ✅ Enhanced error handling with detailed logging
- ✅ Input validation for all required fields
- ✅ Proper song/plan existence validation
- ✅ Fallback error messages for common issues
- ✅ Console logging for debugging
- ✅ Ready-to-use UI component for testing

The tools I've created will help you identify exactly where the song-to-plan process is failing and provide specific solutions for each type of error.