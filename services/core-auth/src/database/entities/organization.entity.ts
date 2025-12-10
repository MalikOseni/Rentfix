import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'organizations' })
@Check('chk_organizations_plan', "plan IN ('free','pro','enterprise')")
@Check('chk_organizations_name_length', 'char_length(name) BETWEEN 2 AND 100')
@Index('idx_organizations_owner_user_id', ['ownerUserId'])
@Index('idx_organizations_status', ['status'])
@Index('idx_organizations_plan', ['plan'])
@Index('idx_organizations_deleted_at', ['deletedAt'])
@Index('idx_organizations_deleted_at_null', ['deletedAt'], { where: '"deleted_at" IS NULL' })
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser!: UserEntity;

  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId!: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'company_registration_number', type: 'varchar', length: 50, nullable: true })
  companyRegistrationNumber!: string | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: 'plan', type: 'varchar', length: 50, default: 'free' })
  plan!: string;

  @Column({ name: 'plan_expires_at', type: 'timestamp', nullable: true })
  planExpiresAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ name: 'properties_quota', type: 'int', default: 5 })
  propertiesQuota!: number;

  @Column({ name: 'teams_quota', type: 'int', default: 1 })
  teamsQuota!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
