/**
 * WebSocket Gateway Integration Tests
 *
 * Tests real-time notification delivery through WebSocket connections
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { io, Socket as ClientSocket } from 'socket.io-client';
import {
  NotificationsGateway,
  NotificationEvent,
  NotificationPayload,
} from '../src/gateways/notifications.gateway';

describe('NotificationsGateway Integration Tests', () => {
  let app: INestApplication;
  let gateway: NotificationsGateway;
  let jwtService: JwtService;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let serverUrl: string;

  // Test users
  const testUsers = {
    tenant: { id: 'tenant-001', role: 'tenant' },
    contractor: { id: 'contractor-001', role: 'contractor' },
    agent: { id: 'agent-001', role: 'agent' },
  };

  beforeAll(async () => {
    // Create test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockResolvedValue({
              sub: testUsers.tenant.id,
              role: testUsers.tenant.role,
            }),
            sign: jest.fn((payload) => `mock-token-${payload.sub}`),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Random port

    gateway = moduleFixture.get<NotificationsGateway>(NotificationsGateway);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Get server address
    const address = app.getHttpServer().address();
    serverUrl = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    // Disconnect all clients
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
  });

  /**
   * Helper to create authenticated client
   */
  const createClient = (userId: string, role: string): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const token = `mock-token-${userId}`;

      // Mock JWT verification for this user
      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({
        sub: userId,
        role: role,
      });

      const client = io(`${serverUrl}/notifications`, {
        auth: { token },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        resolve(client);
      });

      client.on('connect_error', (error) => {
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  };

  /**
   * TEST GROUP 1: Connection Management
   */
  describe('Connection Management', () => {
    it('should successfully connect authenticated client', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);

      expect(client1.connected).toBe(true);
      expect(client1.id).toBeDefined();
    });

    it('should send connection confirmation on connect', async () => {
      const connectedPromise = new Promise((resolve) => {
        client1 = io(`${serverUrl}/notifications`, {
          auth: { token: 'mock-token-tenant-001' },
          transports: ['websocket'],
        });

        client1.on('connected', (data) => {
          resolve(data);
        });
      });

      (jwtService.verifyAsync as jest.Mock).mockResolvedValueOnce({
        sub: testUsers.tenant.id,
        role: testUsers.tenant.role,
      });

      const connectionData = await connectedPromise;

      expect(connectionData).toHaveProperty('clientId');
      expect(connectionData).toHaveProperty('userId', testUsers.tenant.id);
      expect(connectionData).toHaveProperty('timestamp');
    });

    it('should reject unauthenticated connection', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token')
      );

      const client = io(`${serverUrl}/notifications`, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
      });

      const errorPromise = new Promise((resolve) => {
        client.on('connect_error', (error) => {
          resolve(error);
        });
      });

      const error = await errorPromise;
      expect(error).toBeDefined();

      client.disconnect();
    });

    it('should track multiple connections from same user', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
      client2 = await createClient(testUsers.tenant.id, testUsers.tenant.role);

      const count = gateway.getUserConnectionCount(testUsers.tenant.id);
      expect(count).toBe(2);
    });

    it('should handle disconnect and update stats', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);

      const initialConnected = gateway.isUserConnected(testUsers.tenant.id);
      expect(initialConnected).toBe(true);

      client1.disconnect();

      // Wait for disconnect to process
      await new Promise((resolve) => setTimeout(resolve, 100));

      const finalConnected = gateway.isUserConnected(testUsers.tenant.id);
      expect(finalConnected).toBe(false);
    });
  });

  /**
   * TEST GROUP 2: Subscription Management
   */
  describe('Subscription Management', () => {
    beforeEach(async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
    });

    it('should subscribe to ticket updates', async () => {
      const ticketId = 'ticket-123';

      const response = await new Promise((resolve) => {
        client1.emit('subscribe:ticket', ticketId, (ack: any) => {
          resolve(ack);
        });
      });

      expect(response).toEqual({
        success: true,
        ticketId,
      });
    });

    it('should unsubscribe from ticket updates', async () => {
      const ticketId = 'ticket-123';

      // First subscribe
      await new Promise((resolve) => {
        client1.emit('subscribe:ticket', ticketId, (ack: any) => {
          resolve(ack);
        });
      });

      // Then unsubscribe
      const response = await new Promise((resolve) => {
        client1.emit('unsubscribe:ticket', ticketId, (ack: any) => {
          resolve(ack);
        });
      });

      expect(response).toEqual({
        success: true,
        ticketId,
      });
    });

    it('should subscribe contractor to job opportunities', async () => {
      const contractor = await createClient(
        testUsers.contractor.id,
        testUsers.contractor.role
      );

      const filters = { tradeCategory: 'plumbing', radius: 10 };

      const response = await new Promise((resolve) => {
        contractor.emit('subscribe:jobs', filters, (ack: any) => {
          resolve(ack);
        });
      });

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('room', 'jobs:plumbing');
      expect(response).toHaveProperty('filters');

      contractor.disconnect();
    });
  });

  /**
   * TEST GROUP 3: Notification Delivery
   */
  describe('Notification Delivery', () => {
    beforeEach(async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
    });

    it('should deliver notification to specific user', async () => {
      const notificationPromise = new Promise<NotificationPayload>((resolve) => {
        client1.on(NotificationEvent.TICKET_UPDATED, (data) => {
          resolve(data);
        });
      });

      const payload: NotificationPayload = {
        event: NotificationEvent.TICKET_UPDATED,
        userId: testUsers.tenant.id,
        data: { ticketId: 'ticket-123', status: 'assigned' },
        timestamp: new Date(),
      };

      gateway.notifyUser(testUsers.tenant.id, payload);

      const receivedNotification = await notificationPromise;

      expect(receivedNotification.event).toBe(NotificationEvent.TICKET_UPDATED);
      expect(receivedNotification.userId).toBe(testUsers.tenant.id);
      expect(receivedNotification.data.ticketId).toBe('ticket-123');
    });

    it('should deliver notification to ticket subscribers', async () => {
      const ticketId = 'ticket-456';

      // Subscribe to ticket
      await new Promise((resolve) => {
        client1.emit('subscribe:ticket', ticketId, (ack: any) => {
          resolve(ack);
        });
      });

      const notificationPromise = new Promise<NotificationPayload>((resolve) => {
        client1.on(NotificationEvent.TICKET_UPDATED, (data) => {
          resolve(data);
        });
      });

      const payload: NotificationPayload = {
        event: NotificationEvent.TICKET_UPDATED,
        userId: 'system',
        data: { ticketId, newStatus: 'in_progress' },
        timestamp: new Date(),
      };

      gateway.notifyTicket(ticketId, payload);

      const receivedNotification = await notificationPromise;
      expect(receivedNotification.data.ticketId).toBe(ticketId);
    });

    it('should deliver notification to multiple subscribers', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
      client2 = await createClient(testUsers.agent.id, testUsers.agent.role);

      const ticketId = 'ticket-multi-123';

      // Both subscribe to same ticket
      await Promise.all([
        new Promise((resolve) => {
          client1.emit('subscribe:ticket', ticketId, resolve);
        }),
        new Promise((resolve) => {
          client2.emit('subscribe:ticket', ticketId, resolve);
        }),
      ]);

      const promises = [
        new Promise((resolve) => {
          client1.on(NotificationEvent.TICKET_UPDATED, resolve);
        }),
        new Promise((resolve) => {
          client2.on(NotificationEvent.TICKET_UPDATED, resolve);
        }),
      ];

      const payload: NotificationPayload = {
        event: NotificationEvent.TICKET_UPDATED,
        userId: 'system',
        data: { ticketId, status: 'completed' },
        timestamp: new Date(),
      };

      gateway.notifyTicket(ticketId, payload);

      const [notification1, notification2] = await Promise.all(promises);

      expect(notification1).toBeDefined();
      expect(notification2).toBeDefined();
    });

    it('should broadcast notification to all clients', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
      client2 = await createClient(testUsers.contractor.id, testUsers.contractor.role);

      const promises = [
        new Promise((resolve) => {
          client1.on(NotificationEvent.TICKET_CREATED, resolve);
        }),
        new Promise((resolve) => {
          client2.on(NotificationEvent.TICKET_CREATED, resolve);
        }),
      ];

      const payload: NotificationPayload = {
        event: NotificationEvent.TICKET_CREATED,
        userId: 'system',
        data: { ticketId: 'broadcast-123', priority: 'urgent' },
        timestamp: new Date(),
      };

      gateway.broadcast(payload);

      const [notification1, notification2] = await Promise.all(promises);

      expect(notification1).toBeDefined();
      expect(notification2).toBeDefined();
    });
  });

  /**
   * TEST GROUP 4: Ping/Pong Health Check
   */
  describe('Connection Health Check', () => {
    beforeEach(async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
    });

    it('should respond to ping with pong', async () => {
      const pongPromise = new Promise((resolve) => {
        client1.emit('ping', (response: any) => {
          resolve(response);
        });
      });

      const response = await pongPromise;

      expect(response).toHaveProperty('event', 'pong');
      expect(response).toHaveProperty('timestamp');
    });

    it('should measure round-trip latency', async () => {
      const startTime = Date.now();

      await new Promise((resolve) => {
        client1.emit('ping', (response: any) => {
          resolve(response);
        });
      });

      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(100); // Should be < 100ms for local connection
      console.log(`⏱️  Round-trip latency: ${latency}ms`);
    });
  });

  /**
   * TEST GROUP 5: Statistics and Monitoring
   */
  describe('Gateway Statistics', () => {
    it('should track connection statistics', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);
      client2 = await createClient(testUsers.contractor.id, testUsers.contractor.role);

      const stats = gateway.getStats();

      expect(stats.totalConnections).toBeGreaterThanOrEqual(2);
      expect(stats.uniqueUsers).toBeGreaterThanOrEqual(2);
      expect(stats.rooms).toBeDefined();
    });

    it('should check if specific user is connected', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);

      const isConnected = gateway.isUserConnected(testUsers.tenant.id);
      expect(isConnected).toBe(true);

      const isNotConnected = gateway.isUserConnected('non-existent-user');
      expect(isNotConnected).toBe(false);
    });
  });

  /**
   * TEST GROUP 6: Ticket Status Change Notifications
   */
  describe('Ticket Status Change Notifications', () => {
    it('should notify all affected parties when ticket status changes', async () => {
      const tenantClient = await createClient(testUsers.tenant.id, testUsers.tenant.role);
      const contractorClient = await createClient(
        testUsers.contractor.id,
        testUsers.contractor.role
      );

      const ticketId = 'ticket-status-change-123';

      // Both subscribe to ticket
      await Promise.all([
        new Promise((resolve) => {
          tenantClient.emit('subscribe:ticket', ticketId, resolve);
        }),
        new Promise((resolve) => {
          contractorClient.emit('subscribe:ticket', ticketId, resolve);
        }),
      ]);

      const promises = [
        new Promise((resolve) => {
          tenantClient.on(NotificationEvent.TICKET_UPDATED, resolve);
        }),
        new Promise((resolve) => {
          contractorClient.on(NotificationEvent.TICKET_UPDATED, resolve);
        }),
      ];

      gateway.notifyTicketStatusChange(
        ticketId,
        'new',
        'assigned',
        [testUsers.tenant.id, testUsers.contractor.id]
      );

      const [notification1, notification2] = await Promise.all(promises);

      expect(notification1).toBeDefined();
      expect(notification2).toBeDefined();

      tenantClient.disconnect();
      contractorClient.disconnect();
    });
  });

  /**
   * TEST GROUP 7: Performance Tests
   */
  describe('Performance', () => {
    it('should handle 50 concurrent connections', async () => {
      const clients: ClientSocket[] = [];

      const startTime = Date.now();

      // Create 50 concurrent connections
      const connectionPromises = Array.from({ length: 50 }, (_, i) =>
        createClient(`user-perf-${i}`, 'tenant')
      );

      clients.push(...(await Promise.all(connectionPromises)));

      const duration = Date.now() - startTime;

      console.log(`⏱️  Connected 50 clients in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should connect in < 5 seconds

      // Cleanup
      clients.forEach((c) => c.disconnect());
    });

    it('should deliver 100 notifications in < 1 second', async () => {
      client1 = await createClient(testUsers.tenant.id, testUsers.tenant.role);

      let receivedCount = 0;

      client1.on(NotificationEvent.TICKET_UPDATED, () => {
        receivedCount++;
      });

      const startTime = Date.now();

      // Send 100 notifications
      for (let i = 0; i < 100; i++) {
        const payload: NotificationPayload = {
          event: NotificationEvent.TICKET_UPDATED,
          userId: testUsers.tenant.id,
          data: { notificationNumber: i },
          timestamp: new Date(),
        };

        gateway.notifyUser(testUsers.tenant.id, payload);
      }

      // Wait for all to be received
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;

      console.log(`⏱️  Delivered ${receivedCount} notifications in ${duration}ms`);
      expect(receivedCount).toBeGreaterThanOrEqual(95); // At least 95% delivered
      expect(duration).toBeLessThan(1000);
    });
  });
});
