import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { JobsList } from '../pages/JobsList';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ui/Toast';

const { listSpy, meSpy } = vi.hoisted(() => ({
  listSpy: vi.fn(),
  meSpy: vi.fn(),
}));

vi.mock('../api/jobs', () => ({
  jobsApi: { list: listSpy, bookmark: vi.fn(), apply: vi.fn(), get: vi.fn() },
}));
vi.mock('../api', () => ({
  authApi: { me: meSpy, login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  jobsApi: { list: listSpy, bookmark: vi.fn(), apply: vi.fn(), get: vi.fn() },
}));

function renderJobsList(props: { presetType?: string; title?: string } = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <JobsList {...props} />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  listSpy.mockReset();
  meSpy.mockReset();
  meSpy.mockRejectedValue(new Error('401'));
  if (typeof window !== 'undefined') window.localStorage.removeItem('fw_user');
});

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    company_id: 1,
    title: 'Frontend Engineer',
    description: 'desc',
    type: 'fulltime',
    category: 'IT',
    location: 'Bangalore',
    salary_min: 400000,
    salary_max: 600000,
    experience_min: 0,
    experience_max: 1,
    qualifications: '',
    skills_required: ['React'],
    openings: 1,
    is_active: true,
    is_featured: false,
    views: 0,
    created_at: '2026-05-01',
    company_name: 'Acme',
    ...overrides,
  };
}

describe('JobsList', () => {
  it('renders the loading skeleton while jobs are loading', () => {
    listSpy.mockReturnValue(new Promise(() => { /* never resolves */ }));
    const { container } = renderJobsList();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows an empty state when no jobs are returned', async () => {
    listSpy.mockResolvedValue({ data: { jobs: [], total: 0, page: 1, pages: 1 } });
    renderJobsList();
    expect(await screen.findByText(/no jobs found/i)).toBeInTheDocument();
  });

  it('renders job cards from the API response', async () => {
    listSpy.mockResolvedValue({
      data: { jobs: [makeJob(), makeJob({ id: 2, title: 'Backend Engineer' })], total: 2, page: 1, pages: 1 },
    });
    renderJobsList();
    await waitFor(() => expect(screen.getByText('Frontend Engineer')).toBeInTheDocument());
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText(/2 jobs found/i)).toBeInTheDocument();
  });

  it('passes the preset type to the API for sub-pages', async () => {
    listSpy.mockResolvedValue({ data: { jobs: [], total: 0, page: 1, pages: 1 } });
    renderJobsList({ presetType: 'internship', title: 'Internships' });
    await waitFor(() => expect(listSpy).toHaveBeenCalled());
    expect(listSpy.mock.calls[0][0]).toMatchObject({ type: 'internship' });
    expect(screen.getByRole('heading', { name: /internships/i })).toBeInTheDocument();
  });
});
