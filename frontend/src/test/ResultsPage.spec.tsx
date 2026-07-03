import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultsPage from '../pages/ResultsPage';
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

const mockItems = [
  { id: '1', requestNo: 'PR-001', title: 'Office Supplies', requestType: 'RFQ', requester: { fullName: 'John Doe' }, budgetEstimate: 5000, status: 'COMPLETED', createdAt: '2025-01-15T00:00:00Z', currency: 'USD' },
  { id: '2', requestNo: 'PR-002', title: 'IT Equipment', requestType: 'RFP', requester: { fullName: 'Jane Smith' }, budgetEstimate: 50000, status: 'AWARD_APPROVED', createdAt: '2025-01-10T00:00:00Z', currency: 'USD' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ResultsPage />
    </MemoryRouter>,
  );
}

describe('ResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
    });
    (api.get as any).mockResolvedValue({ data: { data: mockItems } });
  });

  it('renders procurement results heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Procurement Results')).toBeInTheDocument();
    });
  });

  it('renders items in the table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.getByText('IT Equipment')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No results available yet')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('navigates to procurement on row click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Office Supplies'));
    expect(mockNavigate).toHaveBeenCalledWith('/procurements/1');
  });

  it('shows error on API failure', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Failed to load results' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load results')).toBeInTheDocument();
    });
  });
});
