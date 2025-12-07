import webpush from 'web-push';
import { getFilteredSubscriptions, removeSubscription } from './subscriptions';
import { notificationLogger } from './logger';

// Configure VAPID details
const vapidDetails = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BCVZmQM7FJ8nidZkk0x825ElILW7mtTm2xxe749klv4Rt8cDnOhlrQ8FWEuujpYKPZUF7i3L9z5HUREm6t4cZEE",
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: 'mailto:koronero93@gmail.com'
};

if (!vapidDetails.privateKey) {
    notificationLogger.warn('VAPID Private Key is missing. Push notifications will fail.');
}

try {
    if (vapidDetails.privateKey) {
        webpush.setVapidDetails(
            vapidDetails.subject,
            vapidDetails.publicKey,
            vapidDetails.privateKey
        );
    }
} catch (error: any) {
    notificationLogger.error('Failed to set VAPID details:', error.message);
}

/**
 * Send push notifications to targeted users
 * @param payload - Notification payload { title, body, icon, url, ... }
 * @param targetRoles - Array of roles to target
 * @param targetUserIds - Array of user IDs to target
 * @returns Result summary
 */
export async function sendNotificationToTargets(payload: any, targetRoles?: string[], targetUserIds?: string[]) {
    notificationLogger.info(`Sending notification: "${payload.title}"`);
    if (targetRoles) notificationLogger.info(`Target Roles: ${JSON.stringify(targetRoles)}`);
    if (targetUserIds) notificationLogger.info(`Target User IDs: ${JSON.stringify(targetUserIds)}`);

    const subscriptions = getFilteredSubscriptions(targetRoles, targetUserIds);
    
    if (subscriptions.length === 0) {
        notificationLogger.warn('No matching subscriptions found for targets');
        return { success: false, message: 'No matching subscriptions found', count: 0 };
    }

    const notificationPayload = JSON.stringify({
        title: payload.title || 'การแจ้งเตือน',
        body: payload.body || 'คุณมีข้อความใหม่',
        icon: payload.icon || '/favicon.ico',
        badge: '/favicon.ico',
        url: payload.url || '/',
        timestamp: Date.now(),
        data: payload.data || {}
    });

    const sendPromises = subscriptions.map(({ subscription }, index) => {
        return webpush.sendNotification(subscription, notificationPayload)
            .then(() => ({ success: true, index }))
            .catch((error: any) => {
                notificationLogger.error(`Error sending to sub ${index}: ${error.message}`);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    removeSubscription(subscription.endpoint);
                }
                return { success: false, error: error.message };
            });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    notificationLogger.info(`Results: ${successCount} success, ${failureCount} failed`);

    return {
        success: successCount > 0,
        message: `Sent to ${successCount}/${subscriptions.length} targets`,
        results: { total: subscriptions.length, success: successCount, failed: failureCount }
    };
}
