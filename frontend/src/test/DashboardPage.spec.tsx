import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../pages/DashboardPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockProcurements = [
  { id: '1', title: 'Test Procurement', requestNo: 'PR-001', status: 'DRAFT', requestType: 'RFP', createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z' },
  { id: '2', title: 'Active Bid', requestNo: 'PR-002', status: 'BIDDING_OPEN', requestType: 'RFQ', createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-12T00:00:00Z' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'PROCUREMENT', fullName: 'John Doe' },
    });
    (api.get as any).mockResolvedValue({ data: { data: mockProcurements, meta: { total: 2 } } });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders KPI cards with correct labels', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Drafts')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('shows recent procurements list', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Test Procurement')).toBeInTheDocument();
      expect(screen.getByText('Active Bid')).toBeInTheDocument();
    });
  });

  it('navigates to procurement on item click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Test Procurement').length).toBeGreaterThan(0);
    });
    await userEvent.click(screen.getAllByText('Test Procurement')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/procurements/1');
  });

  it('displays error state when API fails', async () => {
    (api.get as any).mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });

  it('displays role-specific quick actions for PROCUREMENT', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('All Procurements')).toBeInTheDocument();
      expect(screen.getByText('Invite Vendors')).toBeInTheDocument();
    });
  });

  it('shows New Request button for REQUESTER role', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: '2', role: 'REQUESTER', fullName: 'Jane Smith' },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('New Request').length).toBeGreaterThanOrEqual(1);
    });
  });
});
