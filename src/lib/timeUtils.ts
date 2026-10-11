import type { Granularity } from '../types';
import { TIME_INTERVALS } from '../types';
import { addHours, differenceInHours, startOfDay, setHours } from 'date-fns';

export function getGranularityHours(granularity: Granularity): number {
  switch (granularity) {
    case 'hour':
      return 1;
    case 'half-day':
      return 12;
    case 'day':
      return 24;
  }
}

export function roundDateToGranularity(date: Date, granularity: Granularity): Date {
  const hours = getGranularityHours(granularity);
  
  if (hours === 1) {
    // Hour granularity: round to nearest hour
    return new Date(date);
  } else if (hours === 12) {
    // Half-day granularity: round to 00:00 or 12:00
    const hour = date.getHours();
    const roundedHour = hour < 12 ? 0 : 12;
    return setHours(startOfDay(date), roundedHour);
  } else {
    // Day granularity: round to start of day
    return startOfDay(date);
  }
}

export function truncateDateToGranularity(date: Date, granularity: Granularity): Date {
  const hours = getGranularityHours(granularity);
  const hour = date.getHours();
  
  if (hours === 1) {
    return new Date(date);
  } else if (hours === 12) {
    // Truncate to later granular date
    const roundedHour = hour < 12 ? 0 : 12;
    const rounded = setHours(startOfDay(date), roundedHour);
    // If the original time was after the rounded time, move to next period
    if (hour > 0 && hour < 12) {
      return rounded; // Keep at 00:00
    } else if (hour >= 12) {
      return rounded; // Keep at 12:00
    }
    return rounded;
  } else {
    // Day: if hour >= 12, move to next day
    if (hour >= 12) {
      return addHours(startOfDay(date), 24);
    }
    return startOfDay(date);
  }
}

export function getPrioritySections(granularity: Granularity): Array<{ name: string; maxHours: number }> {
  const granularityHours = getGranularityHours(granularity);
  const granularityIndex = TIME_INTERVALS.findIndex(ti => ti.hours === granularityHours);
  
  const sections = [
    { name: 'Prio 0 - Overdue', maxHours: 0 },
  ];
  
  // Add sections starting from granularity
  for (let i = granularityIndex; i < TIME_INTERVALS.length; i++) {
    sections.push({
      name: `Prio ${i - granularityIndex + 1}`,
      maxHours: TIME_INTERVALS[i].hours,
    });
  }
  
  // Add catch-all section
  sections.push({
    name: `Prio ${TIME_INTERVALS.length - granularityIndex + 1}`,
    maxHours: Infinity,
  });
  
  return sections;
}

export function getActionPrioritySection(action: { target_dates: Date[] }, granularity: Granularity, currentDate: Date): number {
  const targetDate = action.target_dates[action.target_dates.length - 1];
  const hoursDiff = differenceInHours(targetDate, currentDate);
  
  if (hoursDiff < 0) {
    return 0; // Overdue
  }
  
  const granularityHours = getGranularityHours(granularity);
  const granularityIndex = TIME_INTERVALS.findIndex(ti => ti.hours === granularityHours);
  
  for (let i = granularityIndex; i < TIME_INTERVALS.length; i++) {
    if (hoursDiff < TIME_INTERVALS[i].hours) {
      return i - granularityIndex + 1;
    }
  }
  
  return TIME_INTERVALS.length - granularityIndex + 1; // Catch-all
}

export function calculateProgress(creationDate: Date, targetDate: Date, currentDate: Date): number {
  const totalDuration = differenceInHours(targetDate, creationDate);
  const elapsed = differenceInHours(currentDate, creationDate);
  
  if (totalDuration <= 0) return 100;
  if (elapsed <= 0) return 0;
  
  const progress = (elapsed / totalDuration) * 100;
  return Math.min(Math.max(progress, 0), 100);
}
