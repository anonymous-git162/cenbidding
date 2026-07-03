import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditPage from '../pages/AuditPage';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}));

const mockLogs = [
  { id: 'l1', action: 'APPROVED', actorRole: 'APPROVER', entityType: 'Procurement', createdAt: '2025-01-15T00:00:00Z' },
  { id: 'l2', action: 'SUBMITTED', actorRole: 'REQUESTER', entityType: 'Procurement', createdAt: '2025-01-14T00:00:00Z' },
];

function renderPage() {
  return render(<AuditPage />);
}

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: { data: mockLogs } });
  });

  it('renders heading and search field', async () => {
    renderPage();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter procurement UUID, title, or request number')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('searches by UUID and displays audit logs', async () => {
    renderPage();
    const input = screen.getByPlaceholderText('Enter procurement UUID, title, or request number');
    await userEvent.type(input, '550e8400-e29b-41d4-a716-446655440000');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => {
      expect(screen.getByText('APPROVED by APPROVER')).toBeInTheDocument();
      expect(screen.getByText('SUBMITTED by REQUESTER')).toBeInTheDocument();
    });
  });

  it('shows empty state when no logs found', async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });
    renderPage();
    const input = screen.getByPlaceholderText('Enter procurement UUID, title, or request number');
    await userEvent.type(input, '550e8400-e29b-41d4-a716-446655440000');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => {
      expect(screen.getByText('No audit logs found for this procurement')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    (api.get as any).mockRejectedValue({ response: { data: { message: 'Audit not found' } } });
    renderPage();
    const input = screen.getByPlaceholderText('Enter procurement UUID, title, or request number');
    await userEvent.type(input, '550e8400-e29b-41d4-a716-446655440000');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => {
      expect(screen.getByText('Audit not found')).toBeInTheDocument();
    });
  });

  it('disables search button when input is empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });
});
