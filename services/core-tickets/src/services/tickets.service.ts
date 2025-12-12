import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, DataSource } from 'typeorm';
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
    private readonly assignmentRepository: Repository<TicketAssignment>,
    private readonly dataSource: DataSource
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

  /**
   * Accept a job as a contractor
   * CRITICAL: Uses SERIALIZABLE transaction isolation to prevent race conditions
   *
   * Race Condition Protection:
   * 1. SERIALIZABLE isolation level prevents concurrent modifications
   * 2. SELECT FOR UPDATE locks the ticket row
   * 3. Atomic status check + assignment creation
   * 4. Rollback on any error
   *
   * Inspired by: Uber's driver assignment, DoorDash order acceptance
   */
  async acceptJob(ticketId: string, contractorId: string): Promise<Ticket> {
    if (!contractorId) {
      throw new BadRequestException('Contractor ID is required');
    }

    // Use QueryRunner for explicit transaction control with SERIALIZABLE isolation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE'); // Critical: SERIALIZABLE isolation

    try {
      // Step 1: Lock the ticket row (SELECT FOR UPDATE)
      const ticket = await queryRunner.manager
        .createQueryBuilder(Ticket, 'ticket')
        .where('ticket.id = :ticketId', { ticketId })
        .setLock('pessimistic_write') // Pessimistic lock
        .getOne();

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      // Step 2: Validate ticket can be accepted
      const validStatuses = [TicketStatus.new, TicketStatus.triaged];
      if (!validStatuses.includes(ticket.status)) {
        throw new ConflictException(
          `Job already taken or not available. Current status: ${ticket.status}`
        );
      }

      if (ticket.assignedContractorId) {
        throw new ConflictException(
          `Job already taken by contractor: ${ticket.assignedContractorId}`
        );
      }

      // Step 3: Check if assignment already exists (double-check)
      const existingAssignment = await queryRunner.manager.findOne(TicketAssignment, {
        where: { ticket: { id: ticketId } },
      });

      if (existingAssignment) {
        throw new ConflictException('Job already has an assignment');
      }

      // Step 4: Update ticket (atomic operation)
      ticket.status = TicketStatus.assigned;
      ticket.assignedContractorId = contractorId;
      await queryRunner.manager.save(Ticket, ticket);

      // Step 5: Create assignment record
      const assignment = queryRunner.manager.create(TicketAssignment, {
        ticket: ticket,
        contractorId: contractorId,
        acceptedAt: new Date(),
        finalStatus: 'accepted',
        scheduledAt: null,
        completedAt: null,
      });
      await queryRunner.manager.save(TicketAssignment, assignment);

      // Step 6: Log state change in audit trail
      const history = queryRunner.manager.create(TicketStateHistory, {
        ticket: ticket,
        state: TicketStatus.assigned,
        note: `Accepted by contractor ${contractorId}`,
        changedBy: contractorId,
      });
      await queryRunner.manager.save(TicketStateHistory, history);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return updated ticket with relations
      return await this.ticketRepository.findOne({
        where: { id: ticketId },
        relations: ['assignments', 'stateHistory'],
      }) as Ticket;

    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
