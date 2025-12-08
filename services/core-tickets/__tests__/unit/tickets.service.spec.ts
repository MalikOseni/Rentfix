import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketAssignment } from '../../src/entities/ticket-assignment.entity';
import { TicketStateHistory } from '../../src/entities/ticket-state-history.entity';
import { Ticket } from '../../src/entities/ticket.entity';
import { TicketsService } from '../../src/services/tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useClass: Repository },
        { provide: getRepositoryToken(TicketStateHistory), useClass: Repository },
        { provide: getRepositoryToken(TicketAssignment), useClass: Repository }
      ]
    }).compile();

    service = moduleRef.get(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
