// services/notificationLogService.ts
import { NotificationLog } from '../types/notificationLog';

export class NotificationLogService {
  private static instance: NotificationLogService;
  
  private constructor() {}
  
  static getInstance(): NotificationLogService {
    if (!NotificationLogService.instance) {
      NotificationLogService.instance = new NotificationLogService();
    }
    return NotificationLogService.instance;
  }

  async fetchLogs(): Promise<NotificationLog[]> {
    try {
      const response = await fetch('/api/notification-logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      throw error;
    }
  }

  async createLog(log: Omit<NotificationLog, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationLog> {
    try {
      const response = await fetch('/api/notification-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      if (!response.ok) throw new Error('Failed to create log');
      return await response.json();
    } catch (error) {
      console.error('Error creating notification log:', error);
      throw error;
    }
  }

  async updateLog(id: number, updates: Partial<NotificationLog>): Promise<NotificationLog> {
    try {
      const response = await fetch(`/api/notification-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update log');
      return await response.json();
    } catch (error) {
      console.error('Error updating notification log:', error);
      throw error;
    }
  }

  async deleteLog(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/notification-logs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete log');
    } catch (error) {
      console.error('Error deleting notification log:', error);
      throw error;
    }
  }
}
