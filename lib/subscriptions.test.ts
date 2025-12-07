
import {
    addSubscription,
    removeSubscription,
    getSubscriptions,
    clearAllSubscriptions,
    clearExpiredSubscriptions,
    PushSubscription
} from './subscriptions';

// Mock the logger to avoid polluting test output
jest.mock('./logger', () => ({
    notificationLogger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('Subscriptions Utility', () => {
    const mockSubscription: PushSubscription = {
        endpoint: 'https://example.com/push/123',
        keys: {
            p256dh: 'key1',
            auth: 'auth1'
        }
    };

    beforeEach(() => {
        // Clear subscriptions before each test
        clearAllSubscriptions();
    });

    it('should add a new subscription', () => {
        const count = addSubscription(mockSubscription, new Date().toISOString());
        expect(count).toBe(1);

        const subs = getSubscriptions();
        expect(subs).toHaveLength(1);
        expect(subs[0].subscription).toEqual(mockSubscription);
    });

    it('should update an existing subscription', () => {
        addSubscription(mockSubscription, new Date().toISOString());

        // Add same subscription again (should update timestamp/object but not increase count)
        const count = addSubscription(mockSubscription, new Date().toISOString());
        expect(count).toBe(1);

        const subs = getSubscriptions();
        expect(subs).toHaveLength(1);
    });

    it('should remove a subscription', () => {
        addSubscription(mockSubscription, new Date().toISOString());
        expect(getSubscriptions()).toHaveLength(1);

        const count = removeSubscription(mockSubscription.endpoint);
        expect(count).toBe(0);
        expect(getSubscriptions()).toHaveLength(0);
    });

    it('should handle removing non-existent subscription', () => {
        addSubscription(mockSubscription, new Date().toISOString());

        const count = removeSubscription('https://example.com/other');
        expect(count).toBe(1); // Should remain 1
    });

    it('should clear expired subscriptions', () => {
        // Add expired subscription (8 days ago)
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 8);

        addSubscription(mockSubscription, oldDate.toISOString());

        // Add fresh subscription
        const freshSubscription = { ...mockSubscription, endpoint: 'https://example.com/fresh' };
        addSubscription(freshSubscription, new Date().toISOString());

        expect(getSubscriptions()).toHaveLength(2);

        const count = clearExpiredSubscriptions();
        expect(count).toBe(1);

        const subs = getSubscriptions();
        expect(subs[0].subscription.endpoint).toBe(freshSubscription.endpoint);
    });

    it('should clear all subscriptions', () => {
        addSubscription(mockSubscription, new Date().toISOString());
        addSubscription({ ...mockSubscription, endpoint: 'https://example.com/2' }, new Date().toISOString());

        expect(getSubscriptions()).toHaveLength(2);

        clearAllSubscriptions();
        expect(getSubscriptions()).toHaveLength(0);
    });
});
