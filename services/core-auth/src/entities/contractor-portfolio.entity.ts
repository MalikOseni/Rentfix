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

export enum PortfolioMediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document'
}

export enum PortfolioItemStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity({ name: 'contractor_portfolio' })
@Index(['contractorId', 'createdAt'])
@Index(['specialty', 'status'])
export class ContractorPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'contractor_id', type: 'uuid' })
  contractorId!: string;

  @ManyToOne(() => Contractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: PortfolioMediaType,
    default: PortfolioMediaType.PHOTO
  })
  mediaType!: PortfolioMediaType;

  @Column({ name: 'media_url', type: 'varchar', length: 1024 })
  mediaUrl!: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 1024, nullable: true })
  thumbnailUrl!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  specialty!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags!: string[];

  @Column({ name: 'before_photo_url', type: 'varchar', length: 1024, nullable: true })
  beforePhotoUrl!: string | null;

  @Column({ name: 'after_photo_url', type: 'varchar', length: 1024, nullable: true })
  afterPhotoUrl!: string | null;

  @Column({ name: 'job_date', type: 'date', nullable: true })
  jobDate!: string | null;

  @Column({ name: 'job_duration_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  jobDurationHours!: number | null;

  @Column({
    type: 'enum',
    enum: PortfolioItemStatus,
    default: PortfolioItemStatus.PENDING_REVIEW
  })
  status!: PortfolioItemStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
