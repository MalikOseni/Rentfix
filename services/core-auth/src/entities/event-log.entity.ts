import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

export enum EventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_EMAIL_VERIFIED = 'user.email_verified',

  // Organization events
  ORG_CREATED = 'organization.created',
  ORG_UPDATED = 'organization.updated',
  ORG_DELETED = 'organization.deleted',
  ORG_MEMBER_ADDED = 'organization.member_added',
  ORG_MEMBER_REMOVED = 'organization.member_removed',

  // Property events
  PROPERTY_CREATED = 'property.created',
  PROPERTY_UPDATED = 'property.updated',
  PROPERTY_DELETED = 'property.deleted',

  // Ticket events
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  TICKET_COMPLETED = 'ticket.completed',
  TICKET_CANCELLED = 'ticket.cancelled',

  // Contractor events
  CONTRACTOR_REGISTERED = 'contractor.registered',
  CONTRACTOR_VERIFIED = 'contractor.verified',
  CONTRACTOR_SUSPENDED = 'contractor.suspended',
  CONTRACTOR_AVAILABILITY_UPDATED = 'contractor.availability_updated',
  CONTRACTOR_RATED = 'contractor.rated',
  CONTRACTOR_PORTFOLIO_ADDED = 'contractor.portfolio_added',
  CONTRACTOR_QUALIFICATION_ADDED = 'contractor.qualification_added',

  // Assignment events
  ASSIGNMENT_CREATED = 'assignment.created',
  ASSIGNMENT_ACCEPTED = 'assignment.accepted',
  ASSIGNMENT_DECLINED = 'assignment.declined',
  ASSIGNMENT_COMPLETED = 'assignment.completed',
  ASSIGNMENT_CANCELLED = 'assignment.cancelled',

  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded'
}

/**
 * Immutable event log for event sourcing foundation.
 * Events are append-only and should never be updated or deleted.
 * Use this for audit trails, analytics, and event replay.
 */
@Entity({ name: 'event_log' })
@Index(['eventType', 'createdAt'])
@Index(['aggregateType', 'aggregateId', 'createdAt'])
@Index(['organizationId', 'createdAt'])
@Index(['actorId', 'createdAt'])
@Index(['createdAt'])
export class EventLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sequence_number', type: 'bigint', generated: 'increment' })
  sequenceNumber!: string;

  @Index()
  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 100
  })
  eventType!: string;

  @Column({ name: 'event_version', type: 'integer', default: 1 })
  eventVersion!: number;

  @Index()
  @Column({ name: 'aggregate_type', type: 'varchar', length: 50 })
  aggregateType!: string;

  @Index()
  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Index()
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 50, nullable: true })
  actorType!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'previous_state', type: 'jsonb', nullable: true })
  previousState!: Record<string, unknown> | null;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId!: string | null;

  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
