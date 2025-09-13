import { ipcMain } from "electron";
import { getDatabase, initializeDatabase, seedDatabase } from "../lib/database";
import { bibleImporter } from "../lib/bible-importer";
import { sqliteBibleImporter } from "../lib/sqlite-bible-importer";

// Initialize database in main process
let db: any = null;

// Utility function to parse song structure from lyrics
function parseSongStructure(lyrics: string): { slides: any[], order: string[] } {
  if (!lyrics) {
    return { slides: [], order: [] };
  }
  
  const lines = lyrics.split('\n');
  const slides: any[] = [];
  const order: string[] = [];
  let currentSlide: any = null;
  let slideCounter = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a section header (e.g., "Verse 1:", "Chorus:", etc.)
    const sectionMatch = line.match(/^(Verse|Chorus|Bridge|Intro|Outro|Tag)(\s+(\d+))?:?\s*$/i);
    
    if (sectionMatch) {
      // Save previous slide if exists
      if (currentSlide) {
        slides.push(currentSlide);
        order.push(currentSlide.id);
      }
      
      // Create new slide
      const type = sectionMatch[1].toLowerCase();
      const number = sectionMatch[3] ? parseInt(sectionMatch[3]) : undefined;
      const slideId = `${type}${number || ''}`;
      const title = number ? `${sectionMatch[1]} ${number}` : sectionMatch[1];
      
      currentSlide = {
        id: slideId,
        type: type,
        number: number,
        title: title,
        content: '',
        chords: undefined,
      };
    } else if (line.length > 0 && currentSlide) {
      // Add content to current slide
      currentSlide.content += (currentSlide.content ? '\n' : '') + line;
    } else if (line.length > 0 && !currentSlide) {
      // No section header found, create a generic slide
      currentSlide = {
        id: `slide${slideCounter}`,
        type: 'verse',
        number: slideCounter,
        title: `Slide ${slideCounter}`,
        content: line,
        chords: undefined,
      };
      slideCounter++;
    }
  }
  
  // Save last slide if exists
  if (currentSlide) {
    slides.push(currentSlide);
    order.push(currentSlide.id);
  }
  
  return { slides, order };
}

export async function initializeDatabaseMain() {
  try {
    db = initializeDatabase();
    console.log("Database initialized in main process");

    // Set up IPC handlers for database operations
    setupDatabaseIPC();

    return db;
  } catch (error) {
    console.error("Failed to initialize database in main process:", error);
    throw error;
  }
}

