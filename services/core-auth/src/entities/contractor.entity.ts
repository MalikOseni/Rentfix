import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from './user.entity';

export enum ContractorStatus {
  PENDING = 'pending',
  BACKGROUND_CHECK_REQUESTED = 'background_check_requested',
  BACKGROUND_CHECK_PASSED = 'background_check_passed',
  BACKGROUND_CHECK_FAILED = 'background_check_failed',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export enum BackgroundCheckStatus {
  NOT_STARTED = 'not_started',
  REQUESTED = 'requested',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

@Entity({ name: 'contractors' })
export class Contractor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName!: string;

  @Column({ name: 'specialties', type: 'jsonb', default: () => "'[]'" })
  specialties!: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 })
  hourlyRate!: number;

  @Column({ name: 'insurance_cert_url', type: 'varchar', length: 512, nullable: true })
  insuranceCertUrl!: string | null;

  @Column({ name: 'insurance_expiry', type: 'date', nullable: true })
  insuranceExpiry!: Date | null;

  @Column({ name: 'bank_account_hash', type: 'varchar', length: 255 })
  bankAccountHash!: string;

  @Column({ name: 'bank_account_last_four', type: 'varchar', length: 4 })
  bankAccountLastFour!: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ContractorStatus,
    default: ContractorStatus.PENDING
  })
  status!: ContractorStatus;

  @Column({
    name: 'background_check_status',
    type: 'enum',
    enum: BackgroundCheckStatus,
    default: BackgroundCheckStatus.NOT_STARTED
  })
  backgroundCheckStatus!: BackgroundCheckStatus;

  @Column({ name: 'background_check_id', type: 'varchar', length: 128, nullable: true })
  backgroundCheckId!: string | null;

  @Column({ name: 'background_check_at', type: 'timestamptz', nullable: true })
  backgroundCheckAt!: Date | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'service_area', type: 'jsonb', nullable: true })
  serviceArea!: { postcodes?: string[]; radius_km?: number; center?: { lat: number; lng: number } } | null;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: number;

  @Column({ name: 'total_jobs_completed', type: 'integer', default: 0 })
  totalJobsCompleted!: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
