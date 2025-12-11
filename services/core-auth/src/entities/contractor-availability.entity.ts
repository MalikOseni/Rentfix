import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Contractor } from './contractor.entity';

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  ON_LEAVE = 'on_leave',
  BUSY = 'busy',
  BOOKED = 'booked'
}

export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly'
}

@Entity({ name: 'contractor_availability' })
@Index(['contractorId', 'date'])
@Index(['date', 'status'])
export class ContractorAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'contractor_id', type: 'uuid' })
  contractorId!: string;

  @ManyToOne(() => Contractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;

  @Index()
  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE
  })
  status!: AvailabilityStatus;

  @Column({
    name: 'recurrence_pattern',
    type: 'enum',
    enum: RecurrencePattern,
    default: RecurrencePattern.NONE
  })
  recurrencePattern!: RecurrencePattern;

  @Column({ name: 'recurrence_end_date', type: 'date', nullable: true })
  recurrenceEndDate!: string | null;

  @Column({ name: 'max_jobs', type: 'integer', default: 1 })
  maxJobs!: number;

  @Column({ name: 'booked_jobs', type: 'integer', default: 0 })
  bookedJobs!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'service_area_override', type: 'jsonb', nullable: true })
  serviceAreaOverride!: { postcodes?: string[]; radius_km?: number } | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
