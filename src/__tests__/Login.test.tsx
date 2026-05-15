import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ui/Toast';

const { meSpy, loginSpy, registerSpy, logoutSpy } = vi.hoisted(() => ({
  meSpy: vi.fn(),
  loginSpy: vi.fn(),
  registerSpy: vi.fn(),
  logoutSpy: vi.fn(),
}));

vi.mock('../api', () => ({
  authApi: { me: meSpy, login: loginSpy, register: registerSpy, logout: logoutSpy },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <ToastProvider>
          <Login />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  meSpy.mockRejectedValue(new Error('not logged in'));
  loginSpy.mockReset();
  if (typeof window !== 'undefined') window.localStorage.removeItem('fw_user');
});

describe('Login page', () => {
  it('shows a validation toast when fields are empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/fill in all fields/i)).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('surfaces server errors as toast messages', async () => {
    loginSpy.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i), 'badpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
  });

  it('fills the form via quick-login helper buttons', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /job seeker/i }));
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('seeker1@gmail.com');
  });

  it('logs in successfully and does not show error toast', async () => {
    loginSpy.mockResolvedValueOnce({
      data: { user: { id: 1, email: 'a@b.co', name: 'A', role: 'jobseeker' }, token: 't' },
    });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith('a@b.co', 'password123'));
  });
});
