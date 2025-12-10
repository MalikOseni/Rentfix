import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'users' })
@Index('idx_users_email_normalized', ['emailNormalized'], { unique: true })
@Index('idx_users_deleted_at', ['deletedAt'])
@Index('idx_users_created_at', ['createdAt'])
@Index('idx_users_deleted_at_null', ['deletedAt'], { where: '"deleted_at" IS NULL' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'email_normalized', type: 'varchar', length: 255 })
  emailNormalized!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'role', type: 'varchar', length: 50, default: 'tenant' })
  role!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64, nullable: true })
  tenantId!: string | null;

  @Column({ name: 'phone_e164', type: 'varchar', length: 20, nullable: true })
  phoneE164!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 120, nullable: true })
  firstName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 120, nullable: true })
  lastName!: string | null;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Column({ name: 'otp_hash', type: 'varchar', length: 255, nullable: true })
  otpHash!: string | null;

  @Column({ name: 'otp_created_at', type: 'timestamp', nullable: true })
  otpCreatedAt!: Date | null;

  @Column({ name: 'otp_expires_at', type: 'timestamp', nullable: true })
  otpExpiresAt!: Date | null;

  @Column({ name: 'otp_use_count', type: 'int', default: 0 })
  otpUseCount!: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'failed_login_at', type: 'timestamp', nullable: true })
  failedLoginAt!: Date | null;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin!: Date | null;

  @Column({ name: 'last_login_ip', type: 'inet', nullable: true })
  lastLoginIp!: string | null;

  @Column({ name: 'last_login_user_agent', type: 'text', nullable: true })
  lastLoginUserAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
