import '@testing-library/jest-dom';

// Mock Electron APIs that might be used in tests
const mockElectron = {
  ipcRenderer: {
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  }
};

// Mock window.electronAPI that might be used by components
Object.defineProperty(window, 'electronAPI', {
  value: mockElectron.ipcRenderer,
  writable: true
});

// Mock Date.now for consistent testing
const mockDateNow = jest.fn(() => 1640995200000); // Fixed timestamp: 2022-01-01 00:00:00
Date.now = mockDateNow;

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress console logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidUniversalSlide(received) {
    const requiredFields = ['id', 'type', 'title', 'content', 'template', 'background', 'textFormatting', 'metadata', 'transitions', 'createdAt', 'updatedAt'];
    const missingFields = requiredFields.filter(field => !(field in received));
    
    if (missingFields.length > 0) {
      return {
        message: () => `Expected slide to have all required fields. Missing: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
    
    return {
      message: () => 'Expected slide to not be a valid Universal Slide',
      pass: true,
    };
  },
});

// TypeScript declaration for custom matcher
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUniversalSlide(): R;
    }
  }
} 