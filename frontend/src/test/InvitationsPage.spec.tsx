import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvitationsPage from '../pages/InvitationsPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockInvitations = [
  { id: 'inv1', invitationStatus: 'PENDING', invitedAt: '2025-03-01T00:00:00Z', deadline: '2025-03-15T00:00:00Z', procurement: { id: 'p1', title: 'Office Supplies', requestNo: 'PR-001', requestType: 'RFQ' }, vendor: { companyName: 'Tech Supplies Co' } },
  { id: 'inv2', invitationStatus: 'ACCEPTED', invitedAt: '2025-02-20T00:00:00Z', deadline: '2025-03-10T00:00:00Z', procurement: { id: 'p2', title: 'IT Hardware', requestNo: 'PR-002', requestType: 'RFP' }, vendor: { companyName: 'Global Tech' } },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <InvitationsPage />
    </MemoryRouter>,
  );
}

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'PROCUREMENT' },
    });
    (api.get as any).mockResolvedValue({ data: { data: [] } });
  });

  it('renders heading for non-VENDOR role', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendors') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendor-invitations') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Vendor Invitations')).toBeInTheDocument();
    });
  });

  it('renders "My Invitations" for VENDOR role', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: '2', role: 'VENDOR' },
    });
    (api.get as any).mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('My Invitations')).toBeInTheDocument();
    });
  });

  it('shows invitations in table', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendors') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendor-invitations') {
        return Promise.resolve({ data: mockInvitations });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.getByText('IT Hardware')).toBeInTheDocument();
    });
  });

  it('shows empty state', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendors') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendor-invitations') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No invitations yet')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Failed to load' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('shows invite vendors button for PROCUREMENT role', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendors') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === '/vendor-invitations') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Invite Vendors')).toBeInTheDocument();
    });
  });

  it('handles accept invitation for VENDOR role', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: '2', role: 'VENDOR' },
    });
    (api.get as any).mockResolvedValue({ data: mockInvitations });
    (api.put as any).mockResolvedValue({});
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Accept').length).toBeGreaterThan(0);
    });
    await userEvent.click(screen.getAllByText('Accept')[0]);
    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
      expect(screen.getByText('Invitation accepted')).toBeInTheDocument();
    });
  });
});
