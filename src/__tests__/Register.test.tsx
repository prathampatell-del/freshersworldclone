import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../pages/auth/Register';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ui/Toast';

const { meSpy, registerSpy } = vi.hoisted(() => ({
  meSpy: vi.fn(),
  registerSpy: vi.fn(),
}));

vi.mock('../api', () => ({
  authApi: { me: meSpy, login: vi.fn(), register: registerSpy, logout: vi.fn() },
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <Register />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  meSpy.mockRejectedValue(new Error('401'));
  registerSpy.mockReset();
  if (typeof window !== 'undefined') window.localStorage.removeItem('fw_user');
});

describe('Register page', () => {
  it('shows inline errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole('button', { name: /create.*account/i }));
    expect(await screen.findByText(/please enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords with an inline error', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i), 'abcdef');
    await user.type(screen.getByLabelText(/confirm password/i), 'ghijkl');
    await user.click(screen.getByRole('button', { name: /create.*account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('submits valid input and calls the API once', async () => {
    registerSpy.mockResolvedValueOnce({ data: { user: { id: 1, email: 'a@b.co', name: 'Test', role: 'jobseeker' } } });
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/full name/i), 'Test');
    await user.type(screen.getByLabelText(/email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i), 'abcdef');
    await user.type(screen.getByLabelText(/confirm password/i), 'abcdef');
    await user.click(screen.getByRole('button', { name: /create.*account/i }));
    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy.mock.calls[0][0]).toMatchObject({ email: 'a@b.co', name: 'Test', role: 'jobseeker' });
  });
});
