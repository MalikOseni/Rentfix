import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity({ name: 'organizations' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'owner_user_id' })
  owner!: User;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyRegistrationNumber!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'free' })
  plan!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Column({ type: 'integer', default: 5 })
  propertiesQuota!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Role, (role) => role.organization)
  roles!: Role[];
}
