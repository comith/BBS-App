// __tests__/hooks/useNotification.test.js

import { renderHook } from '@testing-library/react';
import { useNotification } from '@/hooks/useNotification';

describe('useNotification', () => {
  it('should initialize with default permission, no subscription, and isMobile state', () => {
    // 1. จำลองการทำงานของ window และ navigator เพื่อให้โค้ดทำงานได้
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default', requestPermission: jest.fn() },
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X)',
    });

    // 2. Render Hook และเก็บผลลัพธ์
    const { result } = renderHook(() => useNotification());

    // 3. ตรวจสอบค่าเริ่มต้น
    expect(result.current.permission).toBe('default');
    expect(result.current.isPushEnabled).toBe(false);
    expect(result.current.isMobile).toBe(true);
  });
});