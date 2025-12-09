import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { properties, tickets, assignments } from '../../../lib/mock-data';

export default function OverviewPage() {
  const openTickets = tickets.filter((t) => t.status !== 'completed').length;
  const emergencyTickets = tickets.filter((t) => t.urgency === 'emergency').length;
  const scheduled = assignments.filter((a) => a.status === 'scheduled').length;

  return (
    <section className="dashboard-grid">
      <div className="card-grid">
        <Card>
          <CardHeader>
            <CardTitle>Open tickets</CardTitle>
            <Badge variant="muted">SLA tracked</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openTickets}</p>
            <p className="text-sm text-[var(--color-muted)]">Across all managed properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emergency</CardTitle>
            <Badge variant="danger">Action</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{emergencyTickets}</p>
            <p className="text-sm text-[var(--color-muted)]">Require dispatch within 60 minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scheduled today</CardTitle>
            <Badge variant="success">On track</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{scheduled}</p>
            <p className="text-sm text-[var(--color-muted)]">Contractor visits</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="items-center justify-between">
          <CardTitle>Portfolio health</CardTitle>
          <Button variant="secondary">Download CSV</Button>
        </CardHeader>
        <CardContent className="table-responsive">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="p-2">Property</th>
                <th className="p-2">Open tickets</th>
                <th className="p-2">Occupancy</th>
                <th className="p-2">Health score</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-t border-[var(--color-border)]">
                  <td className="p-2 font-semibold">{property.name}</td>
                  <td className="p-2">{property.openTickets}</td>
                  <td className="p-2 capitalize">{property.occupancy}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
                        <div
                          className="h-2 rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${property.healthScore ?? 0}%` }}
                        />
                      </div>
                      <span>{property.healthScore ?? 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
