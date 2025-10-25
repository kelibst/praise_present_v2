# Announcements Content Type Improvement Plan

**Created:** 2025-01-25
**Priority:** MEDIUM - Enhancement of existing AnnouncementContentType and AnnouncementEditor
**Goal:** Refine and extend the announcement editing experience with templates and integration

---

## Current State Analysis

### What Already Exists ✅

**AnnouncementContentType** (`src/rendering/content/AnnouncementContent.ts`)
- Type-safe announcement data model
- Support for event details (date, time, location, contact)
- Urgency levels (low, medium, high)
- Announcement types (event, announcement, reminder, welcome, celebration)
- Template-based slide generation
- Factory methods for common announcement types

**AnnouncementEditor** (`src/components/editors/AnnouncementEditor.tsx`)
- 3-panel layout (content, preview, settings)
- Event details inputs
- Urgency level selector with visual indicators
- Typography controls
- Background customization
- Live preview

**Registered and Working:**
- ✅ AnnouncementContentType registered in ContentTypeRegistry
- ✅ AnnouncementEditor registered in EditorFactory
- ✅ Exports configured in index files

---

## Improvement Areas

### 1. Template Library

**Problem:** Users have to design each announcement from scratch

**Solution:** Create a library of pre-designed announcement templates

**New File:** `src/rendering/templates/AnnouncementTemplates.ts`

```typescript
export interface AnnouncementTemplatePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'event' | 'reminder' | 'celebration' | 'welcome' | 'general';

  // Pre-configured settings
  background: BackgroundStyle;
  typography: {
    titleFontSize: number;
    messageFontSize: number;
    detailsFontSize: number;
    fontFamily: string;
    titleColor: string;
    messageColor: string;
    detailsColor: string;
  };
  layout: 'centered' | 'left-aligned' | 'modern' | 'classic' | 'split' | 'card';
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplatePreset[] = [
  {
    id: 'modern-event',
    name: 'Modern Event',
    description: 'Clean, modern design for church events',
    thumbnail: '/templates/modern-event.png',
    category: 'event',
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { offset: 0, color: { r: 26, g: 26, b: 46, a: 1 } },
          { offset: 1, color: { r: 16, g: 16, b: 30, a: 1 } }
        ]
      }
    },
    typography: {
      titleFontSize: 72,
      messageFontSize: 48,
      detailsFontSize: 36,
      fontFamily: 'Arial',
      titleColor: '#f39c12',
      messageColor: '#ffffff',
      detailsColor: '#cbd5e0'
    },
    layout: 'modern'
  },
  {
    id: 'celebration',
    name: 'Celebration',
    description: 'Bright, festive design for celebrations',
    thumbnail: '/templates/celebration.png',
    category: 'celebration',
    background: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        angle: 45,
        stops: [
          { offset: 0, color: { r: 236, g: 64, b: 122, a: 1 } },
          { offset: 1, color: { r: 251, g: 146, b: 60, a: 1 } }
        ]
      }
    },
    typography: {
      titleFontSize: 84,
      messageFontSize: 52,
      detailsFontSize: 40,
      fontFamily: 'Arial',
      titleColor: '#ffffff',
      messageColor: '#ffffff',
      detailsColor: '#f0f0f0'
    },
    layout: 'centered'
  },
  // Add 8-10 more templates
];
```

**Template Selector UI:**

Add to AnnouncementEditor:

```tsx
<TemplateSelector>
  <div className="grid grid-cols-3 gap-4">
    {ANNOUNCEMENT_TEMPLATES.filter(t => t.category === selectedCategory).map(template => (
      <button
        key={template.id}
        onClick={() => applyTemplate(template)}
        className="border-2 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
      >
        <img src={template.thumbnail} alt={template.name} className="w-full h-32 object-cover" />
        <div className="p-2 text-sm">
          <div className="font-medium">{template.name}</div>
          <div className="text-xs text-muted-foreground">{template.description}</div>
        </div>
      </button>
    ))}
  </div>
</TemplateSelector>
```

---

### 2. Smart Date/Time Picker

**Problem:** Manual date/time entry prone to errors

**Solution:** Calendar and time picker components

