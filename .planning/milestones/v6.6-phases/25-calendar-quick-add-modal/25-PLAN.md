---
phase: 25
status: complete
---

# Phase 25: Calendar Quick-Add Event Modal

## Objective
Add a quick-add event modal to the calendar that allows users to create events by clicking on any day cell. The modal provides essential event creation fields with a streamlined UX, pre-filling the date/time based on the clicked day.

## Tasks

### 1. `components/calendar/QuickAddEventModal.tsx`
- **Objective:** Create a reusable modal component for quick event creation.
- **Details:**
  - Form fields: title (required), category selector, start/end date/time, location (optional)
  - Pre-fill start/end times based on the selected date (start = clicked day at current time, end = +1 hour)
  - Category selector with ARES brand colors: Practice (ares-red), Outreach (ares-gold), Community (ares-cyan)
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

### 3. Event Creation Integration
- **Objective:** Connect the modal to the existing events API.
- **Details:**
  - Use `api.events.saveEvent.mutate()` for event creation
  - Use `useQueryClient` to invalidate queries on success
  - Handle API errors gracefully

## Requirements Satisfied
- **CAL-04:** Users can quickly add events directly from the calendar view
- **ACC-01:** Keyboard accessible modal navigation
- **UX-01:** Clear visual feedback (hover states, focus indicators)

## Out of Scope
- Full event editor (recurring events, rich text description, cover image)
- Event editing (only creation via quick-add modal)
- Event deletion

## Validation
- [ ] Modal opens when clicking any day cell
- [ ] Modal opens with keyboard (Enter/Space on focused day cell)
- [ ] Start/end times are pre-filled correctly based on clicked day
- [ ] Category buttons toggle correctly and show selected state
- [ ] Form validates required fields (title)
- [ ] Event appears on calendar after successful creation
- [ ] Modal closes on successful creation
- [ ] Modal closes with Escape key
- [ ] Clicking event links does NOT open the modal
