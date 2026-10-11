export type Granularity = 'hour' | 'half-day' | 'day';

export type ActionStatus = 'pending' | 'completed' | 'deleted';

export interface Action {
  id: string;
  description: string;
  creation_date: Date;
  target_dates: Date[];
  labels?: string[];
  status: ActionStatus;
  completion_date?: Date;
  order_key?: number;
}

export interface TimeInterval {
  name: string;
  hours: number;
}

export const TIME_INTERVALS: TimeInterval[] = [
  { name: '1 hour', hours: 1 },
  { name: 'half-day', hours: 12 },
  { name: '1 day', hours: 24 },
  { name: '3 days', hours: 72 },
  { name: '1 week', hours: 168 },
  { name: '1 month', hours: 720 },
  { name: '6 months', hours: 4320 },
  { name: '1 year', hours: 8760 },
];

export interface PrioritySection {
  name: string;
  maxHours: number;
  actions: Action[];
}

export interface AppData {
  actions: Action[];
  granularity: Granularity;
}
