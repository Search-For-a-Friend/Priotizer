# Action Planning SPA - Specification Document

## Overview
A Single Page Application (SPA) for action planning based on time-based priorities. Users create actions (timeboxes) with target dates, and the system automatically organizes them into priority sections based on time intervals from the current date.

## Core Concepts

### Action
An action represents a task or goal with the following properties:
- **description** (text, mandatory): User-defined description of the action
- **creation_date** (date, mandatory): Automatically set when action is created
- **target_dates** (list of dates, mandatory): List of target dates for the action (evolves in Step 2)
- **labels** (optional): List of user-defined labels
- **status** (mandatory): One of `pending`, `completed`, `deleted` (auto-set)
- **completion_date** (optional): Date when action was completed (user-set)
- **index** (optional, Step 3): Used to differentiate actions with the same target date

### Time Interval
Predefined time intervals for setting target dates and grouping actions:
- Intervals are exact durations (not calendar-based):
  - **1 hour**: 1 hour
  - **half-day**: 12 hours
  - **1 day**: 24 hours
  - **3 days**: 72 hours
  - **1 week**: 168 hours (7 days)
  - **1 month**: 720 hours (30 days)
  - **6 months**: 4320 hours (180 days)
  - **1 year**: 8760 hours (365 days)
- Used to calculate target dates: `target_date = creation_date + interval`
- Used to filter actions: `is (target_date - current_date) < interval ?`

### Priority Sections
Actions are grouped into sections based on the time interval between current date and target date. Priority sections are **dynamic** based on the selected granularity.

**Priority Section Structure:**
- **Prio 0**: Target date is in the past (overdue actions) - always present
- **Prio 1**: Target date < granularity from now (e.g., < 1 hour if granularity = hour)
- **Prio 2**: Target date < next interval in enum (e.g., < half-day if granularity = hour)
- **Prio 3**: Target date < next interval in enum
- **Prio 4**: Target date < next interval in enum
- **Prio 5**: Target date < next interval in enum
- **Prio 6**: Target date < next interval in enum
- **Prio 7**: Target date < next interval in enum
- **Prio N**: Target date ≥ largest interval (1 year)

**Examples based on granularity:**

If granularity = **hour**:
- Prio 1: < 1 hour
- Prio 2: < half-day (12 hours)
- Prio 3: < 1 day
- Prio 4: < 3 days
- Prio 5: < 1 week
- Prio 6: < 1 month
- Prio 7: < 6 months
- Prio 8: < 1 year
- Prio 9: ≥ 1 year

If granularity = **half-day**:
- Prio 1: < half-day (12 hours)
- Prio 2: < 1 day
- Prio 3: < 3 days
- Prio 4: < 1 week
- Prio 5: < 1 month
- Prio 6: < 6 months
- Prio 7: < 1 year
- Prio 8: ≥ 1 year

If granularity = **day**:
- Prio 1: < 1 day
- Prio 2: < 3 days
- Prio 3: < 1 week
- Prio 4: < 1 month
- Prio 5: < 6 months
- Prio 6: < 1 year
- Prio 7: ≥ 1 year

Sections are displayed in order: Prio 0, Prio 1, Prio 2, ... (up to the final catch-all section)

### Granularity
Granularity is a global parameter that defines the precision of target dates and the lowest time interval managed in the list.

**Granularity Values:**
- **day**: Target date precision is date-only (no time component)
- **half-day**: Target date precision is 00:00 or 12:00
- **hour**: Target date precision is one hour (smallest possible granularity)

**Current default granularity**: day

**Granularity Behavior:**
- Target date precision is determined by the selected granularity
- Prio 1 section filters actions where `target_date - current_date < granularity`
- Subsequent Prio sections are dynamically generated based on next values in the time interval enum
- Priority sections adjust automatically when granularity changes
- Target dates are stored with full precision (including time) regardless of current granularity

