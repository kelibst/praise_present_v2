describe('Testing Setup Verification', () => {
  it('should run basic Jest tests', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toHaveLength(3);
  });

  it('should handle async operations', async () => {
    const asyncOperation = () => Promise.resolve('success');
    const result = await asyncOperation();
    expect(result).toBe('success');
  });

  it('should mock Date.now correctly', () => {
    const mockTimestamp = 1640995200000;
    jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    
    expect(Date.now()).toBe(mockTimestamp);
    
    jest.restoreAllMocks();
  });

  it('should validate custom matcher works', () => {
    const mockSlide = {
      id: 'test-slide-123',
      type: 'note',
      title: 'Test Slide',
      content: { text: 'Test content' },
      template: { id: 'template-1', name: 'Test Template', category: 'content', layout: {}, defaultStyling: {} },
      background: { type: 'solid', colors: ['#000000'], opacity: 1 },
      textFormatting: { titleFont: {}, contentFont: {} },
      metadata: { usageCount: 0, tags: ['test'], category: 'test' },
      transitions: { enter: 'fade', exit: 'fade', duration: 300 },
      createdAt: '2022-01-01T00:00:00.000Z',
      updatedAt: '2022-01-01T00:00:00.000Z'
    };

    expect(mockSlide).toBeValidUniversalSlide();
  });
}); 