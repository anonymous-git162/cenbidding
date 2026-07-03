import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApprovalsPage from '../pages/ApprovalsPage';
import { useAuth } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockItems = [
  { id: '1', requestNo: 'PR-001', title: 'Office Supplies', requestType: 'RFQ', requester: { fullName: 'John Doe' }, budgetEstimate: 5000, status: 'PENDING_APPROVAL', createdAt: '2025-01-15T00:00:00Z' },
  { id: '2', requestNo: 'PR-002', title: 'IT Equipment', requestType: 'RFP', requester: { fullName: 'Jane Smith' }, budgetEstimate: 50000, status: 'PENDING_APPROVAL', createdAt: '2025-01-10T00:00:00Z' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ApprovalsPage />
    </MemoryRouter>,
  );
}

describe('ApprovalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: '1', role: 'APPROVER' },
    });
    (api.get as any).mockResolvedValue({ data: mockItems });
    (api.post as any).mockResolvedValue({});
  });

  it('renders approval inbox heading for APPROVER', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Approval Inbox')).toBeInTheDocument();
    });
  });

  it('renders items in the table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
      expect(screen.getByText('IT Equipment')).toBeInTheDocument();
    });
  });

  it('shows approve/return/reject buttons for APPROVER', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Return').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Reject').length).toBeGreaterThan(0);
    });
  });

  it('opens approve dialog and calls API', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
    });
    const approveBtns = screen.getAllByText('Approve');
    await userEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
      expect(screen.getByText('Approve successful')).toBeInTheDocument();
    });
  });

  it('opens return dialog and calls API with reason', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Return').length).toBeGreaterThan(0);
    });
    await userEvent.click(screen.getAllByText('Return')[1]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog');
    const textareas = within(dialog).getAllByRole('textbox');
    await userEvent.type(textareas[0], 'Needs revision');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/approval/2/return', { comment: undefined, reason: 'Needs revision' });
    });
  });

  it('shows error on API failure', async () => {
    (api.post as any).mockRejectedValue({ response: { data: { message: 'Action not allowed' } } });
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Approve').length).toBeGreaterThan(0);
    });
    await userEvent.click(screen.getAllByText('Approve')[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByText('Action not allowed')).toBeInTheDocument();
    });
  });

  it('shows empty state when no items', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No pending approvals')).toBeInTheDocument();
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
});