**Changing Granularity:**
- **To finer granularity** (e.g., day → hour): No change to currently set target dates
- **To larger granularity** (e.g., hour → day): Automatically truncate target dates to the later granular date
  - Example: If target date was 23:00 and granularity changes to day → set to next day
  - Example: If target date was 01:00 of the same day and granularity changes to day → set to that day

---

## Step 1: Basic MVP

### Action Data Model
```typescript
interface Action {
  id: string;
  description: string;
  creation_date: Date;
  target_date: Date; // Single target date in Step 1
  labels?: string[];
  status: 'pending' | 'completed' | 'deleted';
  completion_date?: Date;
}
```

### Features

#### 1.1 Create Action
- User enters description (mandatory)
- User can:
  - Choose a time interval from predefined values (day, 3 days, week, month, 6 months, year)
  - OR directly set a target date
- If time interval is chosen: `target_date = creation_date + interval`
- Creation date is automatically set to current date (stored with full precision)
- Target date must be at least 1 granularity unit after creation date (enforced by interval selection or date picker)
- Target date is rounded to current granularity when set
- Status defaults to `pending`

#### 1.2 Action List View
- Main view displays all actions grouped by priority sections
- Each action is displayed as a card showing:
  - Description
  - Labels (if any)
  - Progress bar
- Creation date and target date are NOT visible in the card

#### 1.3 Priority Sections
List is split into sections (displayed in order):
- **Prio 0**: Actions with target date in the past (overdue)
- **Prio 1**: Actions with target date less than 1 day from current date
- **Prio 2**: Actions with target date less than 3 days from current date
- **Prio 3**: Actions with target date less than 1 week from current date
- **Prio 4**: Actions with target date less than 1 month from current date
- **Prio 5**: Actions with target date less than 6 months from current date
- **Prio 6**: Actions with target date less than 1 year from current date
- **Prio 7**: Actions with target date ≥ 1 year from current date

Actions within each section are sorted by target date (earliest first).

#### 1.4 Progress Bar
- Visual progress bar on each action card
- Calculation: `progress = (current_date - creation_date) / (target_date - creation_date) * 100`
- Displayed as percentage (0-100%)
- If target date is in the past:
  - Progress bar is full (100%)
  - Color code (red) indicates the action is overdue
  - Action appears in Prio 0 section
  - User should re-priorize or delete the action
- If target date is in the future: show actual progress

#### 1.5 Labels
- Optional feature for categorizing actions
- Users can create labels on-the-fly (no predefined list)
- Multiple labels can be assigned to an action
- Labels are user-defined text values

---

## Step 2: Multiple Target Dates

### Action Data Model (Updated)
```typescript
interface Action {
  id: string;
  description: string;
  creation_date: Date;
  target_dates: Date[]; // Changed from single date to list
  labels?: string[];
  status: 'pending' | 'completed' | 'deleted';
  completion_date?: Date;
}
```

### Features

#### 2.1 Multiple Target Dates
- When creating an action, the first target date is set (as in Step 1)
- Target dates are stored as a list, maintaining chronological order
- The most recent target date (last in list) determines the current priority section

#### 2.2 Move Actions Between Sections
- Users can drag and drop actions between priority sections
- **Rules**:
  - Actions can only be moved DOWN (to lower priority sections / farther target dates)
  - Actions cannot be moved UP (to higher priority sections)
  - Actions cannot be moved within the same section
- **Behavior when moving down**:
  - When moving from Prio X to Prio Y (where Y > X):
    - Calculate new target date: `current_date + interval_of_Prio_Y`
    - Append this new target date to the end of the `target_dates` list
    - Action is placed at the last position of the destination section
  - Example: Moving from Prio 2 (3 days) to Prio 3 (1 week) adds target date = current_date + 1 week

#### 2.3 Enhanced Progress Bar
- Progress bar visualizes the timeline from current date to target date
- If there is a previous target date in the list (only the most recent one):
  - Show a vertical marker (pipe) on the progress bar at the position of the previous target date
  - Use different background/fill colors for progress before and after the previous target date
  - This helps visualize the history of deadline extensions
