import { prisma } from './prisma'
import { notificationLogger } from './logger'

// Type definitions
export interface PushSubscription {
    endpoint: string
    expirationTime?: number | null
    keys: {
        p256dh: string
        auth: string
    }
}

export interface SubscriptionRecord {
    subscription: PushSubscription
    timestamp: string
    userId?: string | null
    roles?: string[]
    status?: 'active' | 'inactive'
}

export interface SubscriptionInfo {
    index: number
    endpoint: string
    timestamp: string
    userId?: string | null
    roles?: string[]
}

export interface AllSubscriptionsInfo {
    total: number
    subscriptions: SubscriptionInfo[]
}

/**
 * Get all active subscriptions
 */
export const getSubscriptions = async (): Promise<SubscriptionRecord[]> => {
    const subs = await prisma.subscription.findMany({
        where: { status: 'active' },
        orderBy: { timestamp: 'desc' },
    })

    notificationLogger.debug(`Fetched ${subs.length} active subscriptions`)

    return subs.map(sub => ({
        subscription: {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
            },
        },
        timestamp: sub.timestamp.toISOString(),
        userId: sub.userId,
        roles: sub.roles,
        status: sub.status as 'active' | 'inactive',
    }))
}

/**
 * Get active subscriptions filtered by roles or user IDs
 */
export const getFilteredSubscriptions = async (
    roles?: string[],
    userIds?: string[]
): Promise<SubscriptionRecord[]> => {
    const allSubs = await getSubscriptions()

    if (!roles?.length && !userIds?.length) return allSubs

    return allSubs.filter(sub => {
        const matchesRole = roles?.length
            ? sub.roles?.some(role => roles.includes(role)) ?? false
            : false
        const matchesUser = userIds?.length
            ? sub.userId != null && userIds.includes(sub.userId)
            : false

        if (roles?.length && userIds?.length) return matchesRole || matchesUser
        if (roles?.length) return matchesRole
        if (userIds?.length) return matchesUser
        return false
    })
}

/**
 * Add or update a subscription (upsert by endpoint)
 */
export const addSubscription = async (
    subscription: PushSubscription,
    timestamp: string,
    userId?: string | null,
    roles?: string[]
): Promise<number> => {
    await prisma.subscription.upsert({
        where: { endpoint: subscription.endpoint },
        update: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userId: userId ?? null,
            roles: roles ?? [],
            status: 'active',
            timestamp: new Date(timestamp),
        },
        create: {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            userId: userId ?? null,
            roles: roles ?? [],
            status: 'active',
            timestamp: new Date(timestamp),
        },
    })

    notificationLogger.info(`Upserted subscription: ${subscription.endpoint.substring(0, 50)}...`)

    return prisma.subscription.count({ where: { status: 'active' } })
}

/**
 * Mark a subscription as inactive by endpoint
 */
export const removeSubscription = async (endpoint: string): Promise<number> => {
    const existing = await prisma.subscription.findUnique({ where: { endpoint } })

    if (existing) {
        await prisma.subscription.update({
            where: { endpoint },
            data: { status: 'inactive' },
        })
        notificationLogger.info(`Marked subscription as inactive: ${endpoint.substring(0, 50)}...`)
    } else {
        notificationLogger.warn(`Subscription not found for removal: ${endpoint.substring(0, 50)}...`)
    }

    return prisma.subscription.count({ where: { status: 'active' } })
}

/**
 * Mark subscriptions older than one week as inactive
 */
export const clearExpiredSubscriptions = async (): Promise<number> => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const result = await prisma.subscription.updateMany({
        where: {
            status: 'active',
            timestamp: { lt: oneWeekAgo },
        },
        data: { status: 'inactive' },
    })

    if (result.count > 0) {
        notificationLogger.info(`Cleared ${result.count} expired subscriptions`)
    }

    return prisma.subscription.count({ where: { status: 'active' } })
}

/**
 * Get summary info of all active subscriptions
 */
export const getAllSubscriptionsInfo = async (): Promise<AllSubscriptionsInfo> => {
    const subs = await getSubscriptions()
    return {
        total: subs.length,
        subscriptions: subs.map((sub, index) => ({
            index,
            endpoint: sub.subscription.endpoint.substring(0, 50) + '...',
            timestamp: sub.timestamp,
            userId: sub.userId,
            roles: sub.roles,
        })),
    }
}

/**
 * Mark all active subscriptions as inactive
 */
export const clearAllSubscriptions = async (): Promise<number> => {
    await prisma.subscription.updateMany({
        where: { status: 'active' },
        data: { status: 'inactive' },
    })
    notificationLogger.warn('All subscriptions cleared')
    return 0
}
