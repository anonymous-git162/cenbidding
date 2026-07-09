import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvaluationPage from '../pages/EvaluationPage';
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

const mockProcurement = {
  id: '1', requestNo: 'E-001', title: 'Server Equipment', status: 'EVALUATION', requestType: 'RFP',
};

const mockSubmissions = [
  { id: 's1', vendorId: 'v1', vendor: { companyName: 'Tech Corp' }, price: '50000' },
];

const mockReview = {
  id: 'r1', vendorId: 'v1', score: 75, comment: 'Good proposal',
  evaluator: { fullName: 'Test Eval' }, submittedAt: '2025-01-01T00:00:00Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <EvaluationPage />
    </MemoryRouter>,
  );
}

describe('EvaluationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'EVALUATOR' },
    });
    (api.get as any).mockResolvedValue({ data: { data: [] } });
  });

  it('renders heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Evaluation Queue')).toBeInTheDocument();
    });
  });

  it('shows empty procurements message', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No procurements available for evaluation')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Failed to load' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('shows vendor submissions after selecting a procurement', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      if (url === `/evaluation/reviews/${mockProcurement.id}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `/rfq-submissions/procurement/${mockProcurement.id}`) {
        return Promise.resolve({ data: mockSubmissions });
      }
      if (url === `/evaluation/consolidation/${mockProcurement.id}`) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    await waitFor(() => {
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    });
  });

  it('shows lastBid price over submission price', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      if (url === `/evaluation/reviews/${mockProcurement.id}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `/rfq-submissions/procurement/${mockProcurement.id}`) {
        return Promise.resolve({ data: [{ id: 's1', vendorId: 'v1', vendor: { companyName: 'Tech Corp' }, price: '50000', lastBid: '48000' }] });
      }
      if (url === `/evaluation/consolidation/${mockProcurement.id}`) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    await waitFor(() => {
      expect(screen.getByText('$48,000')).toBeInTheDocument();
    });
    expect(screen.queryByText('$50,000')).not.toBeInTheDocument();
  });

  it('shows no submissions message when empty', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      if (url === `/evaluation/reviews/${mockProcurement.id}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `/rfq-submissions/procurement/${mockProcurement.id}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `/evaluation/consolidation/${mockProcurement.id}`) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    await waitFor(() => {
      expect(screen.getByText(/No vendor submissions to evaluate/)).toBeInTheDocument();
    });
  });

  it('shows reviews tab content', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      if (url === `/evaluation/reviews/${mockProcurement.id}`) {
        return Promise.resolve({ data: [mockReview] });
      }
      if (url === `/rfq-submissions/procurement/${mockProcurement.id}`) {
        return Promise.resolve({ data: mockSubmissions });
      }
      if (url === `/evaluation/consolidation/${mockProcurement.id}`) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    const reviewsTab = screen.getByText('Reviews (1)');
    await userEvent.click(reviewsTab);
    await waitFor(() => {
      expect(screen.getByText('Test Eval')).toBeInTheDocument();
    });
  });

  it('shows AI Score button for vendors', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      if (url === `/evaluation/reviews/${mockProcurement.id}`) {
        return Promise.resolve({ data: [] });
      }
      if (url === `/rfq-submissions/procurement/${mockProcurement.id}`) {
        return Promise.resolve({ data: mockSubmissions });
      }
      if (url === `/evaluation/consolidation/${mockProcurement.id}`) {
        return Promise.reject(new Error('Not found'));
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    await waitFor(() => {
      expect(screen.getByText('AI Score')).toBeInTheDocument();
    });
  });

  it('renders criteria configuration button for procurement role', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'PROCUREMENT' },
    });
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/procurements') {
        return Promise.resolve({ data: { data: [mockProcurement] } });
      }
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await userEvent.click(screen.getByLabelText('Procurement'));
    await userEvent.click(await screen.findByRole('option', { name: /Server Equipment/i }));
    await waitFor(() => {
      expect(screen.getByText(/Criteria/)).toBeInTheDocument();
    });
  });
});
