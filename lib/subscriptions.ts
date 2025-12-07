// lib/subscriptions.ts - Push Notification Subscriptions Management

import { notificationLogger } from "./logger";

// Type definitions
export interface PushSubscription {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export interface SubscriptionRecord {
    subscription: PushSubscription;
    timestamp: string;
    userId?: string | null;  // Added userId
    roles?: string[];        // Added roles
}

export interface SubscriptionInfo {
    index: number;
    endpoint: string;
    timestamp: string;
    userId?: string | null;
    roles?: string[];
}

export interface AllSubscriptionsInfo {
    total: number;
    subscriptions: SubscriptionInfo[];
}

// In-memory storage for subscriptions
let subscriptions: SubscriptionRecord[] = [];

/**
 * Get all active subscriptions
 * @returns Array of subscription records
 */
export const getSubscriptions = (): SubscriptionRecord[] => {
    notificationLogger.debug(`Current subscriptions count: ${subscriptions.length}`);
    return subscriptions;
};

/**
 * Get active subscriptions filtered by roles or user IDs
 * @param roles - Array of roles to target
 * @param userIds - Array of user IDs to target
 * @returns Array of filtered subscription records
 */
export const getFilteredSubscriptions = (roles?: string[], userIds?: string[]): SubscriptionRecord[] => {
    if (!roles && !userIds) return subscriptions;

    return subscriptions.filter(sub => {
        const matchesRole = roles ? sub.roles?.some(role => roles.includes(role)) : false;
        const matchesUser = userIds ? sub.userId && userIds.includes(sub.userId) : false;
        
        if (roles && userIds) return matchesRole || matchesUser;
        if (roles) return matchesRole;
        if (userIds) return matchesUser;
        return false;
    });
};

/**
 * Add or update a subscription
 * @param subscription - Push subscription object
 * @param timestamp - ISO timestamp string
 * @param userId - Optional User ID
 * @param roles - Optional User Roles
 * @returns Total number of subscriptions
 */
export const addSubscription = (
    subscription: PushSubscription,
    timestamp: string,
    userId?: string | null,
    roles?: string[]
): number => {
    const existingIndex = subscriptions.findIndex(
        (sub) => sub.subscription.endpoint === subscription.endpoint
    );

    if (existingIndex !== -1) {
        // Update existing subscription with new data (including potentially new user/role info)
        subscriptions[existingIndex] = { 
            subscription, 
            timestamp,
            userId: userId || subscriptions[existingIndex].userId, // Keep existing if not provided
            roles: roles || subscriptions[existingIndex].roles       // Keep existing if not provided
        };
        notificationLogger.info("Updated existing subscription");
    } else {
        subscriptions.push({ 
            subscription, 
            timestamp,
            userId: userId || null,
            roles: roles || []
        });
        notificationLogger.info("Added new subscription");
    }

    notificationLogger.debug(`Total subscriptions: ${subscriptions.length}`);
    notificationLogger.debug(
        "Subscription endpoint:",
        subscription.endpoint.substring(0, 50) + "..."
    );
    if (userId) notificationLogger.debug(`User ID associated: ${userId}`);

    return subscriptions.length;
};

/**
 * Remove a subscription by endpoint
 * @param endpoint - Subscription endpoint URL
 * @returns Total number of remaining subscriptions
 */
export const removeSubscription = (endpoint: string): number => {
    const index = subscriptions.findIndex(
        (sub) => sub.subscription.endpoint === endpoint
    );

    if (index !== -1) {
        subscriptions.splice(index, 1);
        notificationLogger.info("Removed subscription");
    }

    return subscriptions.length;
};

/**
 * Clear subscriptions older than one week
 * @returns Total number of remaining subscriptions
 */
export const clearExpiredSubscriptions = (): number => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const initialLength = subscriptions.length;

    subscriptions = subscriptions.filter((sub) => {
        const timestamp = new Date(sub.timestamp).getTime();
        return timestamp > oneWeekAgo;
    });

    const clearedCount = initialLength - subscriptions.length;
    if (clearedCount > 0) {
        notificationLogger.info(`Cleared ${clearedCount} expired subscriptions`);
    }

    return subscriptions.length;
};

/**
 * Get information about all subscriptions
 * @returns Object with total count and subscription details
 */
export const getAllSubscriptionsInfo = (): AllSubscriptionsInfo => {
    return {
        total: subscriptions.length,
        subscriptions: subscriptions.map((sub, index) => ({
            index,
            endpoint: sub.subscription.endpoint.substring(0, 50) + "...",
            timestamp: sub.timestamp,
            userId: sub.userId,
            roles: sub.roles
        })),
    };
};

/**
 * Clear all subscriptions (useful for testing)
 * @returns Number of subscriptions cleared
 */
export const clearAllSubscriptions = (): number => {
    const count = subscriptions.length;
    subscriptions = [];
    notificationLogger.warn(`Cleared all ${count} subscriptions`);
    return count;
};
