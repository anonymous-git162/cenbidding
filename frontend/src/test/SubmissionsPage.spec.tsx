import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubmissionsPage from '../pages/SubmissionsPage';
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
  { id: '1', requestNo: 'RFQ-001', title: 'Office Supplies', status: 'RFQ_OPEN', submissionDeadline: '2025-02-15T00:00:00Z' },
  { id: '2', requestNo: 'RFQ-002', title: 'IT Equipment', status: 'RFQ_OPEN', submissionDeadline: '2025-02-20T00:00:00Z' },
];

function mockApiGet(procurements: any[], invitations: any[], submissions: any[]) {
  (api.get as any)
    .mockReset()
    .mockResolvedValueOnce({ data: { data: procurements } })
    .mockResolvedValueOnce({ data: invitations })
    .mockResolvedValueOnce({ data: submissions });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SubmissionsPage />
    </MemoryRouter>,
  );
}

describe('SubmissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'VENDOR' },
    });
  });

  it('renders submissions heading', async () => {
    mockApiGet(mockItems, [{ invitationStatus: 'ACCEPTED', procurementId: '1' }, { invitationStatus: 'ACCEPTED', procurementId: '2' }], []);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Submissions')).toBeInTheDocument();
    });
  });

  it('renders open procurements in the table', async () => {
    mockApiGet(mockItems, [{ invitationStatus: 'ACCEPTED', procurementId: '1' }, { invitationStatus: 'ACCEPTED', procurementId: '2' }], []);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.getByText('IT Equipment')).toBeInTheDocument();
    });
  });

  it('shows empty state when no open procurements', async () => {
    mockApiGet([], [], []);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No open procurements available')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (api.get as any).mockReset().mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('opens new submission dialog on button click', async () => {
    mockApiGet(mockItems, [{ invitationStatus: 'ACCEPTED', procurementId: '1' }, { invitationStatus: 'ACCEPTED', procurementId: '2' }], []);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('New Submission')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('New Submission'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    (api.get as any)
      .mockReset()
      .mockRejectedValueOnce({ response: { data: { message: 'Failed to load submissions' } } })
      .mockRejectedValueOnce({ response: { data: { message: '' } } })
      .mockRejectedValueOnce({ response: { data: { message: '' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
    });
  });
});
