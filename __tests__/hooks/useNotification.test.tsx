// __tests__/hooks/useNotification.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotification } from '@/hooks/useNotification';

// Mock fetch globally
global.fetch = jest.fn();

describe('useNotification', () => {
  // Store originals
  const originalNotification = window.Notification;
  const originalNavigator = window.navigator;
  // Note: We don't need to store PushManager usually as it might be undefined in JSDOM

  beforeAll(() => {
    // navigator is often read-only, so we redefine it
    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: jest.fn(),
          getRegistration: jest.fn(),
          ready: Promise.resolve(),
        },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)',
      },
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    // Restore
    if (originalNotification) {
      window.Notification = originalNotification;
    }
    
    try {
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
    } catch (e) {
        console.warn('Could not restore navigator');
    }

    // Clean up PushManager if we messed with it
    // @ts-ignore
    delete window.PushManager;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Reset ServiceWorker Mocks
    const mockSubscribe = jest.fn().mockResolvedValue({
        endpoint: 'https://test-endpoint.com',
        toJSON: () => ({ endpoint: 'https://test-endpoint.com' }),
        unsubscribe: jest.fn().mockResolvedValue(true),
    });

    const mockPushManager = {
        subscribe: mockSubscribe,
        getSubscription: jest.fn().mockResolvedValue(null),
    };

    const mockServiceWorkerRegistration = {
        pushManager: mockPushManager,
        showNotification: jest.fn().mockResolvedValue(undefined),
    };

    (window.navigator.serviceWorker.register as jest.Mock).mockResolvedValue(mockServiceWorkerRegistration);
    (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue(null);

    // Mock Notification
    try {
        // @ts-ignore
        delete window.Notification; 
    } catch (e) {}

    window.Notification = {
        permission: 'default',
        requestPermission: jest.fn(),
    } as any;

    // Mock PushManager explicitly as it is required by canUseNotification
    // @ts-ignore
    window.PushManager = {};
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.permission).toBe('default');
    expect(result.current.isPushEnabled).toBe(false);
    expect(result.current.isMobile).toBe(true);
  });

  it('should request permission and subscribe successfully', async () => {
    (window.Notification.requestPermission as jest.Mock).mockResolvedValue('granted');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.requestPermission();
    });

    expect(success).toBe(true);
    expect(result.current.permission).toBe('granted');
    expect(window.Notification.requestPermission).toHaveBeenCalled();
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(result.current.isPushEnabled).toBe(true);
  });

  it('should handle permission denied', async () => {
    (window.Notification.requestPermission as jest.Mock).mockResolvedValue('denied');

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.requestPermission();
    });

    expect(success).toBe(false);
    expect(result.current.permission).toBe('denied');
  });

  it('should restore existing subscription on mount', async () => {
    localStorage.setItem(
      'bbs_notification_settings',
      JSON.stringify({
        isEnabled: true,
        enabledAt: new Date().toISOString(),
      })
    );

    window.Notification.permission = 'granted';

    const mockSubscription = {
      endpoint: 'https://restored-endpoint.com',
      unsubscribe: jest.fn().mockResolvedValue(true),
    };

    (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue({
      pushManager: {
        getSubscription: jest.fn().mockResolvedValue(mockSubscription),
      },
    });

    const { result } = renderHook(() => useNotification());

    await waitFor(() => {
      expect(result.current.isPushEnabled).toBe(true);
    });
  });

  it('should unsubscribe successfully', async () => {
    // Setup active state
    const mockUnsubscribe = jest.fn().mockResolvedValue(true);
    const mockSubscription = {
      endpoint: 'https://test.com',
      unsubscribe: mockUnsubscribe,
    };

    localStorage.setItem('bbs_notification_settings', JSON.stringify({ isEnabled: true }));
    window.Notification.permission = 'granted';
    
    (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue({
      pushManager: { getSubscription: jest.fn().mockResolvedValue(mockSubscription) },
    });

    const { result } = renderHook(() => useNotification());
    await waitFor(() => expect(result.current.isPushEnabled).toBe(true));

    let success;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(true);
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(result.current.isPushEnabled).toBe(false);
  });

  it('should fail to unsubscribe if error occurs', async () => {
    const mockUnsubscribe = jest.fn().mockRejectedValue(new Error('Fail'));
    const mockSubscription = {
      endpoint: 'https://test.com',
      unsubscribe: mockUnsubscribe,
    };

    localStorage.setItem('bbs_notification_settings', JSON.stringify({ isEnabled: true }));
    window.Notification.permission = 'granted';
    
    (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue({
      pushManager: { getSubscription: jest.fn().mockResolvedValue(mockSubscription) },
    });

    const { result } = renderHook(() => useNotification());
    await waitFor(() => expect(result.current.isPushEnabled).toBe(true));

    let success;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(false);
  });

  it('should return false when unsubscribing if not subscribed', async () => {
    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(false);
  });

  it('should send local notification via ServiceWorker', async () => {
    window.Notification.permission = 'granted';

    const mockShow = jest.fn();
    (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue({
      showNotification: mockShow,
    });

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendLocalNotification('Title', 'Body');
    });

    expect(success).toBe(true);
    expect(mockShow).toHaveBeenCalledWith('Title', expect.objectContaining({ body: 'Body' }));
  });

  it('should send local notification via new Notification if SW missing', async () => {
     // Mock Notification Constructor
     const mockConstructor = jest.fn();
     // Redefine Notification as class/function
     const MockNotification = function(title: string, options: any) {
         mockConstructor(title, options);
     } as any;
     MockNotification.permission = 'granted';
     
     window.Notification = MockNotification;
     
     // Mock no registration
     (window.navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendLocalNotification('Title', 'Body');
    });

    expect(success).toBe(true);
    expect(mockConstructor).toHaveBeenCalled();
  });

  it('should not send local notification if permission denied', async () => {
    window.Notification.permission = 'denied';

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendLocalNotification('Title', 'Body');
    });

    expect(success).toBe(false);
  });

  it('should send push notification via API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Sent' }),
    });

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendPushNotification('Title', 'Body');
    });

    expect(success).toBe(true);
  });

  it('should handle API failure when sending push notification', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Failed' }),
    });

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendPushNotification('Fail', 'Body');
    });

    expect(success).toBe(false);
  });

  it('should send test push', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useNotification());

    let success;
    await act(async () => {
      success = await result.current.sendTestPush();
    });

    expect(success).toBe(true);
  });

  it('should return false for canUseNotification if requirements missing', () => {
    // @ts-ignore
    delete window.Notification;

    const { result } = renderHook(() => useNotification());

    expect(result.current.canUseNotification).toBe(false);
  });
});