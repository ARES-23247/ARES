---
phase: 26
status: complete
---

# Phase 26: Calendar & Event Editor Enhancements

## Objective
Enhance the calendar and event editor with improved location selection, collaborative editing fixes, and autocomplete functionality.

## Tasks

### 1. `components/calendar/QuickAddEventModal.tsx`
- **Objective:** Create a reusable modal component for quick event creation.
- **Details:**
  - Form fields: title (required), category selector, start/end date/time, location (dropdown)
  - Pre-fill start/end times based on the selected date (start = clicked day at current time, end = +1 hour)
  - Category selector with ARES brand colors: Practice (ares-red), Outreach (ares-gold), Community (ares-cyan)
  - Location dropdown with searchable/autocomplete combobox
  - "Add New Venue" option that opens CreateLocationModal inline
  - Loading state during API submission
  - Error handling with inline error messages
  - Toast notification on success
  - Keyboard navigation: Escape to close, Enter to submit
  - Focus management: auto-focus title input on open

### 2. `components/calendar/MonthViewGrid.tsx`
- **Objective:** Integrate the quick-add modal with clickable day cells.
- **Details:**
  - Make day cells clickable (onClick handler)
  - Add keyboard accessibility (Enter/Space to activate)
  - Add visual affordance: Plus button appears on hover in top-right of day cell
  - Add aria-label for screen readers: "Add event on [date]"
  - Prevent modal from opening when clicking on event links (stopPropagation)
  - Invalidate and refetch events query on successful creation

### 3. `components/LocationCombobox.tsx`
- **Objective:** Replace native select with searchable autocomplete combobox.
- **Details:**
  - Use HeadlessUI Combobox for better UX
  - Filter locations by name or address as user types
  - Show "Add New Venue" option at bottom
  - Handle null values correctly for type safety

### 4. `components/EventEditor.tsx`
- **Objective:** Replace native location select with combobox.
- **Details:**
  - Integrate LocationCombobox component
  - Maintain existing "Add New Venue" workflow with CreateLocationModal

### 5. Collaborative Editing Fix
- **Objective:** Fix PartyKit WebSocket connection.
- **Details:**
  - Remove incorrect `/party` path suffix from host URL
  - y-partykit already appends `/parties/main/` automatically

### 6. E2E Test Updates
- **Objective:** Update tests to work with new combobox component.
- **Details:**
  - Change from `selectOption` to `fill` + `getByRole("option")`
  - Update EventEditor.spec.ts

## Requirements Satisfied
- **CAL-04:** Users can quickly add events directly from the calendar view
- **CAL-05:** Location selection with autocomplete for better UX
- **ACC-01:** Keyboard accessible modal navigation
- **UX-01:** Clear visual feedback (hover states, focus indicators)

## Out of Scope
- Full event editor (recurring events, rich text description, cover image)
- Event editing (only creation via quick-add modal)
- Event deletion

## Validation
- [x] Modal opens when clicking any day cell
- [x] Modal opens with keyboard (Enter/Space on focused day cell)
- [x] Start/end times are pre-filled correctly based on clicked day
- [x] Category buttons toggle correctly and show selected state
- [x] Form validates required fields (title)
- [x] Event appears on calendar after successful creation
- [x] Modal closes on successful creation
- [x] Modal closes with Escape key
- [x] Clicking event links does NOT open the modal
- [x] Location combobox filters as user types
- [x] "Add New Venue" opens CreateLocationModal
- [x] Collaborative editing connects successfully
