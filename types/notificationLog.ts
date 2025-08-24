export interface NotificationLog {
  id?: number;
  action: string;
  action_from: string;
  notification_to: string;
  isNotification: boolean;
}

export interface NotificationLogContextType {
  logs: NotificationLog[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  addLog: (log: Omit<NotificationLog, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLog: (id: number, updates: Partial<NotificationLog>) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  getLogsByUser: (userId: string) => NotificationLog[];
  getUnreadLogs: (userId: string) => NotificationLog[];
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  
  // Real-time
  refreshLogs: () => Promise<void>;
}

