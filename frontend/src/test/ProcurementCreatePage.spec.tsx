import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcurementCreatePage from '../pages/ProcurementCreatePage';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ProcurementCreatePage />
    </MemoryRouter>,
  );
}

describe('ProcurementCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: [] });
    (api.post as any).mockResolvedValue({ data: { id: '1' } });
    (api.delete as any).mockResolvedValue({});
  });

  it('renders heading and stepper', () => {
    renderPage();
    expect(screen.getByText('New Procurement Request')).toBeInTheDocument();
    expect(screen.getByText('Select Request Type')).toBeInTheDocument();
    expect(screen.getByText('RFI')).toBeInTheDocument();
    expect(screen.getByText('RFP')).toBeInTheDocument();
    expect(screen.getByText('RFQ')).toBeInTheDocument();
  });

  it('navigates to basic information step on Continue', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getAllByText('Basic Information').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows validation errors when required fields are empty', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getAllByText('Basic Information').length).toBeGreaterThanOrEqual(1);
    });
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('shows API error when save fails', async () => {
    (api.post as any).mockRejectedValue({ response: { data: { message: 'Creation failed' } } });
    renderPage();
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getAllByText('Basic Information').length).toBeGreaterThanOrEqual(1);
    });
    await userEvent.type(screen.getByPlaceholderText('e.g., IT Network Infrastructure Upgrade 2026'), 'Test Procurement');
    const descInput = screen.getByPlaceholderText('Provide a detailed description including scope, specifications, and key requirements...');
    await userEvent.type(descInput, 'This is a detailed description for testing purposes');
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('Budget & Classification')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText('Review Your Request')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Submit for Review'));
    await waitFor(() => {
      expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });
  }, 15000);

  it('loads properties on mount', async () => {
    renderPage();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/users/properties');
    });
  });
});
