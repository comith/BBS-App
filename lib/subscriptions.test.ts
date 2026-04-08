import {
    addSubscription,
    removeSubscription,
    getSubscriptions,
    clearAllSubscriptions,
    clearExpiredSubscriptions,
    PushSubscription
} from './subscriptions'

// Mock Prisma
jest.mock('./prisma', () => ({
    prisma: {
        subscription: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}))

jest.mock('./logger', () => ({
    notificationLogger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}))

import { prisma } from './prisma'

const mockSubscription: PushSubscription = {
    endpoint: 'https://example.com/push/123',
    keys: {
        p256dh: 'key1',
        auth: 'auth1',
    },
}

const makeDbSub = (overrides = {}) => ({
    id: 1,
    endpoint: mockSubscription.endpoint,
    p256dh: mockSubscription.keys.p256dh,
    auth: mockSubscription.keys.auth,
    userId: null,
    roles: [],
    status: 'active',
    timestamp: new Date(),
    updatedAt: new Date(),
    ...overrides,
})

describe('Subscriptions Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should add a new subscription', async () => {
        ;(prisma.subscription.upsert as jest.Mock).mockResolvedValue(makeDbSub())
        ;(prisma.subscription.count as jest.Mock).mockResolvedValue(1)

        const count = await addSubscription(mockSubscription, new Date().toISOString())
        expect(count).toBe(1)
        expect(prisma.subscription.upsert).toHaveBeenCalledTimes(1)
    })

    it('should get active subscriptions', async () => {
        ;(prisma.subscription.findMany as jest.Mock).mockResolvedValue([makeDbSub()])

        const subs = await getSubscriptions()
        expect(subs).toHaveLength(1)
        expect(subs[0].subscription.endpoint).toBe(mockSubscription.endpoint)
        expect(subs[0].status).toBe('active')
    })

    it('should map subscription keys correctly', async () => {
        ;(prisma.subscription.findMany as jest.Mock).mockResolvedValue([makeDbSub()])

        const subs = await getSubscriptions()
        expect(subs[0].subscription.keys.p256dh).toBe('key1')
        expect(subs[0].subscription.keys.auth).toBe('auth1')
    })

    it('should remove a subscription by marking it inactive', async () => {
        ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue(makeDbSub())
        ;(prisma.subscription.update as jest.Mock).mockResolvedValue(makeDbSub({ status: 'inactive' }))
        ;(prisma.subscription.count as jest.Mock).mockResolvedValue(0)

        const count = await removeSubscription(mockSubscription.endpoint)
        expect(count).toBe(0)
        expect(prisma.subscription.update).toHaveBeenCalledWith({
            where: { endpoint: mockSubscription.endpoint },
            data: { status: 'inactive' },
        })
    })

    it('should not call update when removing non-existent subscription', async () => {
        ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.subscription.count as jest.Mock).mockResolvedValue(1)

        const count = await removeSubscription('https://example.com/other')
        expect(count).toBe(1)
        expect(prisma.subscription.update).not.toHaveBeenCalled()
    })

    it('should clear expired subscriptions', async () => {
        ;(prisma.subscription.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
        ;(prisma.subscription.count as jest.Mock).mockResolvedValue(1)

        const count = await clearExpiredSubscriptions()
        expect(count).toBe(1)
        expect(prisma.subscription.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ status: 'active' }),
                data: { status: 'inactive' },
            })
        )
    })

    it('should clear all subscriptions', async () => {
        ;(prisma.subscription.updateMany as jest.Mock).mockResolvedValue({ count: 2 })

        const count = await clearAllSubscriptions()
        expect(count).toBe(0)
        expect(prisma.subscription.updateMany).toHaveBeenCalledWith({
            where: { status: 'active' },
            data: { status: 'inactive' },
        })
    })
})
