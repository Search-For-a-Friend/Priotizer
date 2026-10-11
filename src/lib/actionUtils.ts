import type { Action, Granularity } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createAction(
  description: string,
  targetDate: Date,
  labels: string[] = [],
  existingActions: Action[]
): Action {
  const now = new Date();
  const roundedTargetDate = roundToGranularity(targetDate, 'day'); // Default to day granularity
  
  // Calculate order_key
  const sameTargetActions = existingActions.filter(
    a => a.target_dates[a.target_dates.length - 1].getTime() === roundedTargetDate.getTime()
  );
  
  const maxOrderKey = sameTargetActions.length > 0 
    ? Math.max(...sameTargetActions.map(a => a.order_key || 0))
    : -1;
  
  const newOrderKey = maxOrderKey + 1;
  
  return {
    id: generateId(),
    description,
    creation_date: now,
    target_dates: [roundedTargetDate],
    labels,
    status: 'pending',
    order_key: newOrderKey,
  };
}

export function roundToGranularity(date: Date, granularity: Granularity): Date {
  const hours = granularity === 'hour' ? 1 : granularity === 'half-day' ? 12 : 24;
  const rounded = new Date(date);
  rounded.setMilliseconds(0);
  rounded.setSeconds(0);
  rounded.setMinutes(0);
  
  if (hours === 1) {
    // Hour: keep as is
  } else if (hours === 12) {
    // Half-day: round to 00:00 or 12:00
    const hour = rounded.getHours();
    rounded.setHours(hour < 12 ? 0 : 12);
  } else {
    // Day: round to start of day
    rounded.setHours(0);
  }
  
  return rounded;
}

export function moveAction(
  action: Action,
  newTargetDate: Date,
  newPosition: number,
  allActions: Action[]
): Action[] {
  const roundedTargetDate = roundToGranularity(newTargetDate, 'day');
  
  // Update the action's target date
  const updatedAction: Action = {
    ...action,
    target_dates: [...action.target_dates, roundedTargetDate],
  };
  
  // Calculate new order_key based on position
  const sameTargetActions = allActions.filter(
    a => a.id !== action.id && 
         a.target_dates[a.target_dates.length - 1].getTime() === roundedTargetDate.getTime()
  );
  
  let newOrderKey: number;
  if (newPosition === 0) {
    // First position
    newOrderKey = 0;
  } else if (newPosition >= sameTargetActions.length) {
    // Last position
    const maxOrderKey = sameTargetActions.length > 0 
      ? Math.max(...sameTargetActions.map(a => a.order_key || 0))
      : -1;
    newOrderKey = maxOrderKey + 1;
  } else {
    // Middle position
    const beforeAction = sameTargetActions[newPosition - 1];
    const beforeKey = beforeAction?.order_key || 0;
    newOrderKey = beforeKey + 1;
  }
  
  updatedAction.order_key = newOrderKey;
  
  // Adjust order_keys of affected actions
  return allActions.map(a => {
    if (a.id === action.id) {
      return updatedAction;
    }
    
    const aTargetDate = a.target_dates[a.target_dates.length - 1];
    const isSameTarget = aTargetDate.getTime() === roundedTargetDate.getTime();
    
    if (isSameTarget && (a.order_key || 0) >= newOrderKey) {
      return { ...a, order_key: (a.order_key || 0) + 1 };
    }
    
    return a;
  });
}

export function completeAction(action: Action): Action {
  return {
    ...action,
    status: 'completed',
    completion_date: new Date(),
  };
}

export function deleteAction(action: Action): Action {
  return {
    ...action,
    status: 'deleted',
  };
}

export function cleanupTargetDates(action: Action, newTargetDate: Date): Action {
  const filteredDates = action.target_dates.filter(d => d <= newTargetDate);
  return {
    ...action,
    target_dates: [...filteredDates, newTargetDate],
  };
}
