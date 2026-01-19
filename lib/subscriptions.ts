
import { notificationLogger } from "./logger";
import { getSheetData, appendToSheet, updateSheet } from "@/app/api/config";

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
    userId?: string | null;
    roles?: string[];
    status?: 'active' | 'inactive';
    rowIndex?: number; // Added to track row index for updates
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

const SHEET_NAME = 'subscriptions';
const RANGE = `${SHEET_NAME}!A:G`;

// Cache to reduce API calls (optional, but good for read performance)
// We will still fetch fresh data on critical actions or use a short TTL if needed.
// For now, let's fetch fresh on every 'get' to be safe and stateless.

/**
 * Fetch all subscriptions from Google Sheet
 * @returns Array of subscription records
 */
async function fetchSubscriptionsFromSheet(): Promise<SubscriptionRecord[]> {
    try {
        const rows = await getSheetData(RANGE);
        if (!rows || rows.length === 0) return [];

        // Assuming row 0 is header? If A:G includes header, skip it.
        // Let's assume the user created a header row.
        const records: SubscriptionRecord[] = [];
        
        // Skip header if it looks like one (simple heuristic or just skip first row)
        // Adjust based on your sheet structure. Assuming first row is header.
        const startRow = 1; 

        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0]) continue; // Skip empty rows

            try {
                const subscription: PushSubscription = {
                    endpoint: row[0],
                    keys: {
                        p256dh: row[1],
                        auth: row[2]
                    }
                };

                // Check status (Col G / Index 6)
                const status = row[6] === 'inactive' ? 'inactive' : 'active';
                if (status === 'inactive') continue; // return only active ones by default? 
                                                     // Actually getSubscriptions usually implies active ones.

                // Parse Roles (Col E / Index 4)
                let roles: string[] = [];
                try {
                    roles = row[4] ? JSON.parse(row[4]) : [];
                } catch (e) {
                    // fallback if not json
                    roles = row[4] ? [row[4]] : [];
                }

                records.push({
                    subscription,
                    userId: row[3] || null,
                    roles: roles,
                    timestamp: row[5] || new Date().toISOString(),
                    status: status,
                    rowIndex: i + 1 // 1-based index for A1 notation
                });
            } catch (e) {
                notificationLogger.error(`Error parsing subscription row ${i + 1}:`, e);
            }
        }
        return records;
    } catch (error) {
        notificationLogger.error("Failed to fetch subscriptions from sheet:", error);
        return [];
    }
}


/**
 * Get all active subscriptions
 * @returns Array of subscription records
 */
export const getSubscriptions = async (): Promise<SubscriptionRecord[]> => {
    const subs = await fetchSubscriptionsFromSheet();
    notificationLogger.debug(`Fetched ${subs.length} active subscriptions`);
    return subs;
};

/**
 * Get active subscriptions filtered by roles or user IDs
 * @param roles - Array of roles to target
 * @param userIds - Array of user IDs to target
 * @returns Array of filtered subscription records
 */
