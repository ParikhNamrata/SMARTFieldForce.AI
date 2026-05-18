
export interface InteractionLog {
  id: string;
  timestamp: string;
  userId: string;
  type: 'chat' | 'vision' | 'quiz' | 'order';
  content: any;
  summary: string;
}

export const dbService = {
  saveInteraction: async (log: Omit<InteractionLog, 'id' | 'timestamp'>) => {
    const newLog: InteractionLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    };

    const existingLogsStr = localStorage.getItem('smart_field_logs') || '[]';
    try {
      const logs = JSON.parse(existingLogsStr);
      logs.push(newLog);
      localStorage.setItem('smart_field_logs', JSON.stringify(logs));
      return newLog;
    } catch (e) {
      console.error('Failed to save to DB', e);
      return null;
    }
  },

  getLogs: (): InteractionLog[] => {
    const existingLogsStr = localStorage.getItem('smart_field_logs') || '[]';
    try {
      return JSON.parse(existingLogsStr);
    } catch {
      return [];
    }
  },

  clearLogs: () => {
    localStorage.removeItem('smart_field_logs');
  }
};