- Only 1 previous target date is visible (the most recent one before the current target date)

---

## Step 3: Reordering Within Sections

### Action Data Model (Updated)
```typescript
interface Action {
  id: string;
  description: string;
  creation_date: Date;
  target_dates: Date[];
  labels?: string[];
  status: 'pending' | 'completed' | 'deleted';
  completion_date?: Date;
  order_key?: number; // Integer ordering key for position within section
}
```

### Features

#### 3.1 Move Actions Within Sections
- Users can now reorder actions within the same priority section
- Drag and drop to position actions between other actions

#### 3.2 Target Date Calculation on Reorder
**Approach: Integer Ordering Key**

When an action is moved (within a section or between sections):

**Priority Section Membership:**
- **Source of truth**: Current target date (most recent in target_dates list)
- **Changes when**: Only when its target date changes (via interval selection or drag-and-drop)
- Action belongs to the section corresponding to: `target_date - current_date`

**Position Within Section:**
- **Source of truth**: `order_key` (number)
- **Changes when**: When the user reorders the action or when a new action is created
- Actions within a section are sorted by (target_date, order_key) ascending

**New Action Creation:**
- When a new action is created, its `order_key` is determined from its target date:
  - Find the maximum `order_key` among all actions with the same target date
  - Set the new action's `order_key` to that maximum + 1
  - Increment `order_key` by 1 for all actions with later target dates

**Example:**
- Action A: target_date = 2026-10-15, order_key = 0
- Action B: target_date = 2026-10-15, order_key = 1
- Action C: target_date = 2026-10-16, order_key = 0
- Action D: target_date = 2026-10-17, order_key = 0
- New Action E created with target_date = 2026-10-15:
  - Max order_key for 2026-10-15 is 1 (Action B)
  - Set Action E's order_key = 2
  - Increment order_keys for later target dates:
    - Action C: order_key = 1 (was 0)
    - Action D: order_key = 2 (was 0)
- Result: A(0), B(1), E(2), C(1), D(2) sorted by (target_date, order_key)

**Reordering Algorithm:**
1. When moving an action to a new position:
   - Identify the target date of the position (next action's target date or section's interval)
   - Set the moved action's target date to match (if different)
   - Calculate new `order_key` based on position within that target date group
   - Adjust `order_keys` of affected actions (increment/decrement as needed)

**Benefits of Integer Ordering Key:**
- Simple and predictable ordering
- Easy to implement and debug
- No precision issues or floating-point concerns
- Clear separation between target date groups

---

## Step 4: Bidirectional Movement

### Features

#### 4.1 Move Actions Up or Down
- Users can now move actions in BOTH directions:
  - **Down**: To lower priority sections (farther target dates)
  - **Up**: To higher priority sections (earlier target dates)

#### 4.2 Moving Up Behavior
**Approach: Integer Ordering Key (same as Step 3)**

When moving an action UP (to a higher priority section):

**Target Date Change:**
- Set a new target date EARLIER than the current target date
- The new target date is calculated based on the destination section's interval
- Example: Moving from Prio 3 to Prio 2 sets target_date = current_date + 3 days
- Append this new target date to the `target_dates` list

**Order Key Assignment:**
- Calculate a new `order_key` based on the position within the destination section
- Use the same integer ordering logic as in Step 3 (increment/decrement affected actions)

**Example:**
- Action A: target_date = 2026-10-20, order_key = 0 (in Prio 4)
- Action B: target_date = 2026-10-20, order_key = 1 (in Prio 4)
- User moves Action A to Prio 2 (3 days):
  - Set new target_date = current_date + 3 days (e.g., 2026-10-13)
  - Append to target_dates: [2026-10-13, 2026-10-20]
  - Set order_key based on position in Prio 2 section (e.g., 0 if first action)
  - Decrement order_keys of actions in Prio 4 that were after Action A

#### 4.3 Target Date Cleanup
- When moving UP, if the new target date is SOONER than some existing target dates in the list:
  - Remove ALL target dates that are later than the new target date
  - Reason: These later dates would not show in the progress bar and have no meaning
