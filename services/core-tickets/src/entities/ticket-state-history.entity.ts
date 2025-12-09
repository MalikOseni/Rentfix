import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket, TicketStatus } from './ticket.entity';

@Entity({ name: 'ticket_state_history' })
export class TicketStateHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.stateHistory, { onDelete: 'CASCADE' })
  ticket!: Ticket;

  @Column({ type: 'enum', enum: TicketStatus })
  state!: TicketStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  changedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  changedAt!: Date;
}
