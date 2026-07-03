import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultDetailPage from '../pages/ResultDetailPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockResult = {
  id: '1',
  status: 'Selected',
  procurement: { id: 'p1', requestNo: 'PR-001', title: 'Office Supplies', status: 'AWARD_ANNOUNCED' },
  winningVendor: { companyName: 'ACME Corp' },
  announcementText: 'We are pleased to announce the award',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ResultDetailPage />
    </MemoryRouter>,
  );
}

describe('ResultDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'PROCUREMENT' },
    });
    (api.get as any).mockResolvedValue({ data: mockResult });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders result details for non-vendor role', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Procurement Result')).toBeInTheDocument();
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
    const prTexts = screen.getAllByText(/PR-001/);
    expect(prTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows winning vendor information', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ACME Corp')).toBeInTheDocument();
      expect(screen.getByText('We are pleased to announce the award')).toBeInTheDocument();
    });
  });

  it('shows no result state when result is null', async () => {
    (api.get as any).mockResolvedValue({ data: null });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No result found for this procurement.')).toBeInTheDocument();
    });
  });

  it('shows error state when API fails', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Failed to load' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });
});
