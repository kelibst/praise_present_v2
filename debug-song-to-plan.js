// Debug script for song-to-plan functionality
// Run this in the browser console to diagnose issues

console.log('🔍 Debugging Song-to-Plan Functionality...');

async function debugSongToPlan() {
  if (!window.electronAPI) {
    console.error('❌ ElectronAPI not available');
    return false;
  }

  try {
    // Test 1: Check if we can get songs
    console.log('\n📋 Test 1: Checking song database access...');
    const songs = await window.electronAPI.invoke('db:loadSongs', { limit: 5 });
    if (songs && songs.length > 0) {
      console.log('✅ Songs found:', songs.length);
      console.log('Sample song:', songs[0]);
    } else {
      console.log('⚠️ No songs found in database');
      return false;
    }

    // Test 2: Check if we can get services/plans
    console.log('\n📋 Test 2: Checking service/plan access...');
    const services = await window.electronAPI.invoke('db:getServices', 10);
    if (services && services.length > 0) {
      console.log('✅ Services found:', services.length);

      // Check for plans in services
      const plansExist = services.some(s => s.servicePlans && s.servicePlans.length > 0);
      if (plansExist) {
        console.log('✅ Plans found in services');
      } else {
        console.log('⚠️ No plans found in services');
      }
    } else {
      console.log('⚠️ No services found');
    }

    // Test 3: Check plan creation functionality
    console.log('\n📋 Test 3: Testing plan creation...');
    const serviceId = localStorage.getItem('currentServiceId');
    if (serviceId) {
      console.log('✅ Current service ID found:', serviceId);

      try {
        // Test creating a simple plan item
        const testPlanItem = {
          planId: 'test-plan-id', // This would fail, but we can see the error
          type: 'song',
          title: 'Test Song',
          order: 0,
          songId: songs[0]?.id,
          duration: 240
        };

        console.log('Testing plan item structure:', testPlanItem);
        // Note: This will likely fail due to invalid planId, but we can see validation errors

      } catch (error) {
        console.log('Expected error with test plan item:', error.message);
      }
    } else {
      console.log('❌ No current service ID found');
    }

    // Test 4: Check IPC handlers availability
    console.log('\n📋 Test 4: Checking IPC handlers...');
    const ipcTests = [
      'db:loadSongs',
      'db:getSong',
      'db:getServices',
      'db:createPlanItem',
      'db:createPlanItems',
      'db:getPlan',
      'db:loadPlans'
    ];

    for (const handler of ipcTests) {
      try {
        // Try to call with empty/invalid data to test handler existence
        if (handler === 'db:loadSongs') {
          await window.electronAPI.invoke(handler, { limit: 1 });
          console.log(`✅ ${handler} - Available`);
        } else if (handler === 'db:getSong') {
          // This should fail but confirm handler exists
          try {
            await window.electronAPI.invoke(handler, 'invalid-id');
          } catch (e) {
            console.log(`✅ ${handler} - Available (returns validation error as expected)`);
          }
        } else if (handler === 'db:getServices') {
          await window.electronAPI.invoke(handler, 5);
          console.log(`✅ ${handler} - Available`);
        } else {
          console.log(`⚠️ ${handler} - Skipped detailed test`);
        }
      } catch (error) {
        console.log(`❌ ${handler} - Error:`, error.message);
      }
    }

    // Test 5: Check plan service functionality
    console.log('\n📋 Test 5: Checking plan service...');
    if (typeof planService !== 'undefined') {
      console.log('✅ Plan service available');
    } else {
      console.log('⚠️ Plan service not in global scope');
    }

    return true;

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return false;
  }
}

// Test plan item creation with proper error handling
async function testCreatePlanItem(planId, songId) {
  if (!window.electronAPI) {
    console.error('❌ ElectronAPI not available');
    return;
  }

  const testItem = {
    planId: planId,
    type: 'song',
    title: 'Test Song Item',
    order: 0,
    duration: 240, // 4 minutes
    songId: songId,
    notes: 'Test song added via debug script'
  };

  console.log('🧪 Testing plan item creation:', testItem);

  try {
    const result = await window.electronAPI.invoke('db:createPlanItem', testItem);
    console.log('✅ Plan item created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Plan item creation failed:', error);
    console.log('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    return null;
  }
}

// Quick fix test function
async function quickFixTest() {
  console.log('\n🔧 Running Quick Fix Test...');

  // Get current plan and song
  const plans = await window.electronAPI.invoke('db:loadPlans', {});
  const songs = await window.electronAPI.invoke('db:loadSongs', { limit: 1 });

  if (!plans || plans.length === 0) {
    console.log('❌ No plans available for testing');
    return;
  }

  if (!songs || songs.length === 0) {
    console.log('❌ No songs available for testing');
    return;
  }

  const testPlan = plans[0];
  const testSong = songs[0];

  console.log('Using plan:', testPlan.name);
  console.log('Using song:', testSong.title);

  const result = await testCreatePlanItem(testPlan.id, testSong.id);
  if (result) {
    console.log('🎉 Quick fix test passed!');
  } else {
    console.log('❌ Quick fix test failed - see error details above');
  }
}

// Export functions for manual testing
window.debugSongToPlan = debugSongToPlan;
window.testCreatePlanItem = testCreatePlanItem;
window.quickFixTest = quickFixTest;

// Auto-run basic debug
debugSongToPlan().then(success => {
  if (success) {
    console.log('\n🎯 Basic debug completed. Run quickFixTest() to test actual plan item creation.');
  } else {
    console.log('\n❌ Basic debug failed. Check the errors above.');
  }
});

console.log('\n💡 Available debug functions:');
console.log('  - debugSongToPlan() - Run full diagnostic');
console.log('  - testCreatePlanItem(planId, songId) - Test specific plan item creation');
console.log('  - quickFixTest() - Quick end-to-end test');