- The `target_dates` list is truncated to only keep dates ≤ new target date
- The new target date is appended to the end of the cleaned list

**Example**:
- Action has target_dates: [2026-10-10, 2026-10-15, 2026-10-20]
- User moves UP to set new target date = 2026-10-12
- Result: target_dates = [2026-10-10, 2026-10-12] (2026-10-15 and 2026-10-20 are removed)

---

## Status Management

### Action Status Transitions
Actions have three possible statuses: `pending`, `completed`, `deleted`
- **pending**: Default status for new actions
- **completed**: Set by user action (button on action card)
  - When set to completed: `completion_date` is automatically set to current date
  - Completed actions are shown in a dedicated section after all Prio sections
  - Progress bar value is percentage between creation / completion date / target date (does not continue to update based on current date)
- **deleted**: Set by user action (button on action card)
  - Soft delete: action is not removed from data, status is changed to `deleted`
  - Deleted actions are shown in a dedicated "Trash" section after the Completed section
  - Progress bar and other information are still visible in Trash section

### Action Card Buttons
Each action card includes action buttons:
- **Complete**: Marks action as completed, sets completion_date to current date
- **Delete**: Marks action as deleted (soft delete)

---

## Data Persistence

### Persistence Layer
- Data is written to a `.json` file for local use
- Create an interface for the persistence layer to allow future migration to:
  - Backend API
  - Database integration
  - Different data models
- The persistence interface should abstract the storage mechanism

---

## Granularity Implementation Notes

### Technical Implications
The granularity feature has the following technical requirements:

**Data Storage:**
- Target dates must be stored with full precision (datetime, not just date)
- Granularity setting must be persisted as a global configuration parameter

**Rounding/Truncation Logic:**
- Function to round target dates to current granularity when set
- Function to truncate target dates when granularity changes to larger values
- Example truncation rules:
  - hour → day: 23:00 → next day, 01:00 → same day
  - hour → half-day: 01:00 → 00:00, 13:00 → 12:00
  - half-day → day: 12:00 → next day, 00:00 → same day

**UI Considerations:**
- Date/time picker must respect current granularity
- When granularity = day: show date picker only
- When granularity = half-day: show date + AM/PM selector
- When granularity = hour: show full datetime picker

**Granularity Change Handling:**
- When user changes granularity:
  - If finer: no data changes needed, priority sections expand to include finer intervals
  - If larger: automatically truncate all target dates to new granularity, priority sections collapse
  - Show confirmation dialog before truncation (data loss warning)
- Priority sections are dynamically recalculated based on new granularity

---

## Open Questions & Clarifications Needed

### 1. Step 3 & 4: Reordering and Index Handling
**RESOLVED**: Using integer ordering key approach.

**Summary:**
- Priority section membership: determined by target date (source of truth)
- Position within section: determined by `order_key` (number)
- New action creation: order_key = max(order_key of same target date) + 1, increment all later target dates
- When reordering: adjust order_keys with increment/decrement of affected actions
- This approach simplifies reordering logic with predictable integer values

**Remaining Technical Considerations:**
- Performance implications of incrementing order_keys for all actions with later target dates on creation
- Order_key overflow protection (if many actions are created)
- Batch order_key updates when moving actions between sections

---

## Development Phases

### Phase 1: Step 1 MVP
- Basic action creation
- Single target date
- Priority sections (read-only)
- Progress bar
- Basic list view

### Phase 2: Step 2 Enhancement
- Multiple target dates
- Move actions between sections (down only)
- Enhanced progress bar with history

### Phase 3: Step 3 Reordering
- Move actions within sections
- Index field implementation
- Target date calculation on reorder

### Phase 4: Step 4 Bidirectional
- Move actions up
- Target date cleanup
- Full drag-and-drop functionality

### Phase 5: Polish & Additional Features
- Label management (user-created on-the-fly)
- Action completion/deletion workflows
- Data persistence (JSON file with persistence interface)
- UI/UX improvements
- Testing & bug fixes

