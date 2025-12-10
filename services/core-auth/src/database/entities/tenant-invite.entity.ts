import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'tenant_invites' })
@Index('idx_tenant_invites_invite_token_hash', ['inviteTokenHash'], { unique: true })
@Index('idx_tenant_invites_property_status', ['propertyId', 'status'])
@Index('idx_tenant_invites_token_expires_at', ['tokenExpiresAt'])
export class TenantInviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization!: OrganizationEntity;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'property_id', type: 'uuid' })
  propertyId!: string;

  @Column({ name: 'invited_email_normalized', type: 'varchar', length: 255 })
  invitedEmailNormalized!: string;

  @Column({ name: 'invited_phone_e164', type: 'varchar', length: 20, nullable: true })
  invitedPhoneE164!: string | null;

  @Column({ name: 'invite_token_hash', type: 'varchar', length: 255 })
  inviteTokenHash!: string;

  @Column({ name: 'token_expires_at', type: 'timestamp' })
  tokenExpiresAt!: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by_agent_id' })
  createdByAgent!: UserEntity;

  @Column({ name: 'created_by_agent_id', type: 'uuid' })
  createdByAgentId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt!: Date | null;
}
