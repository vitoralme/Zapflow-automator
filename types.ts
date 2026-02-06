export interface Contact {
  id: string;
  name: string;
  phone: string; // Raw phone number or link
  customMessage: string;
  status: 'pending' | 'ready' | 'sent' | 'skipped';
  lastActionTime?: number;
}

export interface AppState {
  contacts: Contact[];
  delaySeconds: number;
  isRunning: boolean;
  currentContactIndex: number;
  nextRunTime: number | null; // Timestamp
}

export enum GeminiModel {
  FLASH = 'gemini-3-flash-preview',
}