### Phase 6: Reordering & Bidirectional Movement
- Detailed implementation of Step 3 (reordering within sections)
- Detailed implementation of Step 4 (bidirectional movement)
- Based on REORDERING_SPEC.md (to be created)

---

## Success Criteria

### Step 1
- [ ] Users can create actions with description and target date
- [ ] Actions display in correct priority sections (Prio 0-7)
- [ ] Progress bar shows accurate completion percentage
- [ ] Overdue actions (Prio 0) show red color code
- [ ] Labels can be created on-the-fly and assigned to actions

### Step 2
- [ ] Actions have multiple target dates
- [ ] Moving actions down adds new target dates
- [ ] Progress bar shows previous target date marker (only 1 previous)
- [ ] Progress bar uses different colors before/after previous target date

### Step 3
- [ ] Actions can be reordered within sections
- [ ] Target dates and indices are calculated correctly on reorder
- [ ] Implementation based on REORDERING_SPEC.md

### Step 4
- [ ] Actions can be moved up and down
- [ ] Moving up removes obsolete target dates
- [ ] Full drag-and-drop functionality works smoothly
- [ ] Implementation based on REORDERING_SPEC.md

### Additional Features
- [ ] Complete and Delete buttons on action cards
- [ ] Completed actions shown in dedicated section
- [ ] Deleted actions shown in Trash section
- [ ] Data persisted to JSON file
- [ ] Persistence interface defined for future migration

---

## User Stories

### US1: Create Action
As a user, I want to create an action with a description and target date so that I can track my tasks.

### US2: View Prioritized List
As a user, I want to see my actions organized by priority so that I can focus on urgent tasks first.

### US3: Track Progress
As a user, I want to see a progress bar for each action so that I know how much time has passed.

### US4: Extend Deadline
As a user, I want to move an action to a lower priority section so that I can extend its deadline.

### US5: Reorder Actions
As a user, I want to reorder actions within a section so that I can prioritize them.

### US6: Shorten Deadline
As a user, I want to move an action to a higher priority section so that I can bring it forward.

### US7: View Deadline History
As a user, I want to see previous target dates on the progress bar so that I can track deadline changes.

### US8: Complete Action
As a user, I want to mark an action as completed so that it moves to a dedicated section.

### US9: Delete Action
As a user, I want to delete an action so that it moves to a trash section (soft delete).

---

## Mock UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Action Planner                              [+ New]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔴 Prio 0 - Overdue                                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Overdue task                         [Label1]      │ │
│  │ ████████████████████████████ 100% [RED]           │ │
│  │ [Complete] [Delete]                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟠 Prio 1                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Urgent task                           [Label2]    │ │
│  │ ████████████░░░░░░░░░░░░░░ 60%                    │ │
│  │ [Complete] [Delete]                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟡 Prio 2                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Medium priority task               [Label1]       │ │
│  │ ██████░░░░░░░░░░░░░░░░░░░░ 30%                     │ │
│  │ [Complete] [Delete]                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟢 Prio 3                                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Weekly goal                           [Label2]    │ │
│  │ ███░░░░░░░░░░░░░░░░░░░░░░░ 15%                      │ │
│  │ [Complete] [Delete]                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ... Prio 4, 5, 6, 7 ...                                │
│                                                         │
│  ✅ Completed                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Finished task                         [Label3]    │ │
│  │ ████████████████████░░░░ 80%                      │ │
│  │ Completed on: 2026-10-10                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🗑️ Trash                                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Deleted task                          [Label1]     │ │
│  │ ████████████████████░░░░ 80%                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Create REORDERING_SPEC.md** to study detailed behavior for:
   - Step 3: Reordering actions within sections (target date calculation, index handling)
   - Step 4: Moving actions up (target date calculation, index handling)
2. **Review and approve** this specification document
3. **Create wireframes** for each step
4. **Set up development environment** and project structure
5. **Implement Step 1** as MVP
6. **Iterate through Steps 2-4** based on user feedback
