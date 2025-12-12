import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { MatchingService } from '../services/matching.service';
import { MatchingRequest, MatchingResult } from '@rentfix/types';

@Controller()
export class MatchingController {
  private readonly logger = new Logger(MatchingController.name);

  constructor(private readonly matchingService: MatchingService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      message: 'Contractor Matching Engine ready',
      endpoints: [
        'GET /health',
        'POST /match',
        'POST /match/ticket/:ticketId',
      ],
    };
  }

  /**
   * Find matching contractors for a maintenance ticket
   * POST /match
   */
  @Post('match')
  async findContractors(
    @Body() request: MatchingRequest
  ): Promise<MatchingResult> {
    this.logger.log(`Finding contractors for ticket ${request.ticketId}`);

    const result = await this.matchingService.findMatchingContractors(request);

    this.logger.log(
      `Found ${result.matches.length} contractors in ${result.executionTimeMs}ms`
    );

    return result;
  }

  /**
   * Convenience endpoint for matching by ticket ID
   * POST /match/ticket/:ticketId
   */
  @Post('match/ticket/:ticketId')
  async findContractorsByTicketId(
    @Param('ticketId') ticketId: string,
    @Body() body: Omit<MatchingRequest, 'ticketId'>
  ): Promise<MatchingResult> {
    this.logger.log(`Finding contractors for ticket ${ticketId}`);

    const request: MatchingRequest = {
      ticketId,
      ...body,
    };

    return this.matchingService.findMatchingContractors(request);
  }
}
