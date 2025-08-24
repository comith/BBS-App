//hoooks/alertNotification

import * as React from 'react';
import { useNotification } from './useNotification';
import { NotificationManager } from '@/utils/NotificationManager';

interface UseAlertNotificationOptions {
  enabled?: boolean;
  delay?: number;
  title?: string;
  body?: string;
}

export const useAlertNotification = () => {
  const { permission, isPushEnabled, loadNotificationSettings } = useNotification();

  const showAlert = React.useCallback(async (title: string, body: string) => {
    const notificationManager = NotificationManager.getInstance();
    const notificationSetting = loadNotificationSettings()?.isEnabled;
    
    await notificationManager.showNotification(
      permission,
      isPushEnabled,
      notificationSetting,
      title,
      body
    );
  }, [permission, isPushEnabled, loadNotificationSettings]);

  return showAlert;
};