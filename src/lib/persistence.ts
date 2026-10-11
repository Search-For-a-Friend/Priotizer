import type { AppData } from '../types';

const DATA_FILE = 'actions.json';

const DEFAULT_DATA: AppData = {
  actions: [],
  granularity: 'day',
};

export class Persistence {
  private data: AppData = DEFAULT_DATA;

  async load(): Promise<AppData> {
    try {
      const response = await fetch(DATA_FILE);
      if (response.ok) {
        this.data = await response.json();
        // Convert date strings back to Date objects
        this.data.actions = this.data.actions.map(action => ({
          ...action,
          creation_date: new Date(action.creation_date),
          target_dates: action.target_dates.map(d => new Date(d)),
          completion_date: action.completion_date ? new Date(action.completion_date) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      this.data = DEFAULT_DATA;
    }
    return this.data;
  }

  async save(data: AppData): Promise<void> {
    this.data = data;
    try {
      const response = await fetch(DATA_FILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, null, 2),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      // For local development without a server, we'll use localStorage as fallback
      localStorage.setItem('priotizer_data', JSON.stringify(data));
    }
  }

  getData(): AppData {
    return this.data;
  }
}

export const persistence = new Persistence();
