const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlansFeature() {
  try {
    console.log('🔄 Testing Plans Feature...');

    // 1. Create or get default service
    let service = await prisma.service.findFirst({
      where: { name: 'Default Service' }
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          name: 'Default Service',
          date: new Date(),
          type: 'Sunday Morning',
          description: 'Default service for testing plans',
        }
      });
      console.log('✅ Created default service:', service.id);
    } else {
      console.log('✅ Found existing service:', service.id);
    }

    // 2. Create a sample plan
    const plan = await prisma.servicePlan.create({
      data: {
        name: 'Sunday Morning Worship',
        serviceId: service.id,
        description: 'Complete Sunday morning service plan',
        order: 0
      }
    });
    console.log('✅ Created sample plan:', plan.id);

    // 3. Add sample plan items
    const planItems = [
      {
        type: 'announcement',
        title: 'Welcome & Opening Prayer',
        order: 0,
        duration: 5,
        notes: 'Warm welcome to visitors'
      },
      {
        type: 'song',
        title: 'Amazing Grace',
        order: 1,
        duration: 4,
        notes: 'Congregation favorite'
      },
      {
        type: 'scripture',
        title: 'John 3:16',
        order: 2,
        duration: 3,
        scriptureRef: 'John 3:16',
        notes: 'Key verse for the message'
      },
      {
        type: 'announcement',
        title: 'Offering',
        order: 3,
        duration: 7,
        notes: 'Include giving testimony'
      },
      {
        type: 'presentation',
        title: 'Sermon: Love of God',
        order: 4,
        duration: 25,
        notes: 'Main message with slides'
      },
      {
        type: 'announcement',
        title: 'Closing Prayer & Benediction',
        order: 5,
        duration: 3,
        notes: 'Dismiss with blessing'
      }
    ];

    for (const item of planItems) {
      await prisma.servicePlanItem.create({
        data: {
          ...item,
          planId: plan.id
        }
      });
    }
    console.log(`✅ Added ${planItems.length} plan items`);

    // 4. Test retrieving the plan with items
    const fullPlan = await prisma.servicePlan.findUnique({
      where: { id: plan.id },
      include: {
        service: true,
        planItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log('✅ Retrieved full plan:');
    console.log(`   - Name: ${fullPlan.name}`);
    console.log(`   - Service: ${fullPlan.service.name}`);
    console.log(`   - Items: ${fullPlan.planItems.length}`);
    console.log(`   - Total Duration: ${fullPlan.planItems.reduce((sum, item) => sum + (item.duration || 0), 0)} minutes`);

    // 5. List all plan items
    console.log('\n📋 Plan Items:');
    fullPlan.planItems.forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.type}] ${item.title} (${item.duration}m)`);
      if (item.notes) console.log(`      Notes: ${item.notes}`);
    });

    console.log('\n🎉 Plans feature test completed successfully!');
    console.log('You can now:');
    console.log('1. Open the application');
    console.log('2. Go to Live Presentation page');
    console.log('3. Click on the "Service Plans" tab');
    console.log('4. You should see the "Sunday Morning Worship" plan');
    console.log('5. Click on it to load the plan items');
    console.log('6. Use the presentation controls to present the plan items live');

  } catch (error) {
    console.error('❌ Error testing plans feature:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPlansFeature()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });