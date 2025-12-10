import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity({ name: 'tenant_invites' })
export class TenantInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => Organization, { nullable: false })
  organization!: Organization;

  @Index()
  @ManyToOne(() => User, { nullable: false })
  invitedBy!: User;

  @Column({ type: 'varchar', length: 320 })
  invitedEmail!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  invitedPhone!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  propertyId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
