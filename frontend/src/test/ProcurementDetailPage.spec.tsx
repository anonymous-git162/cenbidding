import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProcurementDetailPage from '../pages/ProcurementDetailPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: '1' }) };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockProcurement = {
  id: '1',
  title: 'IT Infrastructure Upgrade',
  requestNo: 'PR-001',
  status: 'DRAFT',
  requestType: 'RFP',
  description: 'Upgrade network infrastructure',
  businessNeed: 'Outdated equipment',
  justification: 'Critical for operations',
  budgetEstimate: 50000,
  currency: 'USD',
  category: 'IT Infrastructure',
  requester: { fullName: 'John Doe' },
  currentOwnerRole: 'REQUESTER',
  invitations: [],
  submissions: [],
  evaluations: [],
  files: [],
  _count: { invitations: 0, submissions: 0 },
  property: null,
};

const mockTimeline = [
  { id: 't1', eventType: 'DRAFT_CREATED', actorRole: 'REQUESTER', timestamp: '2025-01-15T00:00:00Z' },
];

function mockGetImplementation() {
  (api.get as any).mockImplementation((url: string) => {
    if (url === '/procurements/1') return Promise.resolve({ data: mockProcurement });
    if (url === '/timeline/1') return Promise.resolve({ data: mockTimeline });
    if (url.includes('/evaluation/reviews/')) return Promise.resolve({ data: [] });
    if (url.includes('/evaluation/consolidation/')) return Promise.reject(new Error('not found'));
    return Promise.resolve({ data: {} });
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProcurementDetailPage />
    </MemoryRouter>,
  );
}

describe('ProcurementDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'REQUESTER' },
    });
    mockGetImplementation();
    (api.post as any).mockResolvedValue({});
  });

  it('shows loading state initially', () => {
    (api.get as any).mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading procurement details...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders procurement title and details', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('IT Infrastructure Upgrade')).toBeInTheDocument();
      expect(screen.getByText('PR-001')).toBeInTheDocument();
    });
  });

  it('shows error state when procurement fails to load', async () => {
    (api.get as any).mockReset();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'REQUESTER' },
    });
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Failed to load procurement' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load procurement')).toBeInTheDocument();
    });
  });

  it('renders all tabs', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('IT Infrastructure Upgrade')).toBeInTheDocument();
    });
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Vendors').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Submissions').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Evaluation')).toBeInTheDocument();
  });

  it('renders timeline section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText(/Draft Created/i)).toBeInTheDocument();
    });
  });

  it('hides Vendors tab, Evaluation tab, and Workflow Progress from VENDOR role', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'vendor-1', role: 'VENDOR' },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('IT Infrastructure Upgrade')).toBeInTheDocument();
    });
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getAllByText('Submissions').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Evaluation')).not.toBeInTheDocument();
    expect(screen.queryByText('Workflow Progress')).not.toBeInTheDocument();
  });
});
