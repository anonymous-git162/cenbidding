import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcurementListPage from '../pages/ProcurementListPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockData = [
  { id: '1', requestNo: 'PR-001', title: 'Office Supplies', requestType: 'RFQ', status: 'PENDING_APPROVAL', category: 'General', currency: 'USD', budgetEstimate: 5000, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z', requester: { fullName: 'John Doe' } },
  { id: '2', requestNo: 'PR-002', title: 'IT Equipment', requestType: 'RFP', status: 'BIDDING_OPEN', category: 'IT', currency: 'USD', budgetEstimate: 50000, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-12T00:00:00Z', requester: { fullName: 'Jane Smith' } },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ProcurementListPage />
    </MemoryRouter>,
  );
}

describe('ProcurementListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
    });
    (api.get as any)
      .mockResolvedValueOnce({ data: ['USD', 'THB'] })
      .mockResolvedValueOnce({ data: { data: mockData, meta: { total: 2, page: 1, limit: 10 } } });
  });

  it('renders the page title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Procurements')).toBeInTheDocument();
    });
  });

  it('renders procurement rows when data loads', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.getByText('IT Equipment')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.get as any)
      .mockReset()
      .mockResolvedValueOnce({ data: ['USD', 'THB'] })
      .mockResolvedValueOnce(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.MuiLinearProgress-root')).toBeTruthy();
  });
});
