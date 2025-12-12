import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../shared/guards/access-token.guard';
import { RbacGuard } from '../shared/guards/rbac.guard';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketsService } from '../services/tickets.service';

@Controller('v1/tickets')
@UseGuards(AccessTokenGuard, TenantGuard, RbacGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, dto);
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('tenantId') tenantId?: string) {
    return this.ticketsService.findAll({ status, tenantId });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Post(':id/accept')
  async acceptJob(
    @Param('id') id: string,
    @Body('contractorId') contractorId: string
  ) {
    return this.ticketsService.acceptJob(id, contractorId);
  }
}