**New File:** `src/components/editors/announcement/DateTimePicker.tsx`

```tsx
<DateTimePicker>
  <div className="grid grid-cols-2 gap-4">
    {/* Date Picker */}
    <div>
      <label>Date</label>
      <Calendar
        value={eventDate}
        onChange={setEventDate}
        minDate={new Date()}
        highlightToday
      />
    </div>

    {/* Time Picker */}
    <div>
      <label>Time</label>
      <TimePicker
        value={eventTime}
        onChange={setEventTime}
        format="12h"
        step={15} // 15-minute intervals
      />
    </div>
  </div>

  {/* Quick Options */}
  <div className="mt-4">
    <p className="text-sm text-muted-foreground mb-2">Quick Options:</p>
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" onClick={() => setToNextSunday()}>
        Next Sunday
      </Button>
      <Button size="sm" onClick={() => setToNextWednesday()}>
        Next Wednesday
      </Button>
      <Button size="sm" onClick={() => setToThisWeekend()}>
        This Weekend
      </Button>
    </div>
  </div>
</DateTimePicker>
```

---

### 3. Recurring Announcements

**Problem:** Users have to recreate weekly announcements manually

**Solution:** Recurring announcement feature

**Extend AnnouncementData:**

```typescript
interface RecurringSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate?: Date;
  occurrences?: number; // "Repeat 4 times"
}

interface AnnouncementData {
  // ... existing fields
  recurring?: RecurringSettings;
}
```

**Recurring Editor UI:**

```tsx
<RecurringSettings>
  <Checkbox
    label="Make this a recurring announcement"
    checked={recurring.enabled}
    onChange={(v) => setRecurring({ ...recurring, enabled: v })}
  />

  {recurring.enabled && (
    <>
      <Select
        label="Frequency"
        value={recurring.frequency}
        onChange={(v) => setRecurring({ ...recurring, frequency: v })}
        options={[
          { value: 'weekly', label: 'Every Week' },
          { value: 'biweekly', label: 'Every 2 Weeks' },
          { value: 'monthly', label: 'Every Month' }
        ]}
      />

      <RadioGroup label="End after">
        <Radio
          label="Specific date"
          checked={!!recurring.endDate}
          onChange={() => setRecurring({ ...recurring, endDate: new Date(), occurrences: undefined })}
        />
        <Radio
          label="Number of occurrences"
          checked={!!recurring.occurrences}
          onChange={() => setRecurring({ ...recurring, occurrences: 4, endDate: undefined })}
        />
      </RadioGroup>
    </>
  )}
</RecurringSettings>
```

---

### 4. Announcement Categories & Tags

**Problem:** No organization for announcements

**Solution:** Category and tag system

**Extend AnnouncementMetadata:**

```typescript
interface AnnouncementMetadata {
  // ... existing fields
  category: 'events' | 'ministries' | 'service-times' | 'giving' | 'community' | 'prayer-requests';
  tags: string[];
  audience?: 'all' | 'members' | 'visitors' | 'youth' | 'seniors';
}
```

**Category/Tag UI:**

```tsx
<CategoryTagEditor>
  <Select
    label="Category"
    value={category}
    onChange={setCategory}
    options={[
      { value: 'events', label: 'Events & Gatherings' },
      { value: 'ministries', label: 'Ministries' },
      { value: 'service-times', label: 'Service Times' },
      { value: 'giving', label: 'Giving & Tithes' },
      { value: 'community', label: 'Community' },
      { value: 'prayer-requests', label: 'Prayer Requests' }
    ]}
  />

  <TagInput
    label="Tags"
    value={tags}
    onChange={setTags}
    suggestions={['baptism', 'youth-group', 'worship', 'prayer-meeting', 'bible-study']}
  />

  <Select
    label="Target Audience"
    value={audience}
    onChange={setAudience}
    options={[
      { value: 'all', label: 'Everyone' },
      { value: 'members', label: 'Members Only' },
      { value: 'visitors', label: 'Visitors' },
      { value: 'youth', label: 'Youth' },
      { value: 'seniors', label: 'Seniors' }
    ]}
  />
</CategoryTagEditor>
```

