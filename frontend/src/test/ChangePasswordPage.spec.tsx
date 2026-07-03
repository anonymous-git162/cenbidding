import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  default: { post: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ChangePasswordPage />
    </MemoryRouter>,
  );
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.post as any).mockResolvedValue({});
  });

  it('renders the heading and submit button', () => {
    renderPage();
    expect(screen.getAllByText('Change Password').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBe(3);
  });

  it('shows error when new password is too short', async () => {
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(inputs[0], 'CurrentPass1');
    await userEvent.type(inputs[1], 'Ab1');
    await userEvent.type(inputs[2], 'Ab1');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(inputs[0], 'CurrentPass1');
    await userEvent.type(inputs[1], 'NewPass123');
    await userEvent.type(inputs[2], 'DifferentPass');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('calls API and shows success on valid submit', async () => {
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(inputs[0], 'CurrentPass1');
    await userEvent.type(inputs[1], 'NewPass123');
    await userEvent.type(inputs[2], 'NewPass123');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'CurrentPass1',
        newPassword: 'NewPass123',
      });
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
  });

  it('shows error on API failure', async () => {
    (api.post as any).mockRejectedValue({ response: { data: { message: 'Current password is incorrect' } } });
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(inputs[0], 'WrongPass1');
    await userEvent.type(inputs[1], 'NewPass123');
    await userEvent.type(inputs[2], 'NewPass123');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    (api.post as any).mockImplementation(() => new Promise(() => {}));
    renderPage();
    const inputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(inputs[0], 'CurrentPass1');
    await userEvent.type(inputs[1], 'NewPass123');
    await userEvent.type(inputs[2], 'NewPass123');
    await userEvent.click(screen.getByRole('button', { name: 'Change Password' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Changing...' })).toBeDisabled();
    });
  });

  it('navigates back on back arrow click', async () => {
    renderPage();
    const backBtn = document.querySelector('.MuiIconButton-root');
    expect(backBtn).toBeTruthy();
    if (backBtn) await userEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
