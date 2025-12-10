import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => User, { nullable: true })
  user!: User | null;

  @Index()
  @ManyToOne(() => Organization, { nullable: true })
  organization!: Organization | null;

  @Column({ type: 'varchar', length: 64 })
  action!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