---

### 5. Image/Icon Support

**Problem:** Text-only announcements can be bland

**Solution:** Add image/icon support to announcements

**Extend AnnouncementSettings:**

```typescript
interface AnnouncementSlideSettings {
  // ... existing fields
  image?: {
    url: string;
    position: 'background' | 'left' | 'right' | 'top' | 'bottom';
    size: 'cover' | 'contain' | 'small' | 'medium' | 'large';
    opacity?: number;
  };
  icon?: {
    name: string; // From icon library (Lucide)
    color: string;
    size: number;
    position: 'top' | 'left' | 'inline';
  };
}
```

**Image/Icon Picker UI:**

```tsx
<ImageIconSettings>
  <Tabs>
    <Tab label="Image">
      <ImageUploader
        value={image?.url}
        onChange={(url) => setImage({ ...image, url })}
        accept="image/*"
      />
      {image && (
        <>
          <Select
            label="Position"
            value={image.position}
            onChange={(v) => setImage({ ...image, position: v })}
            options={[
              { value: 'background', label: 'Background' },
              { value: 'left', label: 'Left Side' },
              { value: 'right', label: 'Right Side' }
            ]}
          />
          <Slider
            label="Opacity"
            value={image.opacity || 1}
            onChange={(v) => setImage({ ...image, opacity: v })}
            min={0}
            max={1}
            step={0.1}
          />
        </>
      )}
    </Tab>

    <Tab label="Icon">
      <IconPicker
        value={icon?.name}
        onChange={(name) => setIcon({ ...icon, name })}
        library="lucide" // Use Lucide React icons
      />
      {icon && (
        <>
          <ColorPicker
            label="Icon Color"
            value={icon.color}
            onChange={(v) => setIcon({ ...icon, color: v })}
          />
          <Slider
            label="Icon Size"
            value={icon.size}
            onChange={(v) => setIcon({ ...icon, size: v })}
            min={32}
            max={256}
            step={16}
          />
        </>
      )}
    </Tab>
  </Tabs>
</ImageIconSettings>
```

---

### 6. Quick Announcement Wizard

**Problem:** Creating announcements requires many steps

**Solution:** Step-by-step wizard for quick creation

**New File:** `src/components/editors/announcement/AnnouncementWizard.tsx`

```tsx
<Wizard steps={['Type & Urgency', 'Content', 'Details', 'Design', 'Review']}>
  {/* Step 1: Type & Urgency */}
  <WizardStep>
    <TypeUrgencySelector
      type={type}
      urgency={urgency}
      onTypeChange={setType}
      onUrgencyChange={setUrgency}
    />
  </WizardStep>

  {/* Step 2: Content */}
  <WizardStep>
    <TextInput label="Title" value={title} onChange={setTitle} />
    <TextArea label="Message" value={message} onChange={setMessage} />
    <TextArea label="Call to Action" value={callToAction} onChange={setCallToAction} />
  </WizardStep>

  {/* Step 3: Event Details (if type === 'event') */}
  <WizardStep>
    <EventDetailsForm details={eventDetails} onChange={setEventDetails} />
  </WizardStep>

  {/* Step 4: Design */}
  <WizardStep>
    <TemplateSelector onSelect={setTemplate} />
  </WizardStep>

  {/* Step 5: Review */}
  <WizardStep>
    <AnnouncementPreview announcement={announcement} />
    <Button onClick={handleSave} variant="primary">
      Create Announcement
    </Button>
  </WizardStep>
</Wizard>
```

---

### 7. Integration with Service Planning

**Problem:** Announcements not connected to service plans

**Solution:** Announcement scheduling and service integration

**New Features:**

```typescript
interface AnnouncementSchedule {
  serviceDate: Date;
  serviceName: string;
  position: 'pre-service' | 'mid-service' | 'post-service';
  autoExpire: boolean;
  expiryDate?: Date;
}
```

**Service Integration UI:**

