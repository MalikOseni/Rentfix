import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

const metrics = [
  { label: 'Avg response', value: '18m', context: 'p95 across last 7 days', variant: 'success' },
  { label: 'First time fix', value: '82%', context: 'contractors achieving FTF', variant: 'muted' },
  { label: 'CSAT', value: '4.6/5', context: 'post-visit surveys', variant: 'success' },
  { label: 'Reopen rate', value: '6%', context: 'past 30 days', variant: 'warning' }
];

export default function AnalyticsPage() {
  return (
    <section className="dashboard-grid">
      <div className="card-grid">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="items-center justify-between">
              <CardTitle>{metric.label}</CardTitle>
              <Badge variant={metric.variant as any}>{metric.context}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ElasticSearch hints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[var(--color-muted)]">
          <p>
            Index tickets, assignments, and evidence documents with analyzers tuned for property addresses and issue keywords.
            Use aggregations for SLA breach counts and percentile latencies (p50/p90/p99) to drive dashboards.
          </p>
          <p>
            For advanced filtering, include nested fields for responsibility, AI confidence, and contractor reliability scores. Warm
            up queries with pinned/decay functions for nearby properties.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
