import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'roles' })
@Index('idx_roles_user_id', ['userId'])
@Index('idx_roles_organization_id', ['organizationId'])
@Index('idx_roles_user_organization', ['userId', 'organizationId'])
@Index('uq_roles_user_org_deleted_at', ['userId', 'organizationId', 'deletedAt'], { unique: true })
@Index('uq_roles_user_org_active', ['userId', 'organizationId'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('idx_roles_deleted_at_null', ['deletedAt'], { where: '"deleted_at" IS NULL' })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization!: OrganizationEntity;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'role_name', type: 'varchar', length: 50 })
  roleName!: string;

  @Column({ name: 'permissions', type: 'jsonb', default: () => "'{}'::jsonb" })
  permissions!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
