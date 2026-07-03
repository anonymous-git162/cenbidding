import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

function TestConsumer() {
  const { user, login, logout, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.email || 'null'}</span>
      <button data-testid="login" onClick={() => login('a@b.com', 'pw')}>Login</button>
      <button data-testid="logout" onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call /auth/me on mount', async () => {
    (api.get as any).mockResolvedValue({ data: { id: 'u-1', email: 'test@test.com', role: 'ADMIN' } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'));
  });

  it('should set user null on /auth/me failure', async () => {
    (api.get as any).mockRejectedValue(new Error('fail'));
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });

  it('should login and set user', async () => {
    (api.get as any).mockRejectedValue(new Error('fail'));
    (api.post as any).mockResolvedValue({ data: { user: { id: 'u-2', email: 'a@b.com', role: 'REQUESTER' } } });
    const user = userEvent.setup();
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await user.click(screen.getByTestId('login'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('a@b.com'));
  });

  it('should logout and clear user', async () => {
    (api.get as any).mockResolvedValue({ data: { id: 'u-1', email: 'test@test.com', role: 'ADMIN' } });
    (api.post as any).mockResolvedValue({});
    const user = userEvent.setup();
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test@test.com'));
    await user.click(screen.getByTestId('logout'));
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });
});