export const getFilteredSubscriptions = async (roles?: string[], userIds?: string[]): Promise<SubscriptionRecord[]> => {
    const allSubs = await getSubscriptions();

    if (!roles && !userIds) return allSubs;

    return allSubs.filter(sub => {
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
export const addSubscription = async (
    subscription: PushSubscription,
    timestamp: string,
    userId?: string | null,
    roles?: string[]
): Promise<number> => {
    // 1. Fetch current to check for existence
    // We need to fetch ALL including inactive to reactivate if needed
    // But for simplicity, let's just append if not found in active list, 
    // or scanning full sheet is expensive.
    // Let's scan all rows to find endpoint match.
    
    // Optimization: Just read Column A to find index?
    // For now, fetch all is fine for small scale.
    
    // Converting fetchSubscriptionsFromSheet to return everything including inactive would be better for this check
    // But let's stick to functional correctness first.
    
    const rows = await getSheetData(RANGE);
    let existingRowIndex = -1;
    let existingRowData: any[] = [];
    
    // Simple loop to find endpoint
    if (rows && rows.length > 0) {
       for (let i = 0; i < rows.length; i++) {
           if (rows[i][0] === subscription.endpoint) {
               existingRowIndex = i + 1; // 1-based
               existingRowData = rows[i];
               break;
           }
       }
    }

    const rolesJson = JSON.stringify(roles || []);

    if (existingRowIndex !== -1) {
        // Update existing (Reactivate if needed)
        // Columns: A: Endpoint, B: P256dh, C: Auth, D: UserId, E: Roles, F: Timestamp, G: Status
        const updateRow = [
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            userId || existingRowData[3], // Maintain or Update? Usually update.
            rolesJson,
            timestamp,
            'active'
        ];

        // Update exact range
        await updateSheet(`${SHEET_NAME}!A${existingRowIndex}:G${existingRowIndex}`, [updateRow]);
        notificationLogger.info(`Updated existing subscription at row ${existingRowIndex}`);
    } else {
        // Append new
        const newRow = [
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            userId || "",
            rolesJson,
            timestamp,
            'active'
        ];
        await appendToSheet(RANGE, [newRow]);
        notificationLogger.info("Added new subscription to sheet");
    }

    // Return count of active subs
    const activeSubs = await getSubscriptions();
    return activeSubs.length;
};

/**
 * Remove a subscription by endpoint
 * @param endpoint - Subscription endpoint URL
 * @returns Total number of remaining subscriptions
 */
export const removeSubscription = async (endpoint: string): Promise<number> => {
    // Find row
    const rows = await getSheetData(RANGE);
    let rowIndex = -1;
    
    if (rows && rows.length > 0) {
       for (let i = 0; i < rows.length; i++) {
           if (rows[i][0] === endpoint) {
               rowIndex = i + 1;
               break;
           }
       }
    }

    if (rowIndex !== -1) {
        // Mark as inactive
        await updateSheet(`${SHEET_NAME}!G${rowIndex}`, [['inactive']]);
        notificationLogger.info(`Marked subscription at row ${rowIndex} as inactive`);
    } else {
        notificationLogger.warn(`Subscription not found for removal: ${endpoint.substring(0, 20)}...`);
    }

    const activeSubs = await getSubscriptions();
    return activeSubs.length;
};

/**
 * Clear subscriptions older than one week (Soft delete / Mark inactive)
 * @returns Total number of remaining subscriptions
 */
export const clearExpiredSubscriptions = async (): Promise<number> => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // We need to iterate and check timestamps
    // Optimization: Bulk update?
    
    const rows = await getSheetData(RANGE);
    if (!rows || rows.length === 0) return 0;

    const updates = [];
    let startRow = 1; // Assuming header

    for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;
        
        const timestamp = new Date(row[5]).getTime();
        const status = row[6];

        if (status !== 'inactive' && timestamp < oneWeekAgo) {
             const rowIndex = i + 1;
             updates.push({
                 range: `${SHEET_NAME}!G${rowIndex}`,
                 values: [['inactive']]
             });
        }
    }
    
    // Batch update via iterate? config.ts has batchUpdateSheet
    if (updates.length > 0) {
        // config.ts batchUpdateSheet takes {range, values}[]
        // But let's check if batchUpdateSheet supports multiple separate ranges.
        // Yes, api/config.ts: batchUpdateSheet takes updates array.
        
        await import('@/app/api/config').then(m => m.batchUpdateSheet(updates));
        notificationLogger.info(`Cleared ${updates.length} expired subscriptions`);
    }

    const activeSubs = await getSubscriptions();
    return activeSubs.length;
};

/**
 * Get information about all subscriptions
 * @returns Object with total count and subscription details
 */
export const getAllSubscriptionsInfo = async (): Promise<AllSubscriptionsInfo> => {
    const subs = await getSubscriptions();
    return {
        total: subs.length,
        subscriptions: subs.map((sub, index) => ({
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
export const clearAllSubscriptions = async (): Promise<number> => {
    // Dangerous!
    // Maybe just mark all inactive?
    // For test utility, let's skip implementation or just warn.
    notificationLogger.warn("clearAllSubscriptions called but not fully implemented for Sheet storage");
    return 0;
};
