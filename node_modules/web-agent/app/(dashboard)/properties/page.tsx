import { properties } from '../../../lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

export default function PropertiesPage() {
  return (
    <section className="dashboard-grid">
      <Card>
        <CardHeader className="items-center justify-between gap-3 sm:flex-row sm:items-end">
          <CardTitle>Properties</CardTitle>
          <Input placeholder="Filter by name" aria-label="Filter properties" className="max-w-xs" />
        </CardHeader>
        <CardContent className="table-responsive">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                <th className="p-2">Name</th>
                <th className="p-2">Address</th>
                <th className="p-2">Open tickets</th>
                <th className="p-2">Health</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-t border-[var(--color-border)]">
                  <td className="p-2 font-semibold">{property.name}</td>
                  <td className="p-2">{property.address}</td>
                  <td className="p-2">{property.openTickets}</td>
                  <td className="p-2">{property.healthScore ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
