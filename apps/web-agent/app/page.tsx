import Link from 'next/link';
import React from 'react';

const sections = [
  { title: 'Tickets', description: 'Monitor open issues, SLA timers, and triage queues.', href: '/tickets' },
  { title: 'Assignments', description: 'Coordinate contractor schedules, availability, and escalations.', href: '/assignments' },
  { title: 'Analytics', description: 'Track response times, first-time fix rates, and satisfaction.', href: '/analytics' }
];

export default function HomePage() {
  return (
    <div>
      <h2>Mission control for field operations</h2>
      <p>Start with the core flows: ticket triage, contractor matching, and proactive notifications.</p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sections.map((section) => (
          <article key={section.title} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <Link href={section.href}>Open</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
