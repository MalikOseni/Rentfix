import { render, screen } from '@testing-library/react';
import TriagePage from '../app/(dashboard)/triage/page';
import { tickets } from '../lib/mock-data';

vi.mock('../lib/realtime', () => ({
  useTicketFeed: () => tickets
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/triage'
}));

describe('Triage page', () => {
  it('renders ticket feed and details', () => {
    render(<TriagePage />);
    expect(screen.getByText('Live ticket feed')).toBeInTheDocument();
    expect(screen.getByText(tickets[0].title)).toBeInTheDocument();
  });
});
