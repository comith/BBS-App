export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

export interface CustomNotificationOptions extends NotificationOptions {
  customSound?: string;
  soundVolume?: number;
  delay?: number;
}

// Define NotificationAction type
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}
