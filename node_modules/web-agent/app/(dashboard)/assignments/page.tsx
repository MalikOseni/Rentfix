import { assignments, tickets } from '../../../lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function AssignmentsPage() {
  return (
    <section className="dashboard-grid">
      <Card>
        <CardHeader>
          <CardTitle>Upcoming assignments</CardTitle>
        </CardHeader>
        <CardContent className="table-responsive">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="p-2">Ticket</th>
                <th className="p-2">Contractor</th>
                <th className="p-2">Scheduled</th>
                <th className="p-2">Reliability</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const ticket = tickets.find((t) => t.id === assignment.ticketId);
                return (
                  <tr key={assignment.id} className="border-t border-[var(--color-border)]">
                    <td className="p-2 font-semibold">{ticket?.title ?? assignment.ticketId}</td>
                    <td className="p-2">{assignment.contractor}</td>
                    <td className="p-2">{new Date(assignment.scheduledAt || '').toLocaleString()}</td>
                    <td className="p-2">{assignment.reliabilityScore ?? '—'}</td>
                    <td className="p-2">
                      <Badge variant={assignment.status === 'completed' ? 'success' : 'muted'}>{assignment.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
