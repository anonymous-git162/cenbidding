import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VendorsPage from '../pages/VendorsPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUsers = [
  { id: '1', fullName: 'Alice Smith', email: 'alice@example.com', role: 'VENDOR', vendor: { companyName: 'Acme Corp' }, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: '2', fullName: 'Bob Jones', email: 'bob@example.com', role: 'EVALUATOR', vendor: null, isActive: true, createdAt: '2025-02-01T00:00:00Z' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <VendorsPage />
    </MemoryRouter>,
  );
}

describe('VendorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
    });
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users/properties') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { data: [], meta: { total: 0 } } });
    });
  });

  it('renders heading and add user button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });
  });

  it('shows users in table', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users/properties') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { data: mockUsers, meta: { total: 2 } } });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No users')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users') {
        return Promise.reject({ response: { data: { message: 'Failed to load users' } } });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('opens create user dialog', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Add User'));
    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument();
    });
  });

  it('shows role chips in table', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/users/properties') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { data: mockUsers, meta: { total: 2 } } });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('VENDOR')).toBeInTheDocument();
      expect(screen.getByText('EVALUATOR')).toBeInTheDocument();
    });
  });
});
