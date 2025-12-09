import { TicketFeed } from '../../../components/triage/ticket-feed';
import { tickets } from '../../../lib/mock-data';

export default function TriagePage() {
  return <TicketFeed initialTickets={tickets} />;
}
