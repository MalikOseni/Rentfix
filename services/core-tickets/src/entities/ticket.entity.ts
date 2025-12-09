import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn
} from 'typeorm';
import { TicketAssignment } from './ticket-assignment.entity';
import { TicketStateHistory } from './ticket-state-history.entity';

export enum TicketStatus {
  new = 'new',
  triaged = 'triaged',
  assigned = 'assigned',
  in_progress = 'in_progress',
  completed = 'completed',
  cancelled = 'cancelled'
}

export enum TicketPriority {
  low = 'low',
  medium = 'medium',
  high = 'high',
  emergency = 'emergency'
}

@Entity({ name: 'tickets' })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.new })
  status!: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.medium })
  priority!: TicketPriority;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  tenantId!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  unitId!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  assignedContractorId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => TicketStateHistory, (state) => state.ticket)
  stateHistory!: TicketStateHistory[];

  @OneToMany(() => TicketAssignment, (assignment) => assignment.ticket)
  assignments!: TicketAssignment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;
}
