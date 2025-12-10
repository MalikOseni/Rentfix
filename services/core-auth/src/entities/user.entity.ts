import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

export enum UserRole {
  tenant = 'tenant',
  agent = 'agent',
  contractor = 'contractor',
  admin = 'admin'
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ name: 'email_normalized', type: 'varchar', length: 255 })
  emailNormalized!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.tenant })
  role!: UserRole;

  @Index()
  @Column({ name: 'tenant_id', type: 'varchar', length: 64, nullable: true })
  tenantId!: string | null;

  @Column({ name: 'phone_e164', type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

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

  @Column({ name: 'otp_created_at', type: 'timestamptz', nullable: true })
  otpCreatedAt!: Date | null;

  @Column({ name: 'otp_expires_at', type: 'timestamptz', nullable: true })
  otpExpiresAt!: Date | null;

  @Column({ name: 'otp_use_count', type: 'integer', default: 0 })
  otpUseCount!: number;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'failed_login_attempts', type: 'integer', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'failed_login_at', type: 'timestamptz', nullable: true })
  failedLoginAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin!: Date | null;

  @Column({ name: 'last_login_ip', type: 'inet', nullable: true })
  lastLoginIp!: string | null;

  @Column({ name: 'last_login_user_agent', type: 'text', nullable: true })
  lastLoginUserAgent!: string | null;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;
}
