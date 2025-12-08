import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketPriority, TicketStatus } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @IsString()
  unitId!: string;

  @IsString()
  tenantId!: string;

  @IsOptional()
  @IsString()
  assignedContractorId?: string;
}
