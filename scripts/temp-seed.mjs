
        import { initializeDatabase, seedDatabase } from '../src/lib/database.js';
        import { bibleImporter } from '../src/lib/bible-importer.js';
        
        async function runSeed() {
          try {
            console.log('Initializing database...');
            initializeDatabase();
            
            console.log('Seeding basic data...');
            await seedDatabase();
            
            console.log('Creating basic topics...');
            await bibleImporter.createBasicTopics();
            
            console.log('Importing KJV Bible translation...');
            await bibleImporter.importSingleTranslation('KJV');
            
            console.log('✅ Database setup completed successfully!');
          } catch (error) {
            console.error('❌ Seeding failed:', error);
            process.exit(1);
          }
        }
        
        runSeed();
      