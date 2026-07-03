import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VendorAnalyticsPage from '../pages/VendorAnalyticsPage';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const mockAnalytics = {
  vendor: { id: 'v1', companyName: 'ACME Corp' },
  summary: {
    invitedCount: 5,
    acceptedCount: 3,
    declinedCount: 1,
    pendingCount: 1,
    submissionCount: 2,
    totalBids: 4,
    avgScore: 85,
    winRate: 60,
  },
  recentInvitations: [],
  recentSubmissions: [],
};

function renderPage() {
  return render(<VendorAnalyticsPage />);
}

describe('VendorAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/analytics/vendor') {
        return Promise.resolve({ data: mockAnalytics });
      }
      return Promise.resolve({ data: [] });
    });
    (api.post as any).mockResolvedValue({});
    (api.delete as any).mockResolvedValue({});
  });

  it('shows loading state initially', () => {
    (api.get as any).mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders vendor company name when loaded', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Vendor Analytics')).toBeInTheDocument();
      expect(screen.getByText(/ACME Corp/)).toBeInTheDocument();
    });
  });

  it('shows KPI cards with summary data', async () => {
    renderPage();
    await waitFor(() => {
      const fives = screen.getAllByText('5');
      expect(fives.length).toBeGreaterThan(0);
      expect(screen.getByText('Invitations')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText('Submissions')).toBeInTheDocument();
      expect(screen.getByText('Total Bids')).toBeInTheDocument();
    });
  });

  it('shows no vendor profile message when analytics is null', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/analytics/vendor') {
        return Promise.resolve({ data: null });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No vendor profile found')).toBeInTheDocument();
    });
  });

  it('renders tabs and empty submissions state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      const emptyTexts = screen.getAllByText('No submissions yet');
      expect(emptyTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('handles submissions with null procurement gracefully', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/analytics/vendor') {
        return Promise.resolve({
          data: {
            ...mockAnalytics,
            recentSubmissions: [
              { id: 's1', price: 50000, status: 'SUBMITTED', submittedAt: '2025-01-01', procurement: null },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Vendor Analytics')).toBeInTheDocument();
    });
  });

  it('renders bid history tab', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/analytics/vendor') {
        return Promise.resolve({ data: mockAnalytics });
      }
      if (url === '/ebidding/my-bids') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Bid History/)).toBeInTheDocument();
    });
  });
});
