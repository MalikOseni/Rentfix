import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity({ name: 'ticket_assignments' })
export class TicketAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.assignments, { onDelete: 'CASCADE' })
  ticket!: Ticket;

  @Column({ type: 'varchar', length: 64 })
  contractorId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  finalStatus!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
