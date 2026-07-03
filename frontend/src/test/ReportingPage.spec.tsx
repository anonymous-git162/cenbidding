import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportingPage from '../pages/ReportingPage';
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

const mockStats = {
  total: 45,
  totalBudget: 2500000,
  avgBudget: 55555,
  byStatus: [{ status: 'COMPLETED', count: 15 }, { status: 'DRAFT', count: 10 }],
  byType: [{ type: 'RFP', count: 20 }, { type: 'RFQ', count: 25 }],
  byCategory: [{ category: 'IT', count: 12 }, { category: 'Office', count: 8 }],
  byMonth: [{ month: '2025-01', count: 5, budget: 500000 }],
  recentActivity: [],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportingPage />
    </MemoryRouter>,
  );
}

describe('ReportingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
    });
    (api.get as any).mockResolvedValue({ data: mockStats });
  });

  it('renders reports & analytics heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });
  });

  it('renders KPI cards with stats data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Total Procurements')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state when stats fail to load', async () => {
    (api.get as any).mockRejectedValue({});
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
    });
  });

  it('shows no recent activity when activity list is empty', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  it('handles empty category data without crashing', async () => {
    (api.get as any).mockResolvedValue({
      data: {
        ...mockStats,
        byCategory: [],
        recentActivity: [],
      },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });
  });

  it('renders export CSV button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });
  });
});
