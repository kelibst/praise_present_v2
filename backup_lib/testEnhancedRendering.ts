import { UniversalSlide, TextFormatting, SlideTemplate, SlideBackground } from './universalSlideSlice';
import { universalContentRenderer } from './universalContentRenderer';

// Create a test slide with enhanced text formatting
export const createTestSlide = (): UniversalSlide => {
  const textFormatting: TextFormatting = {
    font: {
      family: 'Arial, sans-serif',
      size: 32,
      weight: 'normal',
      style: 'normal',
      color: '#ffffff'
    },
    spacing: {
      letterSpacing: 1,
      lineHeight: 1.4,
      paragraphSpacing: 16
    },
    effects: {
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
      animations: {
        entrance: 'fade',
        duration: 500
      }
    },
    alignment: {
      horizontal: 'center',
      vertical: 'middle'
    }
  };

  const template: SlideTemplate = {
    id: 'test-template',
    name: 'Test Template',
    category: 'content',
    description: 'A test template for enhanced rendering',
    textZones: [
      {
        id: 'main-content',
        name: 'Main Content Area',
        bounds: { x: 100, y: 200, width: 1720, height: 600 },
        defaultFormatting: textFormatting,
        contentRules: {
          allowedTypes: ['text', 'heading', 'verse'],
          requireContent: true
        },
        autoResize: {
          enabled: true,
          strategy: 'font-size',
          minSize: 16,
          maxSize: 80,
          maintainAspectRatio: false
        },
        overflow: {
          behavior: 'scale-down',
          showEllipsis: false
        },
        priority: 1
      }
    ],
    mediaZones: [],
    globalConstraints: {
      maxTextElements: 5,
      preserveAspectRatio: false,
      responsiveScaling: true,
      minFontSize: 16,
      maxFontSize: 120
    },
    layout: {
      type: 'flexible',
      backgroundOpacity: 1,
      padding: { top: 40, right: 40, bottom: 40, left: 40 },
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      safeArea: { x: 50, y: 50, width: 1820, height: 980 }
    },
    defaultFormatting: textFormatting,
    metadata: {
      version: '1.0',
      author: 'Enhanced Rendering System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: true,
      usage: 0
    }
  };

  const background: SlideBackground = {
    type: 'gradient',
    colors: ['#1a1a2e', '#16213e'],
    opacity: 1
  };

  const testSlide: UniversalSlide = {
    id: 'test-slide-enhanced',
    type: 'scripture',
    title: 'John 3:16',
    subtitle: 'New International Version',
    content: {
      verses: [{
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
      }],
      reference: 'John 3:16 NIV'
    },
    template,
    background,
    textFormatting,
    metadata: {
      source: 'John 3:16 NIV',
      usageCount: 0,
      tags: ['scripture', 'love', 'salvation'],
      category: 'scripture'
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    timing: {
      autoAdvance: false,
      duration: 30,
      pauseOnInteraction: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return testSlide;
};

// Test the enhanced rendering system
export const testEnhancedRendering = async () => {
  console.log('🚀 Testing Enhanced Rendering System...');
  
  try {
    const testSlide = createTestSlide();
    console.log('✅ Test slide created:', testSlide.title);

    const renderContext = {
      viewport: { x: 0, y: 0, width: 1920, height: 1080 },
      isPreview: true,
      scaleFactor: 1,
      theme: 'dark' as const
    };

    // Test content validation
    const validation = universalContentRenderer.validateContent(testSlide);
    console.log('🔍 Validation result:', validation);

    // Test enhanced rendering
    const renderedContent = await universalContentRenderer.renderContent(testSlide, renderContext);
    console.log('🎨 Enhanced rendering successful:', renderedContent.type);

    // Test preview rendering
    const previewContent = await universalContentRenderer.previewContent(testSlide, renderContext);
    console.log('👁️ Preview rendering successful:', previewContent.type);

    console.log('✅ All enhanced rendering tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Enhanced rendering test failed:', error);
    return false;
  }
};

// Export for use in other files
export { universalContentRenderer };