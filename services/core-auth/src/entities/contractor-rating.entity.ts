import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { Contractor } from './contractor.entity';
import { User } from './user.entity';

export enum RatingSource {
  TENANT = 'tenant',
  AGENT = 'agent',
  LANDLORD = 'landlord'
}

export enum RatingCategory {
  QUALITY = 'quality',
  PUNCTUALITY = 'punctuality',
  COMMUNICATION = 'communication',
  VALUE = 'value',
  PROFESSIONALISM = 'professionalism'
}

@Entity({ name: 'contractor_ratings' })
@Unique(['contractorId', 'ticketId', 'ratedByUserId'])
@Index(['contractorId', 'createdAt'])
export class ContractorRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'contractor_id', type: 'uuid' })
  contractorId!: string;

  @ManyToOne(() => Contractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;

  @Index()
  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId!: string;

  @Column({ name: 'assignment_id', type: 'uuid', nullable: true })
  assignmentId!: string | null;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'rated_by_user_id', type: 'uuid' })
  ratedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'rated_by_user_id' })
  ratedByUser!: User | null;

  @Column({
    name: 'source',
    type: 'enum',
    enum: RatingSource
  })
  source!: RatingSource;

  @Column({ name: 'overall_score', type: 'decimal', precision: 2, scale: 1 })
  overallScore!: number;

  @Column({ name: 'quality_score', type: 'decimal', precision: 2, scale: 1, nullable: true })
  qualityScore!: number | null;

  @Column({ name: 'punctuality_score', type: 'decimal', precision: 2, scale: 1, nullable: true })
  punctualityScore!: number | null;

  @Column({ name: 'communication_score', type: 'decimal', precision: 2, scale: 1, nullable: true })
  communicationScore!: number | null;

  @Column({ name: 'value_score', type: 'decimal', precision: 2, scale: 1, nullable: true })
  valueScore!: number | null;

  @Column({ name: 'professionalism_score', type: 'decimal', precision: 2, scale: 1, nullable: true })
  professionalismScore!: number | null;

  @Column({ type: 'text', nullable: true })
  review!: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'contractor_response', type: 'text', nullable: true })
  contractorResponse!: string | null;

  @Column({ name: 'contractor_response_at', type: 'timestamptz', nullable: true })
  contractorResponseAt!: Date | null;

  @Column({ name: 'helpful_count', type: 'integer', default: 0 })
  helpfulCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
