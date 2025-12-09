import React from 'react';
import type { ReactNode } from 'react';

export interface CardProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fff' }}>
      <h4 style={{ margin: '0 0 4px 0' }}>{title}</h4>
      {description ? <p style={{ margin: '0 0 8px 0', color: '#475569' }}>{description}</p> : null}
      {children}
    </div>
  );
}
