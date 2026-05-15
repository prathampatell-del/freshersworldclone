import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../components/ui/Pagination';

describe('Pagination', () => {
  it('does not render when there is one page', () => {
    const { container } = render(<Pagination page={1} pages={1} total={5} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('disables the previous button on the first page', () => {
    render(<Pagination page={1} pages={3} total={25} onPageChange={() => {}} />);
    const prev = screen.getAllByRole('button')[0];
    expect(prev).toBeDisabled();
  });

  it('calls onPageChange with the requested page', async () => {
    const onChange = vi.fn();
    render(<Pagination page={2} pages={4} total={40} onPageChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^page 4$/i }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks the current page as current for accessibility', () => {
    render(<Pagination page={3} pages={5} total={50} onPageChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const current = buttons.find(b => b.getAttribute('aria-current') === 'page');
    expect(current).toBeDefined();
    expect(current?.textContent).toBe('3');
  });
});
