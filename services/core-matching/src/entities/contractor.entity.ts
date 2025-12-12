import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Point } from 'geojson';

/**
 * Contractor Entity
 * PostgreSQL + PostGIS integration
 * Uber-style geospatial contractor profiles
 */

@Entity('contractors')
@Index(['status', 'deletedAt']) // For active contractor queries
@Index('idx_contractors_specialties', { synchronize: false }) // GIN index (created via migration)
@Index('idx_contractors_location', { synchronize: false }) // PostGIS spatial index
export class ContractorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  @Index()
  userId: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ name: 'specialties', type: 'jsonb', default: '[]' })
  specialties: string[];

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 })
  hourlyRate: number;

  // PostGIS geography point (lat/long)
  @Column({
    name: 'location_point',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  locationPoint: Point;

  // Denormalized location data for easy access
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string;

  @Column({
    name: 'service_radius',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10,
    comment: 'Service radius in miles',
  })
  serviceRadius: number;

  // Performance metrics
  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  @Index()
  averageRating: number;

  @Column({ name: 'reliability_score', type: 'decimal', precision: 3, scale: 2, default: 0 })
  reliabilityScore: number;

  @Column({
    name: 'average_response_time',
    type: 'integer',
    default: 30,
    comment: 'Average response time in minutes',
  })
  averageResponseTime: number;

  @Column({ name: 'total_jobs_completed', type: 'integer', default: 0 })
  totalJobsCompleted: number;

  // Availability
  @Column({
    name: 'availability_status',
    type: 'varchar',
    length: 20,
    default: 'available',
  })
  @Index()
  availabilityStatus: 'available' | 'unavailable' | 'on_leave' | 'busy';

  @Column({ name: 'current_jobs', type: 'integer', default: 0 })
  currentJobs: number;

  @Column({ name: 'max_concurrent_jobs', type: 'integer', default: 3 })
  maxConcurrentJobs: number;

  // Verification
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  @Index()
  status: 'pending' | 'verified' | 'suspended' | 'rejected';

  @Column({
    name: 'background_check_status',
    type: 'varchar',
    length: 20,
    default: 'not_started',
  })
  backgroundCheckStatus: 'not_started' | 'in_progress' | 'passed' | 'failed';

  @Column({ name: 'insurance_verified', type: 'boolean', default: false })
  insuranceVerified: boolean;

  @Column({ name: 'certifications', type: 'jsonb', nullable: true })
  certifications: string[];

  // Metadata
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Soft delete
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  @Index()
  deletedAt: Date | null;

  // Timestamps
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Computed property: is available?
  get isAvailable(): boolean {
    return (
      this.availabilityStatus === 'available' &&
      this.currentJobs < this.maxConcurrentJobs &&
      this.status === 'verified' &&
      !this.deletedAt
    );
  }

  // Computed property: has capacity?
  get hasCapacity(): boolean {
    return this.currentJobs < this.maxConcurrentJobs;
  }
}