```tsx
<ServiceIntegration>
  <Checkbox
    label="Schedule for specific service"
    checked={hasSchedule}
    onChange={setHasSchedule}
  />

  {hasSchedule && (
    <>
      <DatePicker
        label="Service Date"
        value={schedule.serviceDate}
        onChange={(v) => setSchedule({ ...schedule, serviceDate: v })}
      />

      <Select
        label="Service"
        value={schedule.serviceName}
        onChange={(v) => setSchedule({ ...schedule, serviceName: v })}
        options={[
          { value: 'sunday-morning', label: 'Sunday Morning Service' },
          { value: 'sunday-evening', label: 'Sunday Evening Service' },
          { value: 'wednesday-prayer', label: 'Wednesday Prayer Meeting' }
        ]}
      />

      <RadioGroup label="Position">
        <Radio label="Pre-Service" value="pre-service" />
        <Radio label="Mid-Service" value="mid-service" />
        <Radio label="Post-Service" value="post-service" />
      </RadioGroup>

      <Checkbox
        label="Auto-expire after service"
        checked={schedule.autoExpire}
        onChange={(v) => setSchedule({ ...schedule, autoExpire: v })}
      />
    </>
  )}
</ServiceIntegration>
```

---

## Implementation Checklist

- [ ] Enhancement 1: Template Library
  - [ ] Create AnnouncementTemplates.ts with 10+ templates
  - [ ] Add template selector to AnnouncementEditor
  - [ ] Generate template thumbnail previews
  - [ ] Implement "apply template" functionality

- [ ] Enhancement 2: Date/Time Picker
  - [ ] Create DateTimePicker component
  - [ ] Add calendar widget
  - [ ] Add time picker with 15-min intervals
  - [ ] Add quick date selection buttons

- [ ] Enhancement 3: Recurring Announcements
  - [ ] Extend AnnouncementData with recurring settings
  - [ ] Build recurring editor UI
  - [ ] Implement recurrence generation logic
  - [ ] Add management for recurring series

- [ ] Enhancement 4: Categories & Tags
  - [ ] Extend AnnouncementMetadata
  - [ ] Build category/tag editor UI
  - [ ] Add filtering by category/tag
  - [ ] Create tag suggestion system

- [ ] Enhancement 5: Image/Icon Support
  - [ ] Extend AnnouncementSettings for images/icons
  - [ ] Build image uploader component
  - [ ] Build icon picker (Lucide React)
  - [ ] Update slide generation to render images/icons

- [ ] Enhancement 6: Quick Wizard
  - [ ] Create AnnouncementWizard component
  - [ ] Build 5-step wizard flow
  - [ ] Add navigation and validation
  - [ ] Integrate with AnnouncementEditor

- [ ] Enhancement 7: Service Integration
  - [ ] Create scheduling system
  - [ ] Build service integration UI
  - [ ] Implement auto-expire logic
  - [ ] Connect to service planning

---

## Benefits

### For Users

1. **Faster Creation**: Templates and wizard speed up announcement creation
2. **Better Organization**: Categories and tags keep announcements organized
3. **Visual Appeal**: Images and icons make announcements more engaging
4. **Automation**: Recurring announcements save time
5. **Integration**: Announcements tie into service planning
6. **Scheduling**: Plan announcements in advance

### For Ministry Teams

1. **Consistency**: Templates ensure brand consistency
2. **Collaboration**: Multiple team members can create announcements
3. **Planning**: Schedule announcements weeks in advance
4. **Reusability**: Recurring announcements for weekly events
5. **Targeting**: Audience targeting for specific groups

---

## Timeline Estimate

- Enhancement 1: 4-5 hours
- Enhancement 2: 3-4 hours
- Enhancement 3: 5-6 hours
- Enhancement 4: 3-4 hours
- Enhancement 5: 6-7 hours
- Enhancement 6: 5-6 hours
- Enhancement 7: 6-7 hours

**Total:** ~32-39 hours of development time

---

## Success Criteria

1. ✅ Template library with 10+ professional templates
2. ✅ Date/time picker for easy event scheduling
3. ✅ Recurring announcements work correctly
4. ✅ Category/tag system organizes announcements
5. ✅ Images and icons render in slides
6. ✅ Quick wizard creates announcements in < 2 minutes
7. ✅ Service integration schedules announcements
8. ✅ All enhancements work with existing AnnouncementEditor
