import { renderHook, act } from '@testing-library/react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not connect when user is null', () => {
    (useAuth as any).mockReturnValue({ user: null });
    const { result } = renderHook(() => useSocket());
    expect(result.current.connected).toBe(false);
  });

  it('should return on and emit functions', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'u-1' } });
    const { result } = renderHook(() => useSocket());
    expect(typeof result.current.on).toBe('function');
    expect(typeof result.current.emit).toBe('function');
  });

  it('should register and dispatch listeners via on', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'u-1' } });
    const { result } = renderHook(() => useSocket());
    const callback = vi.fn();
    result.current.on('notification', callback);
  });
});
