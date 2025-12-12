import {
  IsString,
  IsEnum,
  IsObject,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsLatitude,
  IsLongitude,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IssueTrade, IssueSeverity } from '@rentfix/types';

/**
 * Data Transfer Objects with Validation
 * Implements input sanitization and validation (OWASP Top 10)
 * Adobe/Microsoft enterprise security standards
 */

class LocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @Length(1, 500)
  address: string;
}

class FiltersDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxHourlyRate?: number;

  @IsOptional()
  @IsBoolean()
  requireInsurance?: boolean;

  @IsOptional()
  @IsBoolean()
  requireBackgroundCheck?: boolean;
}

export class MatchingRequestDto {
  @IsUUID('4')
  ticketId: string;

  @IsString()
  @Length(1, 200)
  issueType: string;

  @IsEnum(IssueTrade)
  trade: IssueTrade;

  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  searchRadius?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltersDto)
  filters?: FiltersDto;
}

/**
 * Response DTO (for OpenAPI documentation)
 */
export class MatchingResponseDto {
  matches: any[]; // Full type omitted for brevity
  totalCandidates: number;
  searchRadius: number;
  executionTimeMs: number;
  usedFallback: boolean;
  fallbackReason?: string;
}
