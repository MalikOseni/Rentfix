import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ContractorEntity } from '../entities/contractor.entity';
import { IssueTrade } from '@rentfix/types';

/**
 * Contractor Repository
 * PostGIS-powered geospatial queries
 * Implements Uber's location-based matching patterns
 */

@Injectable()
export class ContractorRepository {
  constructor(
    @InjectRepository(ContractorEntity)
    private readonly repository: Repository<ContractorEntity>
  ) {}

  /**
   * Find contractors within radius using PostGIS
   * Uses ST_DWithin for high-performance geospatial queries
   */
  async findWithinRadius(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    options?: {
      specialties?: IssueTrade[];
      minRating?: number;
      maxHourlyRate?: number;
      requireInsurance?: boolean;
      requireBackgroundCheck?: boolean;
      limit?: number;
    }
  ): Promise<ContractorEntity[]> {
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters

    let query = this.repository
      .createQueryBuilder('contractor')
      .select([
        'contractor.*',
        // Calculate distance in miles using PostGIS
        `ST_Distance(
          contractor.location_point,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        ) / 1609.34 as distance`,
      ])
      .where('contractor.deleted_at IS NULL')
      .andWhere('contractor.status = :status', { status: 'verified' })
      .andWhere(
        `ST_DWithin(
          contractor.location_point,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radiusMeters
        )`
      )
      .setParameters({
        latitude,
        longitude,
        radiusMeters,
      });

    // Apply filters
    if (options?.specialties && options.specialties.length > 0) {
      query = query.andWhere('contractor.specialties @> :specialties::jsonb', {
        specialties: JSON.stringify(options.specialties),
      });
    }

    if (options?.minRating) {
      query = query.andWhere('contractor.average_rating >= :minRating', {
        minRating: options.minRating,
      });
    }

    if (options?.maxHourlyRate) {
      query = query.andWhere('contractor.hourly_rate <= :maxRate', {
        maxRate: options.maxHourlyRate,
      });
    }

    if (options?.requireInsurance) {
      query = query.andWhere('contractor.insurance_verified = true');
    }

    if (options?.requireBackgroundCheck) {
      query = query.andWhere('contractor.background_check_status = :bgStatus', {
        bgStatus: 'passed',
      });
    }

    // Order by distance (closest first)
    query = query.orderBy('distance', 'ASC');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return query.getRawMany();
  }

  /**
   * Find available contractors (for real-time matching)
   */
  async findAvailable(options?: {
    specialties?: IssueTrade[];
    location?: { latitude: number; longitude: number; radius: number };
  }): Promise<ContractorEntity[]> {
    let query = this.repository
      .createQueryBuilder('contractor')
      .where('contractor.deleted_at IS NULL')
      .andWhere('contractor.status = :status', { status: 'verified' })
      .andWhere('contractor.availability_status = :availStatus', {
        availStatus: 'available',
      })
      .andWhere('contractor.current_jobs < contractor.max_concurrent_jobs');

    if (options?.specialties && options.specialties.length > 0) {
      query = query.andWhere('contractor.specialties @> :specialties::jsonb', {
        specialties: JSON.stringify(options.specialties),
      });
    }

    if (options?.location) {
      const { latitude, longitude, radius } = options.location;
      const radiusMeters = radius * 1609.34;

      query = query
        .andWhere(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radiusMeters
          )`
        )
        .setParameters({ latitude, longitude, radiusMeters });
    }

    return query.getMany();
  }

  /**
   * Find contractors by specialty with geospatial filtering
   */
  async findBySpecialty(
    specialty: IssueTrade,
    location?: { latitude: number; longitude: number; radius: number }
  ): Promise<ContractorEntity[]> {
    let query = this.repository
      .createQueryBuilder('contractor')
      .where('contractor.deleted_at IS NULL')
      .andWhere('contractor.status = :status', { status: 'verified' })
      .andWhere('contractor.specialties @> :specialty::jsonb', {
        specialty: JSON.stringify([specialty]),
      });

    if (location) {
      const { latitude, longitude, radius } = location;
      const radiusMeters = radius * 1609.34;

      query = query
        .select([
          'contractor.*',
          `ST_Distance(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
          ) / 1609.34 as distance`,
        ])
        .andWhere(
          `ST_DWithin(
            contractor.location_point,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radiusMeters
          )`
        )
        .setParameters({ latitude, longitude, radiusMeters })
        .orderBy('distance', 'ASC');

      return query.getRawMany();
    }

    return query.getMany();
  }

  /**
   * Batch fetch contractors by IDs (for caching)
   */
  async findByIds(ids: string[]): Promise<ContractorEntity[]> {
    if (ids.length === 0) return [];

    return this.repository
      .createQueryBuilder('contractor')
      .whereInIds(ids)
      .andWhere('contractor.deleted_at IS NULL')
      .getMany();
  }

  /**
   * Update contractor availability status
   */
  async updateAvailability(
    contractorId: string,
    status: 'available' | 'unavailable' | 'busy' | 'on_leave'
  ): Promise<void> {
    await this.repository.update(contractorId, {
      availabilityStatus: status,
      updatedAt: new Date(),
    });
  }

  /**
   * Increment job counter (when contractor accepts job)
   */
  async incrementJobCounter(contractorId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ContractorEntity)
      .set({
        currentJobs: () => 'current_jobs + 1',
      })
      .where('id = :id', { id: contractorId })
      .execute();
  }

  /**
   * Decrement job counter (when job is completed)
   */
  async decrementJobCounter(contractorId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ContractorEntity)
      .set({
        currentJobs: () => 'GREATEST(current_jobs - 1, 0)', // Prevent negative
      })
      .where('id = :id', { id: contractorId })
      .execute();
  }

  /**
   * Get contractor statistics (for monitoring)
   */
  async getStatistics(): Promise<{
    total: number;
    available: number;
    busy: number;
    bySpecialty: Record<string, number>;
  }> {
    const total = await this.repository.count({
      where: { deletedAt: null, status: 'verified' },
    });

    const available = await this.repository.count({
      where: {
        deletedAt: null,
        status: 'verified',
        availabilityStatus: 'available',
      },
    });

    const busy = await this.repository.count({
      where: { deletedAt: null, status: 'verified', availabilityStatus: 'busy' },
    });

    // Count by specialty (this is approximate since specialties is an array)
    const specialtyCounts = await this.repository
      .createQueryBuilder('contractor')
      .select('specialty', 'specialty')
      .addSelect('COUNT(*)', 'count')
      .from(
        (qb) =>
          qb
            .select('id')
            .addSelect("jsonb_array_elements_text(specialties)", 'specialty')
            .from(ContractorEntity, 'c')
            .where('c.deleted_at IS NULL')
            .andWhere('c.status = :status', { status: 'verified' }),
        'contractor'
      )
      .groupBy('specialty')
      .getRawMany();

    const bySpecialty = specialtyCounts.reduce((acc, row) => {
      acc[row.specialty] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>);

    return { total, available, busy, bySpecialty };
  }
}
