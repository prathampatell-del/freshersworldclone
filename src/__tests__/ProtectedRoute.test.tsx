import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

const { meSpy } = vi.hoisted(() => ({ meSpy: vi.fn() }));
vi.mock('../api', () => ({
  authApi: { me: meSpy, login: vi.fn(), register: vi.fn(), logout: vi.fn() },
}));

function renderApp(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer"
            element={
              <ProtectedRoute roles={['employer']}>
                <div>Employer Only</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  meSpy.mockReset();
  if (typeof window !== 'undefined') window.localStorage.removeItem('fw_user');
});

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', async () => {
    meSpy.mockRejectedValueOnce(new Error('401'));
    renderApp('/protected');
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders the protected content for authenticated users', async () => {
    meSpy.mockResolvedValueOnce({
      data: { id: 1, email: 'a@b.co', role: 'jobseeker', name: 'A', skills: [], education: [], experience_years: 0, created_at: '2026-01-01' },
    });
    renderApp('/protected');
    await waitFor(() => expect(screen.getByText('Secret Content')).toBeInTheDocument());
  });

  it('redirects authenticated users to / when role does not match', async () => {
    meSpy.mockResolvedValueOnce({
      data: { id: 1, email: 'a@b.co', role: 'jobseeker', name: 'A', skills: [], education: [], experience_years: 0, created_at: '2026-01-01' },
    });
    renderApp('/employer');
    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
    expect(screen.queryByText('Employer Only')).not.toBeInTheDocument();
  });
});