function setupDatabaseIPC() {
  // Translation operations
  ipcMain.handle("db:loadTranslations", async () => {
    try {
      const translations = await db.translation.findMany({
        orderBy: { name: "asc" },
      });
      // Serialize dates to avoid non-serializable values in Redux
      return translations.map((translation: any) => ({
        ...translation,
        createdAt: translation.createdAt?.toISOString(),
        updatedAt: translation.updatedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error loading translations:", error);
      throw error;
    }
  });

  // Version operations
  ipcMain.handle("db:loadVersions", async (event, translationId?: string) => {
    try {
      const whereClause = translationId ? { translationId } : {};
      const versions = await db.version.findMany({
        where: whereClause,
        include: {
          translation: true,
        },
        orderBy: { name: "asc" },
      });
      // Serialize dates to avoid non-serializable values in Redux
      return versions.map((version: any) => ({
        ...version,
        createdAt: version.createdAt?.toISOString(),
        updatedAt: version.updatedAt?.toISOString(),
        translation: version.translation
          ? {
              ...version.translation,
              createdAt: version.translation.createdAt?.toISOString(),
              updatedAt: version.translation.updatedAt?.toISOString(),
            }
          : null,
      }));
    } catch (error) {
      console.error("Error loading versions:", error);
      throw error;
    }
  });

  // Book operations
  ipcMain.handle("db:loadBooks", async () => {
    try {
      const books = await db.book.findMany({
        orderBy: { order: "asc" },
      });
      return books;
    } catch (error) {
      console.error("Error loading books:", error);
      throw error;
    }
  });

  // Verse operations
  ipcMain.handle(
    "db:loadVerses",
    async (
      event,
      {
        versionId,
        bookId,
        chapter,
      }: { versionId: string; bookId: number; chapter: number }
    ) => {
      try {
        const verses = await db.verse.findMany({
          where: {
            versionId,
            bookId,
            chapter,
          },
          include: {
            book: true,
            version: {
              include: {
                translation: true,
              },
            },
          },
          orderBy: { verse: "asc" },
        });
        // Serialize dates to avoid non-serializable values in Redux
        return verses.map((verse: any) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book
            ? {
                ...verse.book,
                createdAt: verse.book.createdAt?.toISOString(),
                updatedAt: verse.book.updatedAt?.toISOString(),
              }
            : null,
          version: verse.version
            ? {
                ...verse.version,
                createdAt: verse.version.createdAt?.toISOString(),
                updatedAt: verse.version.updatedAt?.toISOString(),
                translation: verse.version.translation
                  ? {
                      ...verse.version.translation,
                      createdAt:
                        verse.version.translation.createdAt?.toISOString(),
                      updatedAt:
                        verse.version.translation.updatedAt?.toISOString(),
                    }
                  : null,
              }
            : null,
        }));
      } catch (error) {
        console.error("Error loading verses:", error);
        throw error;
      }
    }
  );

  // Search operations
  ipcMain.handle(
    "db:searchVerses",
    async (
      event,
      { query, versionId }: { query: string; versionId?: string }
    ) => {
      try {
        const whereClause: any = {
          text: {
            contains: query,
          },
        };

        if (versionId) {
          whereClause.versionId = versionId;
        }

        const verses = await db.verse.findMany({
          where: whereClause,
          include: {
            book: true,
            version: {
              include: {
                translation: true,
              },
            },
          },
          take: 50, // Limit results
          orderBy: [
            { book: { order: "asc" } },
            { chapter: "asc" },
            { verse: "asc" },
          ],
        });
        // Serialize dates to avoid non-serializable values in Redux
        return verses.map((verse: any) => ({
          ...verse,
          createdAt: verse.createdAt?.toISOString(),
          updatedAt: verse.updatedAt?.toISOString(),
          book: verse.book
            ? {
                ...verse.book,
                createdAt: verse.book.createdAt?.toISOString(),
                updatedAt: verse.book.updatedAt?.toISOString(),
              }
            : null,
          version: verse.version
            ? {
                ...verse.version,
                createdAt: verse.version.createdAt?.toISOString(),
                updatedAt: verse.version.updatedAt?.toISOString(),
                translation: verse.version.translation
                  ? {
                      ...verse.version.translation,
                      createdAt:
                        verse.version.translation.createdAt?.toISOString(),
                      updatedAt:
                        verse.version.translation.updatedAt?.toISOString(),
                    }
                  : null,
              }
            : null,
        }));
      } catch (error) {
        console.error("Error searching verses:", error);
        throw error;
      }
    }
  );

  // Database setup operations
  ipcMain.handle("db:seed", async () => {
    try {
      await seedDatabase();
      await bibleImporter.createBasicTopics();
      return { success: true };
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  });

  ipcMain.handle("db:importBibles", async () => {
    try {
      await bibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles:", error);
      throw error;
    }
  });

  ipcMain.handle("db:importBiblesSQLite", async () => {
    try {
      await sqliteBibleImporter.importAllVersions();
      return { success: true };
    } catch (error) {
      console.error("Error importing Bibles from SQLite:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:importSingleBibleSQLite",
    async (event, versionName: string) => {
      try {
        await sqliteBibleImporter.importSingleVersionFromSQLite(versionName);
        return { success: true };
      } catch (error) {
        console.error("Error importing single Bible from SQLite:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("db:getImportStats", async () => {
    try {
      const stats = await sqliteBibleImporter.getImportStats();
      return stats;
    } catch (error) {
      console.error("Error getting import stats:", error);
      throw error;
    }
  });

  // ===== SONG OPERATIONS =====
  
  // Load songs with search and filtering
  ipcMain.handle(
    "db:loadSongs",
    async (
      event,
      params: {
        query?: string;
        filters?: {
          category?: string;
          key?: string;
          tempo?: string;
          artist?: string;
          ccliNumber?: string;
          tags?: string[];
          usage?: 'recent' | 'frequent' | 'favorites';
        };
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      try {
        const { query, filters = {}, limit = 50, offset = 0 } = params;
        
        // Build where clause
        const whereConditions: any[] = [];
        
        // Text search across multiple fields
        if (query) {
          whereConditions.push({
            OR: [
              { title: { contains: query } },
              { artist: { contains: query } },
              { author: { contains: query } },
              { lyrics: { contains: query } },
              { category: { contains: query } },
            ],
          });
        }
        
        // Apply filters
        if (filters.category) {
          whereConditions.push({ category: filters.category });
        }
        
        if (filters.key) {
          whereConditions.push({ key: filters.key });
        }
        
        if (filters.tempo) {
          whereConditions.push({ tempo: filters.tempo });
        }
        
        if (filters.artist) {
          whereConditions.push({ 
            artist: { contains: filters.artist } 
          });
        }
        
        if (filters.ccliNumber) {
          whereConditions.push({ ccliNumber: filters.ccliNumber });
        }
        
        if (filters.tags && filters.tags.length > 0) {
          // Handle JSON array search for tags
          whereConditions.push({
            OR: filters.tags.map(tag => ({
              tags: { contains: tag }
            }))
          });
        }
        
        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
        
        // Determine ordering
        let orderBy: any[] = [];
        if (filters.usage === 'recent') {
          orderBy = [{ lastUsed: "desc" }, { updatedAt: "desc" }];
        } else if (filters.usage === 'frequent') {
          orderBy = [{ usageCount: "desc" }, { lastUsed: "desc" }];
        } else {
          orderBy = [{ title: "asc" }];
        }
        
        const songs = await db.song.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
        });
        
        // Serialize dates and parse JSON fields
        return songs.map((song: any) => ({
          ...song,
          tags: song.tags ? JSON.parse(song.tags) : [],
          createdAt: song.createdAt?.toISOString(),
          updatedAt: song.updatedAt?.toISOString(),
          lastUsed: song.lastUsed?.toISOString(),
        }));
      } catch (error) {
        console.error("Error loading songs:", error);
        throw error;
      }
    }
  );
  
  // Search songs (dedicated search with advanced options)
  ipcMain.handle(
    "db:searchSongs",
    async (event, searchParams: {
      query: string;
      filters?: any;
      limit?: number;
      offset?: number;
    }) => {
      try {
        // Use the same logic as loadSongs but optimized for search
        return await ipcMain.emit("db:loadSongs", event, searchParams);
      } catch (error) {
        console.error("Error searching songs:", error);
        throw error;
      }
    }
  );
  
  // Get single song with full details
  ipcMain.handle("db:getSong", async (event, songId: string) => {
    try {
      const song = await db.song.findUnique({
        where: { id: songId },
      });
      
      if (!song) {
        throw new Error(`Song with ID ${songId} not found`);
      }
      
      // Parse structure and tags
      const songData = {
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString(),
      };
      
      return songData;
    } catch (error) {
      console.error("Error getting song:", error);
      throw error;
    }
  });
  
  // Create new song
  ipcMain.handle("db:createSong", async (event, songData: any) => {
    try {
      const newSong = await db.song.create({
        data: {
          ...songData,
          tags: songData.tags ? JSON.stringify(songData.tags) : null,
          usageCount: 0,
        },
      });
      
      return {
        ...newSong,
        tags: newSong.tags ? JSON.parse(newSong.tags) : [],
        structure: newSong.lyrics ? parseSongStructure(newSong.lyrics) : { slides: [], order: [] },
        createdAt: newSong.createdAt?.toISOString(),
        updatedAt: newSong.updatedAt?.toISOString(),
        lastUsed: newSong.lastUsed?.toISOString(),
      };
    } catch (error) {
      console.error("Error creating song:", error);
      throw error;
    }
  });
  
  // Update existing song
  ipcMain.handle("db:updateSong", async (event, song: any) => {
    try {
      // Extract only the database fields, excluding computed fields like 'structure'
      const {
        structure, // Remove computed field
        createdAt, // Remove readonly field
        ...songData
      } = song;
      
      const updatedSong = await db.song.update({
        where: { id: song.id },
        data: {
          ...songData,
          tags: song.tags ? JSON.stringify(song.tags) : null,
          updatedAt: new Date(),
        },
      });
      
      return {
        ...updatedSong,
        tags: updatedSong.tags ? JSON.parse(updatedSong.tags) : [],
        structure: updatedSong.lyrics ? parseSongStructure(updatedSong.lyrics) : { slides: [], order: [] },
        createdAt: updatedSong.createdAt?.toISOString(),
        updatedAt: updatedSong.updatedAt?.toISOString(),
        lastUsed: updatedSong.lastUsed?.toISOString(),
      };
    } catch (error) {
      console.error("Error updating song:", error);
      throw error;
    }
  });
  
  // Delete song
  ipcMain.handle("db:deleteSong", async (event, songId: string) => {
    try {
      // Check if song is used in any services
      const serviceItems = await db.serviceItem.findMany({
        where: { songId: songId },
      });
      
      if (serviceItems.length > 0) {
        throw new Error(`Cannot delete song: it is used in ${serviceItems.length} service(s)`);
      }
      
      await db.song.delete({
        where: { id: songId },
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  });
  
  // Update song usage (track when song is used)
  ipcMain.handle("db:updateSongUsage", async (event, songId: string) => {
    try {
      const updatedSong = await db.song.update({
        where: { id: songId },
        data: {
          lastUsed: new Date(),
          usageCount: {
            increment: 1,
          },
        },
      });
      
      return {
        ...updatedSong,
        tags: updatedSong.tags ? JSON.parse(updatedSong.tags) : [],
        structure: updatedSong.lyrics ? parseSongStructure(updatedSong.lyrics) : { slides: [], order: [] },
        createdAt: updatedSong.createdAt?.toISOString(),
        updatedAt: updatedSong.updatedAt?.toISOString(),
        lastUsed: updatedSong.lastUsed?.toISOString(),
      };
    } catch (error) {
      console.error("Error updating song usage:", error);
      throw error;
    }
  });
  
  // Get recent songs
  ipcMain.handle("db:getRecentSongs", async (event, { limit = 10 } = {}) => {
    try {
      const songs = await db.song.findMany({
        where: {
          lastUsed: { not: null },
        },
        orderBy: { lastUsed: "desc" },
        take: limit,
      });
      
      return songs.map((song: any) => ({
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString(),
      }));
    } catch (error) {
      console.error("Error getting recent songs:", error);
      throw error;
    }
  });
  
  // Get favorite songs (placeholder - would need to implement favorites system)
  ipcMain.handle("db:getFavoriteSongs", async (event, { limit = 20 } = {}) => {
    try {
      // For now, return most used songs as "favorites"
      const songs = await db.song.findMany({
        orderBy: { usageCount: "desc" },
        take: limit,
      });
      
      return songs.map((song: any) => ({
        ...song,
        tags: song.tags ? JSON.parse(song.tags) : [],
        structure: song.lyrics ? parseSongStructure(song.lyrics) : { slides: [], order: [] },
        createdAt: song.createdAt?.toISOString(),
        updatedAt: song.updatedAt?.toISOString(),
        lastUsed: song.lastUsed?.toISOString(),
      }));
    } catch (error) {
      console.error("Error getting favorite songs:", error);
      throw error;
    }
  });
  
  // Get song categories
  ipcMain.handle("db:getSongCategories", async () => {
    try {
      const categories = await db.song.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
      });
      
             return categories.map((c: any) => c.category).filter(Boolean);
    } catch (error) {
      console.error("Error getting song categories:", error);
      throw error;
    }
  });
  
  // Import songs in batch
  ipcMain.handle("db:importSongs", async (event, importData: {
    songs: any[];
    format: string;
  }) => {
    try {
      const { songs, format } = importData;
      const importedSongs = [];
      
      for (const songData of songs) {
        try {
          const newSong = await db.song.create({
            data: {
              ...songData,
              tags: songData.tags ? JSON.stringify(songData.tags) : null,
              usageCount: 0,
            },
          });
          
          importedSongs.push({
            ...newSong,
            tags: newSong.tags ? JSON.parse(newSong.tags) : [],
            structure: newSong.lyrics ? parseSongStructure(newSong.lyrics) : { slides: [], order: [] },
            createdAt: newSong.createdAt?.toISOString(),
            updatedAt: newSong.updatedAt?.toISOString(),
            lastUsed: newSong.lastUsed?.toISOString(),
          });
        } catch (error) {
          console.error(`Error importing song "${songData.title}":`, error);
          // Continue with other songs
        }
      }
      
      return {
        success: true,
        imported: importedSongs.length,
        total: songs.length,
        songs: importedSongs,
      };
    } catch (error) {
      console.error("Error importing songs:", error);
      throw error;
    }
  });

  // ===== PRESENTATIONS & SLIDES OPERATIONS =====
  
  // Load presentations with search and filtering
  ipcMain.handle(
    "db:loadPresentations",
    async (
      event,
      params: {
        query?: string;
        filters?: {
          category?: string;
          tags?: string[];
          template?: string;
          dateRange?: { start: string; end: string };
          usage?: 'recent' | 'frequent' | 'favorites';
        };
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      try {
        const { query, filters = {}, limit = 50, offset = 0 } = params;
        
        // Build where clause
        const whereConditions: any[] = [];
        
        // Text search across available fields only
        if (query) {
          whereConditions.push({
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          });
        }
        
        // Apply filters (category filter through template relationship)
        if (filters.category) {
          whereConditions.push({ 
            template: { 
              category: filters.category 
            } 
          });
        }
        
        if (filters.dateRange) {
          whereConditions.push({
            createdAt: {
              gte: new Date(filters.dateRange.start),
              lte: new Date(filters.dateRange.end),
            },
          });
        }
        
        const where = whereConditions.length > 0 ? { AND: whereConditions } : {};
        
        // Determine ordering
        let orderBy: any[] = [];
        if (filters.usage === 'recent') {
          orderBy = [{ lastUsed: "desc" }, { updatedAt: "desc" }];
        } else if (filters.usage === 'frequent') {
          orderBy = [{ lastUsed: "desc" }];
        } else {
          orderBy = [{ title: "asc" }];
        }
        
        const presentations = await db.presentation.findMany({
          where,
          include: {
            slides: {
              orderBy: { order: "asc" },
            },
            template: true,
          },
          orderBy,
          take: limit,
          skip: offset,
        });
        
        // Serialize dates and add computed fields
        return presentations.map((presentation: any) => ({
          ...presentation,
          tags: [], // Default empty tags since field doesn't exist
          usageCount: 0, // Default usage count since field doesn't exist
          category: presentation.template?.category || null, // Get category from template
          slides: presentation.slides.map((slide: any) => ({
            ...slide,
            createdAt: slide.createdAt?.toISOString(),
            updatedAt: slide.updatedAt?.toISOString(),
          })),
          createdAt: presentation.createdAt?.toISOString(),
          updatedAt: presentation.updatedAt?.toISOString(),
          lastUsed: presentation.lastUsed?.toISOString(),
          totalSlides: presentation.slides.length,
        }));
      } catch (error) {
        console.error("Error loading presentations:", error);
        throw error;
      }
    }
  );
  
  // Search presentations (dedicated search with advanced options)
  ipcMain.handle(
    "db:searchPresentations",
    async (event, searchParams: {
      query: string;
      filters?: any;
      limit?: number;
      offset?: number;
    }) => {
      try {
        // Use the same logic as loadPresentations but optimized for search
        return await ipcMain.emit("db:loadPresentations", event, searchParams);
      } catch (error) {
        console.error("Error searching presentations:", error);
        throw error;
      }
    }
  );
  
  // Get single presentation with full details
  ipcMain.handle("db:getPresentation", async (event, presentationId: string) => {
    try {
      const presentation = await db.presentation.findUnique({
        where: { id: presentationId },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
          template: true,
        },
      });
      
      if (!presentation) {
        throw new Error(`Presentation with ID ${presentationId} not found`);
      }
      
      return {
        ...presentation,
        tags: [], // Default empty tags since field doesn't exist
        usageCount: 0, // Default usage count since field doesn't exist
        category: presentation.template?.category || null, // Get category from template
        slides: presentation.slides.map((slide: any) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString(),
        })),
        createdAt: presentation.createdAt?.toISOString(),
        updatedAt: presentation.updatedAt?.toISOString(),
        lastUsed: presentation.lastUsed?.toISOString(),
        totalSlides: presentation.slides.length,
      };
    } catch (error) {
      console.error("Error getting presentation:", error);
      throw error;
    }
  });
  
  // Create new presentation
  ipcMain.handle("db:createPresentation", async (event, presentationData: any) => {
    try {
      const newPresentation = await db.presentation.create({
        data: {
          title: presentationData.title,
          description: presentationData.description,
          templateId: presentationData.templateId,
        },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
          template: true,
        },
      });
      
      return {
        ...newPresentation,
        tags: [], // Default empty tags since field doesn't exist
        usageCount: 0, // Default usage count since field doesn't exist
        category: newPresentation.template?.category || null, // Get category from template
        slides: newPresentation.slides.map((slide: any) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString(),
        })),
        createdAt: newPresentation.createdAt?.toISOString(),
        updatedAt: newPresentation.updatedAt?.toISOString(),
        lastUsed: newPresentation.lastUsed?.toISOString(),
        totalSlides: newPresentation.slides.length,
      };
    } catch (error) {
      console.error("Error creating presentation:", error);
      throw error;
    }
  });
  
  // Update existing presentation
  ipcMain.handle("db:updatePresentation", async (event, presentation: any) => {
    try {
      // Extract only the database fields
      const {
        slides, // Remove computed field
        totalSlides, // Remove computed field
        template, // Remove computed field
        createdAt, // Remove readonly field
        ...presentationData
      } = presentation;
      
      const updatedPresentation = await db.presentation.update({
        where: { id: presentation.id },
        data: {
          title: presentation.title,
          description: presentation.description,
          templateId: presentation.templateId,
          lastUsed: presentation.lastUsed ? new Date(presentation.lastUsed) : undefined,
        },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
          template: true,
        },
      });
      
      return {
        ...updatedPresentation,
        tags: updatedPresentation.tags ? JSON.parse(updatedPresentation.tags) : [],
        slides: updatedPresentation.slides.map((slide: any) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString(),
        })),
        createdAt: updatedPresentation.createdAt?.toISOString(),
        updatedAt: updatedPresentation.updatedAt?.toISOString(),
        lastUsed: updatedPresentation.lastUsed?.toISOString(),
        totalSlides: updatedPresentation.slides.length,
      };
    } catch (error) {
      console.error("Error updating presentation:", error);
      throw error;
    }
  });
  
  // Delete presentation
  ipcMain.handle("db:deletePresentation", async (event, presentationId: string) => {
    try {
      // Delete all slides first (cascade delete)
      await db.slide.deleteMany({
        where: { presentationId: presentationId },
      });
      
      // Delete the presentation
      await db.presentation.delete({
        where: { id: presentationId },
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting presentation:", error);
      throw error;
    }
  });
  
  // Create new slide
  ipcMain.handle("db:createSlide", async (event, slideData: any) => {
    try {
      const newSlide = await db.slide.create({
        data: {
          ...slideData,
          content: typeof slideData.content === 'string' ? slideData.content : JSON.stringify(slideData.content),
        },
      });
      
      return {
        ...newSlide,
        createdAt: newSlide.createdAt?.toISOString(),
        updatedAt: newSlide.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error("Error creating slide:", error);
      throw error;
    }
  });
  
  // Update existing slide
  ipcMain.handle("db:updateSlide", async (event, slide: any) => {
    try {
      const {
        createdAt, // Remove readonly field
        ...slideData
      } = slide;
      
      const updatedSlide = await db.slide.update({
        where: { id: slide.id },
        data: {
          ...slideData,
          content: typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content),
          updatedAt: new Date(),
        },
      });
      
      return {
        ...updatedSlide,
        createdAt: updatedSlide.createdAt?.toISOString(),
        updatedAt: updatedSlide.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error("Error updating slide:", error);
      throw error;
    }
  });
  
  // Delete slide
  ipcMain.handle("db:deleteSlide", async (event, slideId: string) => {
    try {
      await db.slide.delete({
        where: { id: slideId },
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting slide:", error);
      throw error;
    }
  });
  
  // Reorder slides in presentation
  ipcMain.handle("db:reorderSlides", async (event, params: {
    presentationId: string;
    slideOrders: { id: string; order: number }[];
  }) => {
    try {
      const { presentationId, slideOrders } = params;
      
      // Update each slide's order
      const updatePromises = slideOrders.map(({ id, order }) =>
        db.slide.update({
          where: { id },
          data: { order },
        })
      );
      
      await Promise.all(updatePromises);
      
      // Return updated slides in order
      const updatedSlides = await db.slide.findMany({
        where: { presentationId },
        orderBy: { order: "asc" },
      });
      
      return updatedSlides.map((slide: any) => ({
        ...slide,
        createdAt: slide.createdAt?.toISOString(),
        updatedAt: slide.updatedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error reordering slides:", error);
      throw error;
    }
  });
  
  // Update presentation usage (track when presentation is used)
  ipcMain.handle("db:updatePresentationUsage", async (event, presentationId: string) => {
    try {
      const updatedPresentation = await db.presentation.update({
        where: { id: presentationId },
        data: {
          lastUsed: new Date(),
        },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
          template: true,
        },
      });
      
      return {
        ...updatedPresentation,
        tags: updatedPresentation.tags ? JSON.parse(updatedPresentation.tags) : [],
        slides: updatedPresentation.slides.map((slide: any) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString(),
        })),
        createdAt: updatedPresentation.createdAt?.toISOString(),
        updatedAt: updatedPresentation.updatedAt?.toISOString(),
        lastUsed: updatedPresentation.lastUsed?.toISOString(),
        totalSlides: updatedPresentation.slides.length,
      };
    } catch (error) {
      console.error("Error updating presentation usage:", error);
      throw error;
    }
  });
  
  // Get recent presentations
  ipcMain.handle("db:getRecentPresentations", async (event, { limit = 10 } = {}) => {
    try {
      const presentations = await db.presentation.findMany({
        where: {
          lastUsed: { not: null },
        },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
          template: true,
        },
        orderBy: { lastUsed: "desc" },
        take: limit,
      });
      
      return presentations.map((presentation: any) => ({
        ...presentation,
        tags: presentation.tags ? JSON.parse(presentation.tags) : [],
        slides: presentation.slides.map((slide: any) => ({
          ...slide,
          createdAt: slide.createdAt?.toISOString(),
          updatedAt: slide.updatedAt?.toISOString(),
        })),
        createdAt: presentation.createdAt?.toISOString(),
        updatedAt: presentation.updatedAt?.toISOString(),
        lastUsed: presentation.lastUsed?.toISOString(),
        totalSlides: presentation.slides.length,
      }));
    } catch (error) {
      console.error("Error getting recent presentations:", error);
      throw error;
    }
  });
  
  // Get templates
  ipcMain.handle("db:getTemplates", async () => {
    try {
      const templates = await db.template.findMany({
        orderBy: [
          { isDefault: "desc" },
          { name: "asc" },
        ],
      });
      
      return templates.map((template: any) => ({
        ...template,
        createdAt: template.createdAt?.toISOString(),
        updatedAt: template.updatedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error getting templates:", error);
      throw error;
    }
  });
  
  // Get backgrounds
  ipcMain.handle("db:getBackgrounds", async () => {
    try {
      const backgrounds = await db.background.findMany({
        orderBy: [
          { isDefault: "desc" },
          { name: "asc" },
        ],
        include: {
          mediaItem: true,
        },
      });
      
      return backgrounds.map((background: any) => ({
        ...background,
        createdAt: background.createdAt?.toISOString(),
        updatedAt: background.updatedAt?.toISOString(),
      }));
    } catch (error) {
      console.error("Error getting backgrounds:", error);
      throw error;
    }
  });
  
  // Get presentation categories (using templates for categorization)
  ipcMain.handle("db:getPresentationCategories", async () => {
    try {
      // Since Presentation doesn't have category field, get categories from templates
      const templates = await db.template.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category'],
      });
      
      // Return template categories as presentation categories
      const categories = templates.map((t: any) => t.category).filter(Boolean);
      
      // Add some default categories if none exist
      if (categories.length === 0) {
        return ['Sermon', 'Teaching', 'Worship', 'Announcement'];
      }
      
      return categories;
    } catch (error) {
      console.error("Error getting presentation categories:", error);
      // Return default categories on error
      return ['Sermon', 'Teaching', 'Worship', 'Announcement'];
    }
  });

  // Service operations (for future use)
  ipcMain.handle("db:loadServices", async (event, limit = 20) => {
    try {
      const services = await db.service.findMany({
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
      });
      return services;
    } catch (error) {
      console.error("Error loading services:", error);
      throw error;
    }
  });

  // Settings operations
  ipcMain.handle("db:getSetting", async (event, key: string) => {
    try {
      const setting = await db.setting.findUnique({
        where: { key },
      });
      return setting?.value || null;
    } catch (error) {
      console.error("Error getting setting:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "db:setSetting",
    async (
      event,
      {
        key,
        value,
        type = "string",
        category,
      }: { key: string; value: string; type?: string; category?: string }
    ) => {
      try {
        const setting = await db.setting.upsert({
          where: { key },
          update: { value, type, category },
          create: { key, value, type, category },
        });
        return setting;
      } catch (error) {
        console.error("Error setting setting:", error);
        throw error;
      }
    }
  );
}

export { db };
