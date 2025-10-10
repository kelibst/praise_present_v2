// Plan Helper Utilities for debugging and testing song-to-plan functionality

export interface AddSongToPlanParams {
  planId: string;
  songId: string;
  title?: string;
  order?: number;
  duration?: number;
  notes?: string;
}

export interface AddSongToPlanResult {
  success: boolean;
  planItem?: any;
  error?: string;
}

/**
 * Helper function to add a song to a plan with proper error handling
 */
export async function addSongToPlan(params: AddSongToPlanParams): Promise<AddSongToPlanResult> {
  const { planId, songId, title, order, duration, notes } = params;

  if (!window.electronAPI?.invoke) {
    return {
      success: false,
      error: 'Electron API not available'
    };
  }

  try {
    console.log('🎵 Adding song to plan...', params);

    // First, verify the song exists
    const song = await window.electronAPI.invoke('db:getSong', songId);
    if (!song) {
      return {
        success: false,
        error: `Song with ID ${songId} not found`
      };
    }

    // Verify the plan exists
    const plan = await window.electronAPI.invoke('db:getPlan', planId);
    if (!plan) {
      return {
        success: false,
        error: `Plan with ID ${planId} not found`
      };
    }

    // Get next order number if not provided
    let itemOrder = order;
    if (itemOrder === undefined) {
      const existingItems = plan.planItems || [];
      itemOrder = existingItems.length;
    }

    // Create plan item data
    const planItemData = {
      planId,
      type: 'song' as const,
      title: title || song.title,
      order: itemOrder,
      duration: duration || 240, // Default 4 minutes
      songId,
      notes: notes || `Added song: ${song.title}`
    };

    console.log('📋 Creating plan item:', planItemData);

    // Create the plan item
    const planItem = await window.electronAPI.invoke('db:createPlanItem', planItemData);

    console.log('✅ Song added to plan successfully:', planItem);

    return {
      success: true,
      planItem
    };

  } catch (error) {
    console.error('❌ Failed to add song to plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Helper function to list available songs for plan addition
 */
export async function getAvailableSongs(limit: number = 20): Promise<any[]> {
  if (!window.electronAPI?.invoke) {
    console.error('Electron API not available');
    return [];
  }

  try {
    const songs = await window.electronAPI.invoke('db:loadSongs', { limit });
    return songs || [];
  } catch (error) {
    console.error('Failed to get songs:', error);
    return [];
  }
}

/**
 * Helper function to list available plans
 */
export async function getAvailablePlans(): Promise<any[]> {
  if (!window.electronAPI?.invoke) {
    console.error('Electron API not available');
    return [];
  }

  try {
    const plans = await window.electronAPI.invoke('db:loadPlans', {});
    return plans || [];
  } catch (error) {
    console.error('Failed to get plans:', error);
    return [];
  }
}

/**
 * Quick test function to verify song-to-plan functionality
 */
export async function testSongToPlanFunctionality(): Promise<void> {
  console.log('🧪 Testing song-to-plan functionality...');

  try {
    // Get available songs and plans
    const songs = await getAvailableSongs(5);
    const plans = await getAvailablePlans();

    if (songs.length === 0) {
      console.log('❌ No songs available for testing');
      return;
    }

    if (plans.length === 0) {
      console.log('❌ No plans available for testing');
      return;
    }

    console.log(`Found ${songs.length} songs and ${plans.length} plans`);

    // Test adding first song to first plan
    const testSong = songs[0];
    const testPlan = plans[0];

    console.log(`Testing: Adding "${testSong.title}" to plan "${testPlan.name}"`);

    const result = await addSongToPlan({
      planId: testPlan.id,
      songId: testSong.id,
      title: `Test: ${testSong.title}`,
      notes: 'Added via test function'
    });

    if (result.success) {
      console.log('🎉 Test successful! Song added to plan.');
      console.log('Plan item created:', result.planItem);
    } else {
      console.log('❌ Test failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test function failed:', error);
  }
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).addSongToPlan = addSongToPlan;
  (window as any).getAvailableSongs = getAvailableSongs;
  (window as any).getAvailablePlans = getAvailablePlans;
  (window as any).testSongToPlanFunctionality = testSongToPlanFunctionality;
}