/**
 * WebSocket Gateway for Real-Time Notifications
 *
 * Handles real-time push notifications for:
 * - Ticket status changes
 * - Contractor assignment updates
 * - New job opportunities
 * - Message notifications
 *
 * Architecture inspired by: Uber's real-time driver notifications, Slack's WebSocket layer
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Notification event types
 */
export enum NotificationEvent {
  TICKET_CREATED = 'ticket:created',
  TICKET_UPDATED = 'ticket:updated',
  TICKET_ASSIGNED = 'ticket:assigned',
  TICKET_COMPLETED = 'ticket:completed',
  JOB_AVAILABLE = 'job:available',
  JOB_ACCEPTED = 'job:accepted',
  MESSAGE_RECEIVED = 'message:received',
  CONTRACTOR_MATCHED = 'contractor:matched',
}

export interface NotificationPayload {
  event: NotificationEvent;
  userId: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * WebSocket Gateway Configuration
 * - CORS enabled for web/mobile clients
 * - JWT authentication required
 * - Redis adapter for horizontal scaling
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Gateway initialization hook
   */
  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialized');
    this.setupMiddleware(server);
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(server: Server) {
    server.use(async (socket: Socket, next) => {
      try {
        // Extract JWT token from handshake
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          throw new Error('Authentication token missing');
        }

        // Verify JWT token
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });

        // Attach user data to socket
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;

        this.logger.log(`✅ Client authenticated: ${payload.sub}`);
        next();
      } catch (error) {
        this.logger.error(`❌ Authentication failed: ${error.message}`);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    const userId = client.data.userId;
    const role = client.data.role;

    this.logger.log(`Client connected: ${client.id} (user: ${userId}, role: ${role})`);

    // Track connected clients by userId
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, new Set());
    }
    this.connectedClients.get(userId)!.add(client.id);

    // Join user-specific room for targeted notifications
    client.join(`user:${userId}`);

    // Join role-specific rooms
    client.join(`role:${role}`);

    // Send connection confirmation
    client.emit('connected', {
      clientId: client.id,
      userId,
      timestamp: new Date(),
    });

    // Log connection stats
    this.logger.log(
      `📊 Active connections: ${this.server.sockets.sockets.size} | Unique users: ${this.connectedClients.size}`
    );
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);

    // Remove from connected clients tracking
    if (this.connectedClients.has(userId)) {
      this.connectedClients.get(userId)!.delete(client.id);
      if (this.connectedClients.get(userId)!.size === 0) {
        this.connectedClients.delete(userId);
      }
    }
  }

  /**
   * Client subscribes to specific ticket updates
   */
  @SubscribeMessage('subscribe:ticket')
  handleSubscribeTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() ticketId: string
  ) {
    client.join(`ticket:${ticketId}`);
    this.logger.log(`Client ${client.id} subscribed to ticket:${ticketId}`);
    return { success: true, ticketId };
  }

  /**
   * Client unsubscribes from ticket updates
   */
  @SubscribeMessage('unsubscribe:ticket')
  handleUnsubscribeTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() ticketId: string
  ) {
    client.leave(`ticket:${ticketId}`);
    this.logger.log(`Client ${client.id} unsubscribed from ticket:${ticketId}`);
    return { success: true, ticketId };
  }

  /**
   * Client subscribes to job opportunities (contractors)
   */
  @SubscribeMessage('subscribe:jobs')
  handleSubscribeJobs(
    @ConnectedSocket() client: Socket,
    @MessageBody() filters: { tradeCategory?: string; radius?: number }
  ) {
    const userId = client.data.userId;
    const room = `jobs:${filters.tradeCategory || 'all'}`;

    client.join(room);
    this.logger.log(`Contractor ${userId} subscribed to ${room}`);

    return { success: true, room, filters };
  }

  /**
   * Ping/Pong for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', timestamp: Date.now() };
  }

  // ============================================================================
  // PUBLIC METHODS - Called by other services to send notifications
  // ============================================================================

  /**
   * Send notification to specific user
   */
  notifyUser(userId: string, payload: NotificationPayload) {
    const room = `user:${userId}`;
    this.server.to(room).emit(payload.event, payload);

    this.logger.log(`📤 Notification sent to ${room}: ${payload.event}`);
  }

  /**
   * Send notification to specific ticket subscribers
   */
  notifyTicket(ticketId: string, payload: NotificationPayload) {
    const room = `ticket:${ticketId}`;
    this.server.to(room).emit(payload.event, payload);

    this.logger.log(`📤 Ticket notification sent to ${room}: ${payload.event}`);
  }

  /**
   * Broadcast notification to all users with specific role
   */
  notifyRole(role: string, payload: NotificationPayload) {
    const room = `role:${role}`;
    this.server.to(room).emit(payload.event, payload);

    this.logger.log(`📤 Role notification sent to ${room}: ${payload.event}`);
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcast(payload: NotificationPayload) {
    this.server.emit(payload.event, payload);
    this.logger.log(`📤 Broadcast notification sent: ${payload.event}`);
  }

  /**
   * Notify contractors about new job opportunity
   */
  notifyNewJobOpportunity(
    contractorIds: string[],
    jobData: any
  ) {
    const payload: NotificationPayload = {
      event: NotificationEvent.JOB_AVAILABLE,
      userId: 'system',
      data: jobData,
      timestamp: new Date(),
    };

    contractorIds.forEach((contractorId) => {
      this.notifyUser(contractorId, payload);
    });

    this.logger.log(`📤 Job opportunity sent to ${contractorIds.length} contractors`);
  }

  /**
   * Notify when ticket status changes
   */
  notifyTicketStatusChange(
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    affectedUserIds: string[]
  ) {
    const payload: NotificationPayload = {
      event: NotificationEvent.TICKET_UPDATED,
      userId: 'system',
      data: {
        ticketId,
        oldStatus,
        newStatus,
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };

    // Notify ticket room
    this.notifyTicket(ticketId, payload);

    // Notify affected users
    affectedUserIds.forEach((userId) => {
      this.notifyUser(userId, payload);
    });

    this.logger.log(
      `📤 Ticket ${ticketId} status change: ${oldStatus} → ${newStatus}`
    );
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.server.sockets.sockets.size,
      uniqueUsers: this.connectedClients.size,
      rooms: Array.from(this.server.sockets.adapter.rooms.keys()),
    };
  }

  /**
   * Check if user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  /**
   * Get number of connections for a specific user
   */
  getUserConnectionCount(userId: string): number {
    return this.connectedClients.get(userId)?.size || 0;
  }
}
