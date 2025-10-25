# LivePresentationPage Redux Refactoring Plan

## Changes to Apply:

### 1. Add new imports
- Import useUI from hooks/useUI
- Remove local useState imports for UI state

### 2. Replace local state with Redux (uiSlice)
```typescript
// REMOVE:
const [activeTab, setActiveTab] = useState<ActiveTab>('scripture');
const [scriptureSubTab, setScriptureSubTab] = useState<'browse' | 'type'>('browse');
const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
const [settingsModalOpen, setSettingsModalOpen] = useState(false);
const [pendingSongs, setPendingSongs] = useState<ServiceItem[]>([]);
const [showInlineMediaModal, setShowInlineMediaModal] = useState(false);
const [inlineMediaType, setInlineMediaType] = useState<...>(null);
const [insertPosition, setInsertPosition] = useState<number>(0);
const [showPropertyPanel, setShowPropertyPanel] = useState(false);
const [activeVerseNumbers, setActiveVerseNumbers] = useState<number[]>([]);
const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
const [isLoadingService, setIsLoadingService] = useState(true);
const [isPlanLoading, setIsPlanLoading] = useState(false);
const [planError, setPlanError] = useState<string | null>(null);
const [isExecutingService, setIsExecutingService] = useState(false);
const [panelVisibility, setPanelVisibility] = useState({...});
const [panelSizes, setPanelSizes] = useState([25, 50, 25]);

// ADD:
const ui = useUI();
```

### 3. Update tab switching logic
```typescript
// Use presentation.switchTab() instead of manual clear
useEffect(() => {
  const prevTab = prevTabRef.current;
  if (prevTab !== activeTab) {
    presentation.switchTab(prevTab, ui.activeTab);
    prevTabRef.current = ui.activeTab;
  }
}, [ui.activeTab, presentation]);
```

### 4. Remove localStorage polling
Remove the entire useEffect that polls localStorage for pendingSongs

### 5. Update all useState references to use ui.*
- activeTab → ui.activeTab
- setActiveTab → ui.setActiveTab
- isGeneratingSlides → ui.isGeneratingSlides
- etc.

### 6. Memoize selectedItem
```typescript
const selectedItem = useMemo(() => 
  presentation.current.content ? {
    id: presentation.current.content.id,
    // ...
  } : null,
  [presentation.current.content]
);
```

### 7. Add useRef for hasAutoSwitched
```typescript
const hasAutoSwitchedRef = useRef(false);
```

### 8. Use consolidated loading state
```typescript
// Instead of separate setIsGeneratingSlides(true)
ui.setLoading({ type: 'generating-slides', itemId: item.id });

// When done
ui.clearLoading();
```
