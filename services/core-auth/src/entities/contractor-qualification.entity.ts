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

export enum QualificationType {
  CERTIFICATION = 'certification',
  LICENSE = 'license',
  BADGE = 'badge',
  INSURANCE = 'insurance',
  TRAINING = 'training',
  AWARD = 'award'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
  REVOKED = 'revoked'
}

@Entity({ name: 'contractor_qualifications' })
@Index(['contractorId', 'type'])
@Index(['type', 'verificationStatus'])
@Index(['expiresAt'])
export class ContractorQualification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'contractor_id', type: 'uuid' })
  contractorId!: string;

  @ManyToOne(() => Contractor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractor_id' })
  contractor!: Contractor;

  @Column({
    type: 'enum',
    enum: QualificationType
  })
  type!: QualificationType;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'issuing_body', type: 'varchar', length: 255 })
  issuingBody!: string;

  @Column({ name: 'credential_id', type: 'varchar', length: 255, nullable: true })
  credentialId!: string | null;

  @Column({ name: 'issued_at', type: 'date' })
  issuedAt!: string;

  @Index()
  @Column({ name: 'expires_at', type: 'date', nullable: true })
  expiresAt!: string | null;

  @Column({ name: 'document_url', type: 'varchar', length: 1024, nullable: true })
  documentUrl!: string | null;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy!: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes!: string | null;

  @Column({ name: 'external_verification_url', type: 'varchar', length: 1024, nullable: true })
  externalVerificationUrl!: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic!: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  specialties!: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
