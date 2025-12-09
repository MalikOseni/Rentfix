import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { TicketStateHistory } from '../entities/ticket-state-history.entity';
import { Ticket, TicketStatus } from '../entities/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketStateHistory)
    private readonly historyRepository: Repository<TicketStateHistory>,
    @InjectRepository(TicketAssignment)
    private readonly assignmentRepository: Repository<TicketAssignment>
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      tenantId: dto.tenantId,
      unitId: dto.unitId,
      assignedContractorId: dto.assignedContractorId ?? null
    });
    const saved = await this.ticketRepository.save(ticket);

    const history = this.historyRepository.create({
      ticket: saved,
      state: dto.status,
      note: 'created',
      changedBy: dto.tenantId
    });
    await this.historyRepository.save(history);

    if (dto.assignedContractorId) {
      const assignment = this.assignmentRepository.create({
        ticket: saved,
        contractorId: dto.assignedContractorId,
        finalStatus: 'pending',
        scheduledAt: null,
        acceptedAt: null,
        completedAt: null
      });
      await this.assignmentRepository.save(assignment);
    }

    return saved;
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.status = dto.status;
    const saved = await this.ticketRepository.save(ticket);

    const history = this.historyRepository.create({
      ticket: saved,
      state: dto.status,
      note: dto.note ?? null,
      changedBy: dto.changedBy ?? null
    });
    await this.historyRepository.save(history);

    if (dto.status === TicketStatus.completed) {
      await this.assignmentRepository.update({ ticket: { id } }, { finalStatus: 'completed' });
    }

    return saved;
  }

  async findAll(filters: { status?: string; tenantId?: string }) {
    const where: FindOptionsWhere<Ticket> = {};
    if (filters.status) {
      where.status = filters.status as TicketStatus;
    }
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }
    return this.ticketRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['stateHistory', 'assignments']
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }
}
