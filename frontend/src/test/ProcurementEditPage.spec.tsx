import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcurementEditPage from '../pages/ProcurementEditPage';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockProcurement = {
  id: '1',
  title: 'Office Supplies',
  description: 'Need various office supplies',
  businessNeed: 'Running low on inventory',
  category: 'Office Supplies',
  currency: 'USD',
  budgetEstimate: 5000,
  justification: 'Essential for daily operations',
  status: 'DRAFT',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ProcurementEditPage />
    </MemoryRouter>,
  );
}

describe('ProcurementEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockProcurement });
    (api.patch as any).mockResolvedValue({});
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders edit form with loaded data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Edit Procurement')).toBeInTheDocument();
    });
    expect(screen.getAllByDisplayValue('Office Supplies').length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when procurement cannot be edited', async () => {
    (api.get as any).mockResolvedValue({ data: { ...mockProcurement, status: 'SUBMITTED' } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Can only edit draft or returned procurements')).toBeInTheDocument();
    });
  });

  it('handles API load error', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Not found' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('saves form successfully', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Edit Procurement')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalled();
      expect(screen.getByText('Saved successfully! Redirecting...')).toBeInTheDocument();
    });
  });
});
