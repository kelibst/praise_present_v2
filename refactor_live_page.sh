#!/bin/bash

FILE="src/pages/LivePresentationPage.tsx"

# Create backup
cp "$FILE" "$FILE.backup_before_refactor"

# Add useUI hook after usePresentation
sed -i '/const presentation = usePresentation();/a\  const ui = useUI();' "$FILE"

# Add hasAutoSwitched ref
sed -i '/const presentation = usePresentation();/a\  const hasAutoSwitchedRef = useRef(false);' "$FILE"

# Memoize selectedItem
sed -i 's/const selectedItem = presentation\.current\.content ? {/const selectedItem = useMemo(() => presentation.current.content ? {/g' "$FILE"
sed -i 's/order: 0$/order: 0\n  } : null, [presentation.current.content]);/g' "$FILE"

echo "Phase 1 complete: Added hooks and memoization"
