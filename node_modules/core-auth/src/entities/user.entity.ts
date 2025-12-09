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

  @Column({ type: 'varchar', length: 120 })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.tenant })
  role!: UserRole;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName!: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @VersionColumn()
  version!: number;
}
